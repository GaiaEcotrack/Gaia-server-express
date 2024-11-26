const User = require('../models/comercialUser'); // Ajusta la ruta según tu estructura de archivos
const installer = require('../models/InstallerUser'); // Ajusta la ruta según tu estructura de archivos

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
  try {
    const user = new User({
      email: req.body.email,
      full_name: req.body.full_name || 'User',
      company_name: req.body.company_name,
      nit: req.body.nit,
      address: req.body.address,
      company_phone: req.body.company_phone,
      company_email: req.body.company_email,
      website: req.body.website,
      legal_representative_name: req.body.legal_representative_name,
      legal_representative_id: req.body.legal_representative_id,
      legal_representative_email: req.body.legal_representative_email,
      legal_representative_phone: req.body.legal_representative_phone,
      role: req.body.role
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

// Obtener un usuario por ASOCIADO
exports.getUserByPartner = async (req, res) => {
  try {
    const { partnerName } = req.params;

    // Normaliza el texto ingresado eliminando espacios y convirtiéndolo a minúsculas
    const normalizedPartnerName = partnerName.toLowerCase().replace(/\s+/g, '');

    // Busca en la base de datos usuarios cuyo `associatedPartner` normalizado coincida
    const users = await installer.find({
      $expr: {
        $eq: [
          { $replaceAll: { input: { $toLower: "$associatedPartner" }, find: " ", replacement: "" } },
          normalizedPartnerName,
        ],
      },
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found with the given partner name' });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

// Actualizar un usuario por ID
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        email: req.body.email,
        full_name: req.body.full_name || 'User',
        company_name: req.body.company_name,
        nit: req.body.nit,
        address: req.body.address,
        company_phone: req.body.company_phone,
        company_email: req.body.company_email,
        website: req.body.website,
        legal_representative_name: req.body.legal_representative_name,
        legal_representative_id: req.body.legal_representative_id,
        legal_representative_email: req.body.legal_representative_email,
        legal_representative_phone: req.body.legal_representative_phone,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};

// Eliminar un usuario por ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};
