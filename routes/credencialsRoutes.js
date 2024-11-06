const express = require('express');
const router = express.Router();
const credentialsController = require('../controllers/credencialController');

// Define la ruta y asocia el controlador
router.post('/', credentialsController.addUser);
router.get('/', credentialsController.getAllUsers);
router.delete('/:id', credentialsController.deleteUser);
router.put('/update', credentialsController.updatePasswords);

module.exports = router;
