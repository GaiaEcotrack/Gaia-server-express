const axios = require('axios');
const moment = require('moment-timezone');

// OBTENER DATOS GENERADOS DEL DISPOSITIVO
const getDataFromExternalApi = async (req, res) => {
    try {
        const api = process.env.API_HM;

        // Obtén el username y la password del cuerpo de la solicitud
        const { user_name, password } = req.body;

        // Verifica que se hayan proporcionado el username y la password
        if (!user_name || !password) {
            return res.status(400).send('Se requiere username y password');
        }

        // Realiza la solicitud para obtener el token
        const authResponse = await axios.post(`${api}/iam/auth_login`, {
            user_name,
            password
        });

        // Verifica si la autenticación fue exitosa
        if (authResponse.data.status !== "0") {
            return res.status(401).send('Autenticación fallida');
        }

        // Obtén el token del cuerpo de la respuesta
        const token = authResponse.data.data.token;

        // Configura la cookie que necesitas enviar
        const cookie = `_ga=GA1.1.932132531.1716916654; hm_token_language=es_es; hm_token=${token}; _ga_JRG1385S8G=GS1.1.1718377381.11.1.1718377664.0.0.0`;

        // Realiza la solicitud inicial para obtener el ID
        const initialResponse = await axios.post(`${api}/pvm/station_select_by_page`, {
            page: 1,
            page_size: 1
        }, {
            headers: {
                'Cookie': cookie
            }
        });

        // Verifica si la solicitud inicial fue exitosa
        if (initialResponse.data.status !== "0") {
            return res.status(500).send('Error al obtener datos iniciales');
        }

        // Obtiene el ID necesario para la siguiente solicitud
        const sid = initialResponse.data.data.list[0].id; // Aquí obtienes el ID

        // Obtén la fecha actual en la zona horaria de Colombia en formato YYYY-MM-DD
        const currentDate = moment().tz('America/Bogota').format('YYYY-MM-DD');

        // Realiza la solicitud a la API externa con axios usando el SID obtenido
        const response = await axios.post(`${api}/pvm-data/data_count_station_real_data`,
            { sid, mode: 1, date: currentDate },
            {
                headers: {
                    'Cookie': cookie
                }
            }
        );

        // Envía la respuesta de la API externa al cliente
        res.json(response.data);
    } catch (error) {
        // Maneja errores
        console.error(error);
        res.status(500).send('Error al obtener datos de la API externa');
    }
};

// Exporta la función para usarla en las rutas
module.exports = {
    getDataFromExternalApi,
};
