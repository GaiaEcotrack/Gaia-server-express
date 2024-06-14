const express = require('express');
const router = express.Router();
const apiController = require('../controllers/HoymilesDevices');

// Define la ruta y asocia el controlador
router.post('/real-time-data', apiController.getDataFromExternalApi);

module.exports = router;
