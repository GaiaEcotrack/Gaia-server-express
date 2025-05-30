const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/InstallerUserController');

// Crear un nuevo usuario
router.post('/', usuarioController.crearUsuario);

// Crear un nuevo Generador Growatt
router.post('/add-generator', usuarioController.addGeneratorByInstaller);

// Obtener todos los usuarios
router.get('/', usuarioController.obtenerUsuarios);

router.get('/update', usuarioController.updateUsers);

// Obtener un usuario por ID
router.get('/:id', usuarioController.obtenerUsuarioPorId);

// Actualizar un usuario
router.put('/:id', usuarioController.actualizarUsuario);

// Eliminar un usuario
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;
