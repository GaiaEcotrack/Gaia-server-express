// controller.js

const credenciales = require('../models/credenciales');

const addUser = async (req, res) => {
  const { username, user_client, password,brand } = req.body;

  try {
    const newCredencial = new credenciales({ username, user_client, password,brand });
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

module.exports = {
  addUser,
  getAllUsers,
  deleteUser
};
