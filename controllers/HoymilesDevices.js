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



async function authenticateUser(req, res) {
    const api = process.env.API_HM;
    const { user_name } = req.body;

    if (!user_name) {
        res.status(400).send('Se requiere username');
        return null;
    }

    const user = await Credenciales.findOne({ username: user_name });
    if (!user) {
        res.status(401).send('Usuario no encontrado');
        return null;
    }

    const token = await getToken(user_name, user.password, api);
    return { api, token };
}

async function getStationId(api, token) {
    const stationResponse = await axios.post(`${api}/pvm/api/0/station/select_by_page`, {
        page: 1,
        page_size: 1
    }, {
        headers: {
            Authorization: token,
            "Content-Type": "application/json",
        }
    });

    if (stationResponse.data.status !== "0") {
        throw new Error('Error al obtener estación');
    }

    return stationResponse.data.data.list[0].id;
}

// Función principal combinada
const getCombinedEnergyData = async (req, res) => {
    try {
        // Autenticación común
        const auth = await authenticateUser(req, res);
        if (!auth) return;
        const { api, token } = auth;

        // Obtener SID de la estación
        const sid = await getStationId(api, token);

        // Configuración de fechas
        const currentDate = moment().tz('America/Bogota');
        const currentMonth = currentDate.format('YYYY-MM-DD');
        const currentYear = currentDate.format('YYYY-MM-DD');

        // Realizar llamadas a la API
        const [hourDataResponse, dayDataResponse, monthDataResponse, realTimeResponse , deviceData] = await Promise.all([
            // Datos por hora (de getAllEnergyData)
            axios.post(`${api}/pvm-data/api/0/station/data/count_station_real_data`, {
                sid,
                mode: 1,
                date: currentMonth
            }, {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                }
            }),

            // Datos por día (de getAllEnergyData)
            axios.post(`${api}/pvm-data/api/0/station/data/count_station_real_data`, {
                sid,
                type: 3, // diario
                date: currentMonth
            }, {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                }
            }),

            // Datos por mes (de getAllEnergyData)
            axios.post(`${api}/pvm-data/api/0/station/data/count_station_real_data`, {
                sid,
                type: 4, // anual
                date: currentYear
            }, {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                }
            }),

            // Datos en tiempo real (de getDataFromExternalApi)
            axios.post(`${api}/pvm-data/api/0/station/data/count_station_real_data`, {
                sid,
                mode: 1,
                date: currentMonth
            }, {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                }
            }),

            axios.post(`${api}/pvm/api/0/station/select_device_of_tree`, {
                id:sid,
            }, {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                }
            })
        ]);

        // Procesamiento de datos (de getAllEnergyData)
        const hourData = hourDataResponse.data.data;
        const todayEqWh = parseFloat(hourData.today_eq);
        const dataTime = new Date(hourData.data_time);
        const startOfDay = new Date(dataTime);
        startOfDay.setHours(0, 0, 0, 0);
        const minutesSinceMidnight = (dataTime - startOfDay) / (1000 * 60);
        const currentBlockIndex = Math.floor(minutesSinceMidnight / 5);
        const energyPerHourArray = Array(288).fill(null);

        const minGenerationHour = 6;
        const minBlockIndex = minGenerationHour * 60 / 5;

        if (currentBlockIndex >= minBlockIndex) {
            const blocksWithGeneration = currentBlockIndex - minBlockIndex + 1;
            const whPerBlock = todayEqWh / blocksWithGeneration;
            const kwPerBlock = whPerBlock / 1000;

            for (let i = minBlockIndex; i <= currentBlockIndex; i++) {
                energyPerHourArray[i] = parseFloat(kwPerBlock.toFixed(2));
            }
        }

        // Procesar los datos del día
        const dayData = dayDataResponse.data.data;
        const dayEqWh = parseFloat(dayData.today_eq);
        const dayEnergyArray = Array(30).fill(null);
        const currentDay = currentDate.date();
        const daysSinceStart = currentDay;
        const dailyAvgEnergyWh = dayEqWh / daysSinceStart;

        for (let i = 0; i < daysSinceStart; i++) {
            dayEnergyArray[i] = parseFloat((dailyAvgEnergyWh / 1000).toFixed(2));
        }

        // Procesar los datos del mes
        const monthData = monthDataResponse.data.data;
        const monthEqWh = parseFloat(monthData.month_eq);
        const currentMonthNumber = currentDate.month() + 1;
        const energyPerMonthArray = [];

        for (let i = 0; i < currentMonthNumber; i++) {
            const monthlyAvgEnergyWh = (monthEqWh / currentMonthNumber) / 1000;
            energyPerMonthArray.push(parseFloat(monthlyAvgEnergyWh.toFixed(2)));
        }

        for (let i = currentMonthNumber; i < 12; i++) {
            energyPerMonthArray.push(null);
        }

        // Datos de la API externa (de getDataFromExternalApi)
        const realTimeData = realTimeResponse.data;

        // Respuesta combinada
        res.json({
            energyPerHourArray,
            dayEnergyArray,
            energyPerMonthArray,
            realTimeData,
            deviceData: deviceData.data,
        });

    } catch (error) {
        console.error('Error al obtener los datos combinados:', error.message);
        res.status(500).send('Error al procesar los datos de energía combinados');
    }
};



module.exports = {
    getCombinedEnergyData,
    getDataOfDevice,
    


};