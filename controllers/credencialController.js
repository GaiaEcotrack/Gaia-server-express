// controller.js
const credenciales = require('../models/credenciales');
const md5 = require('md5');

const addUser = async (req, res) => {
  const { username, user_client, password,brand } = req.body;
  const passwordCrc = md5(password);

  try {
    const newCredencial = new credenciales({ username, user_client, password:passwordCrc,brand });
    await newCredencial.save();

    res.status(201).send('Usuario agregado correctamente');
  } catch (error) {
    res.status(500).send('Error al agregar usuario');
  }
};

const getAllUsers = async (req, res) => {
  try {
    const data = await credenciales.find();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error al obtener los usuarios');
  }
};

const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const deletedUser = await credenciales.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).send('Usuario no encontrado');
    }
    res.send('Usuario eliminado correctamente');
  } catch (error) {
    res.status(500).send('Error al eliminar usuario');
  }
};

const updatePasswords = async (req, res) => {
  const { newPassword } = req.body; // El nuevo valor de la contraseña que deseas establecer

  try {

    const hashedPassword = "345446"
    const passwordCrc = md5(hashedPassword);
    

    // Actualizar solo los usuarios cuyo username sea "sachar fotovoltaica"
    const result = await credenciales.updateMany(
      { username: 'sachar fotovoltaica' },  // Filtro para los usuarios con este username
      { $set: { password: passwordCrc } } // Establecer la nueva contraseña
    );

    if (result.nModified === 0) {
      return res.status(404).send('No se encontraron usuarios con ese nombre para actualizar');
    }

    res.send('Contraseñas actualizadas correctamente para los usuarios de sachar fotovoltaica');
  } catch (error) {
    res.status(500).send('Error al actualizar las contraseñas');
  }
};

module.exports = {
  addUser,
  getAllUsers,
  deleteUser,
  updatePasswords
};
