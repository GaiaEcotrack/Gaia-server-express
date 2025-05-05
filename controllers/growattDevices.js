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
    res.status(500).json({ error: 'Error al obtener la lista de plantas' });
  }
};


//combinamos la informacion mas relevantes de los dispositivos pasandole por body la credencial del usuario
exports.combinedPlantDataController = async (req, res) => {
  const { user_client } = req.body;

  try {
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
      getMAXDayChart(user_client),
      getDataLog(user_client),
      getMAXMonthChart(user_client),
      getMAXYearChart(user_client)
    ]);

    const combinedResponse = { devices, plantData, maxDayChart, deviceLogs, maxMonthChart, maxYearChart };
    res.status(200).json({ data: combinedResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al obtener datos' });
  }
};