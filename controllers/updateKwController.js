const axios = require('axios');
const moment = require('moment-timezone');
const generador = require('../models/generador');
const Credenciales = require('../models/credenciales');
const sendContracMessage = require('./generadorController');
const executeCommand = require('./sailsController');
const { decodeAddress } = require('@gear-js/api');
const { getDevicesByPlantList, getCarboonPlantData } = require('../helpers/growatt');

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
        const api = process.env.API_HM;

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
        const currentDate = moment().tz('America/Bogota').format('YYYY-MM-DD');

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

        while (!tokenEnviado && intentos < 3) { // Try up to 3 times before proceeding to the next token
            try {
                const wallet = decodeAddress(user.wallet);
                await executeCommand.executeCommand("GaiaService", "MintTokensToUser", [wallet, 1]);
                tokenEnviado = true;
                console.log(`Token ${i + 1} enviado a Usuario ${user.secret_name}`);
            } catch (error) {
                intentos++;
                console.error(`Error al enviar token ${i + 1} a Usuario ${user.secret_name}:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retrying
            }
        }

        if (!tokenEnviado) {
            console.error(`No se pudo enviar el token ${i + 1} a Usuario ${user.secret_name} después de varios intentos.`);
        }

        await new Promise(resolve => setTimeout(resolve, 3000)); // Additional wait of 3 second between each token sent
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

                tokens = Math.floor(kwGenerado / 1000); // 1 token per 1000 watts
                user.tokens += tokens;

                 // Verify and assign default values if necessary
                if (!user.departament) user.departament = "default_departament";
                if (!user.municipality) user.municipality = "default_municipality";

                await user.save();
                console.log(`Usuario ${user.name} actualizado con kwGenerado: ${user.generatedKW}`);
            } else if (user.brand === "Growatt") {
                try {
                    const [kwGeneradoGrowatt, c02Data] = await Promise.all([
                        getDevicesByPlantList(user.secret_name),
                        getCarboonPlantData(user.secret_name) // Example of another request
                    ]);

                    kwGenerado = parseInt(kwGeneradoGrowatt[0].eToday);
                    user.generatedKW += kwGenerado;

                    tokens = kwGenerado; // In the case of Growatt, kW is sent directly as tokens.
                    user.tokens += tokens;
                    user.c02 = c02Data.obj.co2;
                    user.rated_power = c02Data.obj.nominalPower;

                    // Verify and assign default values if necessary
                    if (!user.departament) user.departament = "default_departament";
                    if (!user.municipality) user.municipality = "default_municipality";

                    await user.save();
                    console.log(`Usuario ${user.name} actualizado con kwGenerado: ${user.generatedKW}`);
                } catch (error) {
                    console.error(`Error al actualizar datos de Growatt para el usuario ${user.name}:`, error.message);
                }
            }

            await sendTokens(user, tokens);
        }
    } catch (error) {
        console.error("Error al actualizar usuarios:", error.message);
    }
}

module.exports = { actualizarKwGeneradoParaUsuarios, updateKw };