const axios = require('axios');
const moment = require('moment-timezone');
const generador = require('../models/generador');
const Credenciales = require('../models/credenciales');
const sendContracMessage = require('./generadorController');
const executeCommand = require('./sailsController');
const { decodeAddress } = require('@gear-js/api');
const { getDevicesByPlantList, getCarboonPlantData } = require('../helpers/growatt');

// Configuración y constantes
const CONFIG = {
    API_HM: process.env.API_HM,
    TIMEZONE: process.env.TIMEZONE || 'America/Bogota',
    MAX_TOKEN_SEND_RETRIES: 3,
    DELAY_BETWEEN_TOKENS: 3000,
    DELAY_BETWEEN_RETRIES: 3000,
    TOKENS_PER_KW_HOYmiles: 1000, // 1 token por cada 1000W para Hoymiles (kW)
    TOKENS_PER_KW_GROWATT: 1, // 1 token por cada 1W para Growatt (ya en W)
    SUPPORTED_BRANDS: ['Hoymiles', 'Growatt'],
    DEFAULT_VALUES: {
        departament: 'default_departament',
        municipality: 'default_municipality'
    }
};

// Funciones de validación
const validateUserData = (user) => {
    if (!user || !user.secret_name) {
        throw new Error('Usuario o secret_name inválido');
    }

    if (!CONFIG.SUPPORTED_BRANDS.includes(user.brand)) {
        throw new Error(`Marca ${user.brand} no soportada. Marcas válidas: ${CONFIG.SUPPORTED_BRANDS.join(', ')}`);
    }

    return true;
};

const validateKwValue = (kwValue) => {
    const kw = parseFloat(kwValue);
    if (isNaN(kw) || kw < 0) {
        throw new Error(`Valor de kW inválido: ${kwValue}`);
    }
    return kw;
};

const assignDefaultValues = (user) => {
    Object.keys(CONFIG.DEFAULT_VALUES).forEach(key => {
        if (!user[key]) {
            user[key] = CONFIG.DEFAULT_VALUES[key];
        }
    });
};

const calculateTokens = (kwGenerado, brand) => {
    const kw = validateKwValue(kwGenerado);

    switch (brand) {
        case 'Hoymiles':
            return Math.floor(kw / CONFIG.TOKENS_PER_KW_HOYmiles); // kW -> divide por 1000
        case 'Growatt':
            return Math.floor(kw / CONFIG.TOKENS_PER_KW_GROWATT); // W -> divide por 1
        default:
            throw new Error(`Marca ${brand} no soportada para cálculo de tokens`);
    }
};

const processHoymilesUser = async (user) => {
    validateUserData(user);

    const kwGeneradoHoymiles = await updateKw(user.secret_name);
    const kwGenerado = validateKwValue(kwGeneradoHoymiles);

    user.generatedKW += kwGenerado;
    user.tokens += calculateTokens(kwGenerado, 'Hoymiles');
    assignDefaultValues(user);

    await user.save();

    return calculateTokens(kwGenerado, 'Hoymiles');
};

const processGrowattUser = async (user) => {
    validateUserData(user);

    const [kwGeneradoGrowatt, c02Data] = await Promise.all([
        getDevicesByPlantList(user.secret_name),
        getCarboonPlantData(user.secret_name)
    ]);

    const kwGenerado = validateKwValue(kwGeneradoGrowatt[0].eToday);
    const tokens = calculateTokens(kwGenerado, 'Growatt');

    user.generatedKW += kwGenerado;
    user.tokens += tokens;
    user.c02 = c02Data.obj.co2;
    user.rated_power = c02Data.obj.nominalPower;
    assignDefaultValues(user);

    await user.save();

    return tokens;
};

const authenticateUser = async (username, password, api) => {
    try {
        const authResponse = await axios.post(`${api}/iam/pub/0/auth/login`, {
            user_name: username,
            password
        });

        if (authResponse.data.status !== "0") {
            throw new Error('Autenticación fallida');
        }

        return authResponse.data.data.token;
    } catch (error) {
        throw new Error('Error en la autenticación del usuario');
    }
};

const fetchData = async (api, token, sid, currentDate) => {
    try {
    

        const response = await axios.post(`${api}/pvm-data/api/0/station/data/count_station_real_data`, 
            { sid, mode: 1, date: currentDate }, 
            { headers: { Authorization:token , "Content-Type": "application/json" } }
        );

        if (response.data.status !== "0") {
            throw new Error('Error al obtener datos de la API externa');
        }

        return response.data.data.today_eq;
    } catch (error) {
        throw new Error('Error al obtener datos de la API externa');
    }
};

const updateKw = async (username) => {
    try {
        const api = CONFIG.API_HM;

        if (!username) {
            throw new Error('Se requiere username');
        }

        const user = await Credenciales.findOne({ username });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const token = await authenticateUser(username, user.password, api);

        const initialResponse = await axios.post(`${api}/pvm/api/0/station/select_by_page`, {
            page: 1,
            page_size: 1
        }, {
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            }
        });

        if (initialResponse.data.status !== "0") {
            throw new Error('Error al obtener datos iniciales');
        }

        const sid = initialResponse.data.data.list[0].id;
        const currentDate = moment().tz(CONFIG.TIMEZONE).format('YYYY-MM-DD');

        return await fetchData(api, token, sid, currentDate);

    } catch (error) {
        console.error(error.message);
        throw new Error('Error al obtener datos de la API externa');
    }
};

const sendTokens = async (user, tokens) => {
    for (let i = 0; i < tokens; i++) {
        let tokenEnviado = false;
        let intentos = 0;

        while (!tokenEnviado && intentos < CONFIG.MAX_TOKEN_SEND_RETRIES) {
            try {
                const wallet = decodeAddress(user.wallet);
                await executeCommand.executeCommand("GaiaService", "MintTokensToUser", [wallet, 1]);
                tokenEnviado = true;
                console.log(`Token ${i + 1} enviado a Usuario ${user.secret_name}`);
            } catch (error) {
                intentos++;
                console.error(`Error al enviar token ${i + 1} a Usuario ${user.secret_name}:`, error.message);
                await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_RETRIES));
            }
        }

        if (!tokenEnviado) {
            console.error(`No se pudo enviar el token ${i + 1} a Usuario ${user.secret_name} después de varios intentos.`);
        }

        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_TOKENS));
    }
};

async function actualizarKwYEnviarTokens() {
    try {
        console.log("🚀 Iniciando actualización de kW y envío de tokens...\n");

        const users = await generador.find();
        await executeCommand.initializeConnection();

        const updateResults = [];

        // FASE 1: Actualizar kW de todos los usuarios
        console.log(`📊 FASE 1: Actualizando kW de ${users.length} usuarios...\n`);

        for (let user of users) {
            try {
                let tokens = 0;

                switch (user.brand) {
                    case "Hoymiles":
                        tokens = await processHoymilesUser(user);
                        break;
                    case "Growatt":
                        tokens = await processGrowattUser(user);
                        break;
                    default:
                        console.warn(`⚠️  Marca ${user.brand} no soportada para usuario ${user.name || user.secret_name}`);
                        updateResults.push({
                            user: user.name || user.secret_name,
                            success: false,
                            error: `Marca ${user.brand} no soportada`
                        });
                        continue;
                }

                updateResults.push({
                    user: user.name || user.secret_name,
                    success: true,
                    tokens,
                    brand: user.brand
                });

                console.log(`✅ ${user.name || user.secret_name} (${user.brand}): ${tokens} tokens calculados`);

            } catch (error) {
                updateResults.push({
                    user: user.name || user.secret_name,
                    success: false,
                    error: error.message,
                    brand: user.brand
                });
                console.error(`❌ Error actualizando ${user.name || user.secret_name} (${user.brand}): ${error.message}`);
            }
        }

        // Mostrar resumen de la FASE 1
        const successfulUpdates = updateResults.filter(r => r.success);
        const failedUpdates = updateResults.filter(r => !r.success);

        console.log(`\n📊 RESUMEN FASE 1 - ACTUALIZACIÓN kW:`);
        console.log(`✅ Usuarios exitosos: ${successfulUpdates.length}`);
        console.log(`❌ Usuarios con error: ${failedUpdates.length}`);

        if (failedUpdates.length > 0) {
            console.log(`\n❌ ERRORES DETECTADOS:`);
            failedUpdates.forEach(result => {
                console.log(`   - ${result.user} (${result.brand}): ${result.error}`);
            });
        }

        // FASE 2: Solo enviar tokens si hay usuarios exitosos
        if (successfulUpdates.length > 0) {
            console.log(`\n🚀 FASE 2: Enviando tokens para ${successfulUpdates.length} usuarios exitosos...`);

            for (let result of successfulUpdates) {
                try {
                    const user = users.find(u => (u.name || u.secret_name) === result.user);
                    await sendTokens(user, result.tokens);
                    console.log(`✅ Tokens enviados a ${result.user}: ${result.tokens} tokens`);
                } catch (error) {
                    console.error(`❌ Error enviando tokens a ${result.user}: ${error.message}`);
                }
            }
        } else {
            console.log(`\n⚠️  No hay usuarios exitosos para enviar tokens`);
        }

        console.log(`\n🎉 Procesamiento completado!`);
        console.log(`   - kW actualizados: ${successfulUpdates.length}`);
        console.log(`   - Errores en kW: ${failedUpdates.length}`);
        console.log(`   - Tokens enviados: ${successfulUpdates.length}`);

    } catch (error) {
        console.error("💥 Error general en el proceso:", error.message);
        throw error;
    }
}

// Mantener el nombre original para compatibilidad
async function actualizarKwGeneradoParaUsuarios() {
    return actualizarKwYEnviarTokens();
}

module.exports = { actualizarKwGeneradoParaUsuarios, actualizarKwYEnviarTokens, updateKw };