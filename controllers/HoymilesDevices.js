const axios = require('axios');
const moment = require('moment-timezone');
const Credenciales = require('../models/credenciales');

let cachedToken = null;
let tokenExpiry = null;

const getToken = async (user_name, password, api) => {
    if (cachedToken && tokenExpiry && tokenExpiry > Date.now()) {
        return cachedToken;
    }

    const authResponse = await axios.post(`${api}/iam/pub/0/auth/login`, {
        user_name,
        password
    });

    if (authResponse.data.status !== "0") {
        throw new Error('Autenticación fallida');
    }

    cachedToken = authResponse.data.data.token;
    tokenExpiry = Date.now() + 3600 * 1000; // Suponiendo que el token dura 1 hora
    return cachedToken;
};

const getDataFromExternalApi = async (req, res) => {
    try {
        const api = process.env.API_HM;
        const { user_name } = req.body;

        if (!user_name) {
            return res.status(400).send('Se requiere username');
        }

        const user = await Credenciales.findOne({ username: user_name });
        if (!user) {
            return res.status(401).send('Usuario no encontrado');
        }

        const token = await getToken(user_name, user.password, api);

        const [initialResponse, currentDate] = await Promise.all([
            axios.post(`${api}/pvm/api/0/station/select_by_page`, {
                page: 1,
                page_size: 1
            }, {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                }
            }),
            moment().tz('America/Bogota').format('YYYY-MM-DD')
        ]);

        if (initialResponse.data.status !== "0") {
            return res.status(500).send('Error al obtener datos iniciales');
        }

        const sid = initialResponse.data.data.list[0].id;

        const response = await axios.post(`${api}/pvm-data/api/0/station/data/count_station_real_data`, {
            sid,
            mode: 1,
            date: currentDate
        }, {
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error message:', error.message);
        res.status(500).send('Error al obtener datos de la API externa');
    }
};

const getDataOfDevice = async (req, res) => {
    try {
        const api = process.env.API_HM;
        const { user_name } = req.body;

        if (!user_name) {
            return res.status(400).send('Se requiere username');
        }

        const user = await Credenciales.findOne({ username: user_name });
        if (!user) {
            return res.status(401).send('Usuario no encontrado');
        }

        const token = await getToken(user_name, user.password, api);

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
            return res.status(500).send('Error al obtener datos iniciales');
        }

        const sid = initialResponse.data.data.list[0].id;

        const response = await axios.post(`${api}/pvm/api/0/station/select_device_of_tree`, {
            id: sid
        }, {
            headers: {
                Authorization: token
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error al obtener datos de la API externa');
    }
};

module.exports = {
    getDataFromExternalApi,
    getDataOfDevice
};