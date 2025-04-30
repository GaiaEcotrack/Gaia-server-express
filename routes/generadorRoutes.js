const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/generadorController');

// Ruta para registrar kW generados
router.post('/generate', tokenController.generateKW);

// Ruta para obtener los tokens del usuario
router.get('/tokens/:userId', tokenController.getUserTokens);

// Ruta para obtener todos los usuarios
router.get('/users', tokenController.getAllUsers);


// Ruta para obtener los usuarios por pais y su generacion
router.get('/users/country/:country', tokenController.getUserByCountry);

// Ruta para obtener los usuarios por departamento
router.get('/users/departament/:departament', tokenController.getUserByDepartament);

// Ruta para agregar un nuevo usuario
router.post('/users', tokenController.addUser);

router.delete('/users/:id', tokenController.deleteUser);
router.delete('/users', tokenController.deleteAllUsers);
router.put('/users/:id',tokenController.updateUser)
// router.get('/users/update',tokenController.updateUsersWallet)


// ruta para filtrar usuarios segun empresa instaladora
router.get('/byinstaller/:installation_company', tokenController.getUsersByInstaller);
// router.get('/createall', tokenController.createUsers);
// router.get('/count', tokenController.countUsers);


module.exports = router;
