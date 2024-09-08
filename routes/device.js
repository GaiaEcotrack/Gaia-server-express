const express = require('express');
const router = express.Router();
const apiController = require('../controllers/HoymilesDevices');

// Define la ruta y asocia el controlador
router.post('/real-time-data', apiController.getDataFromExternalApi);
router.post('/device-info/hoymiles',apiController.getDataOfDevice)

module.exports = router;
