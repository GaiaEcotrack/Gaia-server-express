const installer = require('../models/InstallerUser');

// Crear un nuevo usuario
exports.crearUsuario = async (req, res) => {
    try {
      const nuevoUsuario = new installer(req.body);
      const usuarioGuardado = await nuevoUsuario.save();
      res.status(201).json(usuarioGuardado);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear el usuario', error });
    }
  };

  exports.obtenerUsuarios = async (req, res) => {
    try {
      const usuarios = await installer.find();
      res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los usuarios', error });
    }
  };

  exports.obtenerUsuarioPorId = async (req, res) => {
    try {
      const usuario = await installer.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.status(200).json(usuario);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el usuario', error });
    }
  };

  exports.actualizarUsuario = async (req, res) => {
    try {
      const usuarioActualizado = await installer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!usuarioActualizado) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.status(200).json(usuarioActualizado);
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar el usuario', error });
    }
  };

  // Eliminar un usuario
exports.eliminarUsuario = async (req, res) => {
    try {
      const usuarioEliminado = await installer.findByIdAndDelete(req.params.id);
      if (!usuarioEliminado) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.status(200).json({ message: 'Usuario eliminado' });
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el usuario', error });
    }
  };

exports.updateUsers = async (req,res) => {
    try {

      // Actualiza los documentos existentes
      const result = await installer.updateMany(
        { }, // No hay filtro, se actualizan todos
        {
          $set: {
            kwGenerated: 0,
            Earnings: 0,
            tokens_distributed: 0
          }
        }
      );
      res.status(200).json({ message: 'Usuario Actualizados' });
      console.log(`Usuarios actualizados: ${result.nModified}`);
    } catch (error) {
      res.status(500).json({ message: 'Error actualizando usuarios', error });
      console.error('Error actualizando usuarios:', error);
    }
  };