const express = require('express');
const router = express.Router();
const apiController = require('../controllers/HoymilesDevices');
const growattController = require('../controllers/growattDevices');

//HoyMiiles
router.post('/real-time-data', apiController.getDataFromExternalApi);
router.post('/device-info/hoymiles',apiController.getDataOfDevice)

//Growatt
router.post('/plant-info/growatt',growattController.getPlantListTitle)
router.post('/real-time-data/growatt', growattController.combinedPlantDataController);


module.exports = router;
