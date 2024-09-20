// controllers/growattController.js
const { getDevicesByPlantList, getCarboonPlantData, getMAXDayChart,getAllPlants } = require('../helpers/growatt');


// Envolver axios con soporte para cookies



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



exports.combinedPlantDataController = async (req, res) => {
  const  {user_client}  = req.body;

  if (!user_client) {
    return res.status(400).json({ message: 'Plant ID y Date son requeridos' });
  }

  try {
    const devices = await getDevicesByPlantList(user_client);
    const plantData = await getCarboonPlantData(user_client);
    const maxDayChart = await getMAXDayChart(user_client);

    // Combinar las respuestas
    const combinedResponse = {
      devices,
      plantData,
      maxDayChart,
    };

    res.status(200).json(combinedResponse);
  } catch (error) {
    console.error('Error en la combinación de datos:', error.message);
    res.status(500).json({ message: 'Error al obtener los datos combinados' });
  }
};