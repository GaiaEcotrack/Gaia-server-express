const express = require('express');
const router = express.Router();
const generatorController = require('../controllers/generadorController');

// Ruta para registrar kW generados
router.post('/generate', generatorController.generateKW);

// Ruta para obtener los tokens del usuario
router.get('/tokens/:userId', generatorController.getUserTokens);

// Ruta para obtener todos los usuarios
router.get('/users', generatorController.getAllUsers);


// Ruta para obtener los usuarios por pais y su generacion
router.get('/users/country/:country', generatorController.getUserByCountry);

// Ruta para obtener los usuarios por departamento
router.get('/users/departament/:departament', generatorController.getUserByDepartament);

// Ruta para agregar un nuevo usuario
router.post('/users', generatorController.addUser);

router.delete('/users/:id', generatorController.deleteUser);
router.delete('/users', generatorController.deleteAllUsers);
router.put('/users/:id',generatorController.updateUser)
// router.get('/users/update',generatorController.updateUsersWallet)


// ruta para filtrar usuarios segun empresa instaladora
router.get('/byinstaller/:installation_company', generatorController.getUsersByInstaller);
// router.get('/createall', generatorController.createUsers);
// router.get('/count', generatorController.countUsers);


module.exports = router;
