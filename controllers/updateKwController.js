const axios = require('axios');
const moment = require('moment-timezone');
const generador = require('../models/generador');
const Credenciales = require('../models/credenciales');
const sendContracMessage = require('./tokenController');
const executeCommand = require('./sailsController')
const {decodeAddress} = require('@gear-js/api');
const { getDevicesByPlantList,getCarboonPlantData } = require('../helpers/growatt');

const updateKw = async (username) => {
    try {
        const api = process.env.API_HM;

        if (!username) {
            throw new Error('Se requiere username');
        }

        const user = await Credenciales.findOne({ username });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const password = user.password;

        const authResponse = await axios.post(`${api}/iam/auth_login`, {
            user_name: username,
            password
        });

        if (authResponse.data.status !== "0") {
            throw new Error('Autenticación fallida');
        }

        const token = authResponse.data.data.token;

        const cookie = `_ga=GA1.1.932132531.1716916654; hm_token_language=es_es; hm_token=${token}; _ga_JRG1385S8G=GS1.1.1718377381.11.1.1718377664.0.0.0`;

        const initialResponse = await axios.post(`${api}/pvm/station_select_by_page`, {
            page: 1,
            page_size: 1
        }, {
            headers: {
                'Cookie': cookie
            }
        });

        if (initialResponse.data.status !== "0") {
            throw new Error('Error al obtener datos iniciales');
        }

        const sid = initialResponse.data.data.list[0].id;

        const currentDate = moment().tz('America/Bogota').format('YYYY-MM-DD');

        const response = await axios.post(`${api}/pvm-data/data_count_station_real_data`, 
            { sid, mode: 1, date: currentDate }, 
            { headers: { 'Cookie': cookie } }
        );

        return response.data.data.today_eq;

    } catch (error) {
        console.error(error.message);
        throw new Error('Error al obtener datos de la API externa');
    }
};

async function actualizarKwGeneradoParaUsuarios() {
    try {
        const users = await generador.find();
        await executeCommand.initializeConnection();

        for (let user of users) {
            let kwGenerado = 0;
            let tokens = 0;

            if (user.brand === "Hoymiles") {
                let kwGeneradoHoymiles = await updateKw(user.secret_name);
                kwGenerado = parseInt(kwGeneradoHoymiles);
                user.generatedKW += kwGenerado;

                tokens = Math.floor(kwGenerado / 1000); // 1 token por cada 1000kW
                user.tokens += tokens;

                await user.save();
                console.log(`Usuario ${user.name} actualizado con kwGenerado: ${user.generatedKW}`);
            } else if (user.brand === "Growatt") {
                try {
                    const [kwGeneradoGrowatt, c02Data] = await Promise.all([
                        getDevicesByPlantList(user.secret_name),
                        getCarboonPlantData(user.secret_name) // Ejemplo de otra petición
                    ]);
            
                    kwGenerado = parseInt(kwGeneradoGrowatt[0].eToday);
                    user.generatedKW += kwGenerado;
    
                    tokens = kwGenerado; // En el caso de Growatt, se envían los kW directamente como tokens
                    user.tokens += tokens;
                    user.c02 =c02Data.obj.co2
                    user.rated_power=c02Data.obj.nominalPower
    
                    await user.save();
                    console.log(`Usuario ${user.name} actualizado con kwGenerado: ${user.generatedKW}`);   
                } catch (error) {
                    console.error(`Error al actualizar datos de Growatt para el usuario ${user.name}:`, error.message); 
                }
            }

            // Enviar tokens al usuario
            for (let i = 0; i < tokens; i++) {
                let tokenEnviado = false;
                let intentos = 0;

                while (!tokenEnviado && intentos < 3) { // Intentar hasta 3 veces antes de seguir con el siguiente token
                    try {
                        const wallet = decodeAddress(user.wallet);
                        await executeCommand.executeCommand("GaiaService", "MintTokensToUser", [wallet, 1]);
                        tokenEnviado = true;
                        console.log(`Token ${i + 1} enviado a Usuario ${user.name}`);
                    } catch (error) {
                        intentos++;
                        console.error(`Error al enviar token ${i + 1} a Usuario ${user.name}:`, error.message);
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Espera de 3 segundos antes de reintentar
                    }
                }

                if (!tokenEnviado) {
                    console.error(`No se pudo enviar el token ${i + 1} a Usuario ${user.name} después de varios intentos.`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000)); // Espera adicional de 1 segundo entre cada token enviado
            }
        }

        console.log('Todos los usuarios han sido actualizados correctamente.');
    } catch (error) {
        console.error('Error al actualizar usuarios:', error.message);
    }
}

module.exports = { actualizarKwGeneradoParaUsuarios, updateKw };
