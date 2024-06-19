const axios = require('axios');
const moment = require('moment-timezone');
const generador = require('../models/generador')
const Credenciales = require('../models/credenciales');
const sendContracMessage = require('./tokenController')

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
            {
                headers: {
                    'Cookie': cookie
                }
            }
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

        for (let user of users) {
            let kwGeneradoHoy = await updateKw(user.secret_name);

            // Convertir a número entero exacto
            kwGeneradoHoy = parseInt(kwGeneradoHoy);

            // Sumar el nuevo kW generado al valor existente en la base de datos
            const kwTotalActualizado = user.generatedKW + kwGeneradoHoy;

            user.generatedKW = kwTotalActualizado;
            const tokens = Math.floor(kwGeneradoHoy / 1000);
            const tokensAct = user.tokens + tokens
            user.tokens = tokensAct;
            await user.save();
            console.log(`Usuario ${user.name} actualizado con kwGenerado: ${kwTotalActualizado}`);

            for (let i = 0; i < tokens; i++) {
                let tokensEnviados = false;

                while (!tokensEnviados) {
                    try {
                        await sendContracMessage.sendMessageContract(user.wallet, 1, 1); 
                        tokensEnviados = true;
                        console.log(`Token ${i + 1} enviado a Usuario ${user.name}`);
                    } catch (error) {
                        console.error(`Error al enviar token ${i + 1} a Usuario ${user.name}:`, error.message);
                        // Esperar 1 segundo antes de intentar de nuevo
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                // Esperar 3 segundos antes de enviar el siguiente token
                console.log("waiting");
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        console.log('Todos los usuarios han sido actualizados correctamente.');
    } catch (error) {
        console.error('Error al actualizar usuarios:', error.message);
    }
}

module.exports = { actualizarKwGeneradoParaUsuarios, updateKw };
