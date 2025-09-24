// controllers/growattController.js
const { getDevicesByPlantList, getCarboonPlantData, getMAXDayChart,getAllPlants, getDataLog,getMAXMonthChart,getMAXYearChart } = require('../helpers/growatt');


// Envolver axios con soporte para cookies


//Obtenemos las plantas del usuario
 exports.getPlantListTitle = async (req, res) => {
  const {user_client} = req.body
  try {
    const response = await getAllPlants(user_client)
    // Responder con los datos obtenidos
    res.status(200).json({plants:response});

  } catch (error) {
    // Manejo de errores
    console.error('Error al obtener la lista de plantas:', error.message);
    return res.status(500).json({ error: 'Error al obtener la lista de plantas' });
  }
};

// Combinamos la información más relevante de los dispositivos pasándole por body la credencial del usuario
exports.combinedPlantDataController = async (req, res) => {
  const { user_client } = req.body;

  try {
    // Wrapper para evitar que errores en funciones específicas rompan el Promise.all
    const safe = async (fn) => {
      try { return await fn(); } catch (e) { return null; }
    };

    const [
      devices, 
      plantData, 
      maxDayChart, 
      deviceLogs, 
      maxMonthChart, 
      maxYearChart
    ] = await Promise.all([
      getDevicesByPlantList(user_client),
      getCarboonPlantData(user_client),
      safe(() => getMAXDayChart(user_client)),
      getDataLog(user_client),
      safe(() => getMAXMonthChart(user_client)),
      safe(() => getMAXYearChart(user_client))
    ]);

    const combinedResponse = { devices, plantData, maxDayChart, deviceLogs, maxMonthChart, maxYearChart };
    return res.status(200).json({ data: combinedResponse });
  } catch (error) {
    console.error('Error en combinedPlantDataController:', error);
    return res.status(500).json({ message: 'Error al obtener datos' });
  }
};