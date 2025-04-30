const axios = require('axios');
const moment = require('moment-timezone');

const Credenciales = require('../models/credenciales');
const { log } = require('async');

// Configurar la URL de conexión a MongoDB y la base de datos

// OBTENER DATOS GENERADOS DEL DISPOSITIVO
const getDataFromExternalApi = async (req, res) => {
    let client;

    try {
        const api = process.env.API_HM;

        // Obtén el username del cuerpo de la solicitud
        const { user_name } = req.body;

        // Verifica que se haya proporcionado el username
        if (!user_name) {
            return res.status(400).send('Se requiere username');
        }

        // Buscar las credenciales en la base de datos
        const user = await Credenciales.findOne({ username: user_name });

        if (!user) {
            console.log(user);
            return res.status(401).send('Usuario no encontrado');
        }

        // Usa la contraseña almacenada en la base de datos
        const password = user.password;

        // Realiza la solicitud para obtener el token
        const authResponse = await axios.post(`${api}/iam/pub/0/auth/login`, {
            user_name,
            password
        });

        // Verifica si la autenticación fue exitosa
        if (authResponse.data.status !== "0") {
            return res.status(401).send('Autenticación fallida');
        }

        // Obtén el token del cuerpo de la respuesta
        const token = authResponse.data.data.token;

        // Realiza la solicitud inicial para obtener el ID
        const initialResponse = await axios.post(`${api}/pvm/api/0/station/select_by_page`, {
            page: 1,
            page_size: 1
        }, {
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            }
        });

        // Verifica si la solicitud inicial fue exitosa
        if (initialResponse.data.status !== "0") {
            console.log(initialResponse.data);
            
            return res.status(500).send('Error al obtener datos iniciales');
        }

        // Obtiene el ID necesario para la siguiente solicitud
        const sid = initialResponse.data.data.list[0].id;

        

        // Obtén la fecha actual en la zona horaria de Colombia en formato YYYY-MM-DD
        const currentDate = moment().tz('America/Bogota').format('YYYY-MM-DD');

        // Realiza la solicitud a la API externa con axios usando el SID obtenido
        const response = await axios.post(`${api}/pvm-data/api/0/station/data/count_station_real_data`,
            { sid, mode: 1, date: currentDate },
            {
                headers: {
                    Authorization: `${token}`,
                    "Content-Type": "application/json",
                }
            }
        );

        // Envía la respuesta de la API externa al cliente
        res.json(response.data);
    } catch (error) {
        // Maneja errores
        console.error('Error message:', error.message);
        
        res.status(500).send('Error al obtener datos de la API externa');
    } finally {
        // Asegúrate de cerrar la conexión a la base de datos
        if (client) {
            await client.close();
        }
    }
};


const getDataOfDevice = async (req, res) => {
    let client;

    try {
        const api = process.env.API_HM;

        // Obtén el username del cuerpo de la solicitud
        const { user_name } = req.body;

        // Verifica que se haya proporcionado el username
        if (!user_name) {
            return res.status(400).send('Se requiere username');
        }


        // Buscar las credenciales en la base de datos
        const user = await Credenciales.findOne({ username: user_name });


        if (!user) {
            console.log(user);
            return res.status(401).send('Usuario no encontrado');
        }

        // Usa la contraseña almacenada en la base de datos
        const password = user.password;

        // Realiza la solicitud para obtener el token
        const authResponse = await axios.post(`${api}/iam/pub/0/auth/login`, {
            user_name,
            password
        });

        // Verifica si la autenticación fue exitosa
        if (authResponse.data.status !== "0") {
            return res.status(401).send('Autenticación fallida');
        }

        // Obtén el token del cuerpo de la respuesta
        const token = authResponse.data.data.token;

    

        // Realiza la solicitud inicial para obtener el ID
        const initialResponse = await axios.post(`${api}/pvm/api/0/station/select_by_page`, {
            page: 1,
            page_size: 1
        }, {
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            }
        });

        // Verifica si la solicitud inicial fue exitosa
        if (initialResponse.data.status !== "0") {
            console.log(initialResponse);
            
            return res.status(500).send('Error al obtener datos iniciales');
        }

        // Obtiene el ID necesario para la siguiente solicitud
        const sid = initialResponse.data.data.list[0].id; // Aquí obtienes el ID

        // Obtén la fecha actual en la zona horaria de Colombia en formato YYYY-MM-DD
        // const currentDate = moment().tz('America/Bogota').format('YYYY-MM-DD');

        // Realiza la solicitud a la API externa con axios usando el SID obtenido
        const response = await axios.post(`${api}/pvm/api/0/station/select_device_of_tree`,
            {id:sid},
            {
                headers: {
                    Authorization: token
                }
            }
        );

        // Envía la respuesta de la API externa al cliente
        res.json(response.data);
    } catch (error) {
        // Maneja errores
        console.error(error);
        res.status(500).send('Error al obtener datos de la API externa');
    } finally {
        // Asegúrate de cerrar la conexión a la base de datos
        if (client) {
            await client.close();
        }
    }
};

// Exporta la función para usarla en las rutas
module.exports = {
    getDataFromExternalApi,
    getDataOfDevice
};
