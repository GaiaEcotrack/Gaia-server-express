const { Types } = require('mongoose');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Esquemas de validación mejorados
const userSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  password: Joi.string().min(6).max(100).required(),
  full_name: Joi.string().min(2).max(100).required(),
  identification_number: Joi.string().min(5).max(20).required(),
  address: Joi.string().min(10).max(200).required(),
  phone: Joi.string().min(7).max(15).pattern(/^[0-9+\-\s()]+$/).required(),
  identity_document: Joi.string().min(5).max(50).required(),
  bank_account_status: Joi.string().valid('pending', 'verified', 'rejected').default('pending'),
  tax_declarations: Joi.string().min(5).max(100).required(),
  other_financial_documents: Joi.string().min(5).max(200).optional(),
  device_brand: Joi.string().min(2).max(50).required(),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
  installation_company: Joi.string().min(2).max(100).required(),
  devices: Joi.array().items(Joi.object({
    _id: Joi.string().optional(),
    serial: Joi.string().required(),
    model: Joi.string().required(),
    capacity: Joi.number().positive().required()
  })).default([]),
  membresia: Joi.boolean().default(false),
  verified_email: Joi.boolean().default(false),
  verified_sms: Joi.boolean().default(false),
  verified_2fa: Joi.boolean().default(false),
  status_documents: Joi.string().valid('pending', 'verified', 'rejected').default('pending'),
  photo_profile: Joi.string().uri().optional(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  role: Joi.string().valid('Generator', 'Admin', 'Installer', 'Comercial').default('Generator'),
  wallet_address: Joi.string().allow('').optional().default('')
});

const updateSchema = Joi.object({
  userId: Joi.string().required(),
  property: Joi.string().valid(
    'full_name', 'address', 'phone', 'device_brand', 'username', 
    'installation_company', 'verified_email', 'verified_sms', 'verified_2fa',
    'status_documents', 'membresia', 'role'
  ).required(),
  value: Joi.any().required(),
});

// Función para sanitizar datos de entrada
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
};

const formatLocation = (location) => {
  if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    return location;
  }

  const [longitude, latitude] = location.coordinates;
  return { latitude, longitude };
};

const normalizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };

  if (user._id) user._id = user._id.toString();

  if (Array.isArray(user.devices)) {
    user.devices = user.devices.map((device) => ({
      ...device,
      _id: device?._id ? device._id.toString() : undefined
    }));
  }

  if (user.location) {
    user.location = formatLocation(user.location);
  }

  if (user.key_auth !== undefined) {
    delete user.key_auth;
  }

  if (user.wallet?.transactions) {
    delete user.wallet.transactions;
  }

  return user;
};

const buildLocation = (location) => {
  if (!location || location.latitude === undefined || location.longitude === undefined) {
    return null;
  }

  return {
    type: 'Point',
    coordinates: [Number(location.longitude), Number(location.latitude)]
  };
};

const buildDevices = (devices = []) => {
  if (!Array.isArray(devices)) return [];

  return devices.map((device) => ({
    _id: device._id ? new Types.ObjectId(device._id) : new Types.ObjectId(),
    serial: device.serial,
    model: device.model,
    capacity: device.capacity
  }));
};

exports.getUserByEmail = async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ message: 'Parámetro "email" no proporcionado' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json(normalizeUser(user));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};


exports.deleteUserById = async (req, res) => {
  const userId = req.params.user_id;

  if (!Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'ID de usuario no válido' });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getUserById = async (req, res) => {
  const userId = req.params.user_id;

  if (!Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'ID de usuario no válido' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ message: 'Usuario encontrado', user: normalizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    const formattedUsers = users.map(normalizeUser);

    return res.status(200).json({ message: 'Hello, Express and MongoDB Atlas!', users: formattedUsers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.addUser = async (req, res) => {
  try {
    // Sanitizar datos de entrada
    const sanitizedData = sanitizeInput(req.body);
    
    // Validar datos completos
    const { error } = userSchema.validate(sanitizedData);

    if (error) {
      return res.status(400).json({ 
        message: 'Errores de validación', 
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    const email = sanitizedData.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const location = buildLocation(sanitizedData.location);
    if (!location) {
      return res.status(400).json({ message: 'Ubicación inválida o incompleta' });
    }

    const devices = buildDevices(sanitizedData.devices);

    // Hashear la contraseña antes de guardarla
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(sanitizedData.password, saltRounds);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      full_name: sanitizedData.full_name,
      identification_number: sanitizedData.identification_number,
      address: sanitizedData.address,
      phone: sanitizedData.phone,
      identity_document: sanitizedData.identity_document,
      bank_account_status: sanitizedData.bank_account_status || 'pending',
      tax_declarations: sanitizedData.tax_declarations,
      other_financial_documents: sanitizedData.other_financial_documents,
      device_brand: sanitizedData.device_brand,
      username: sanitizedData.username,
      installation_company: sanitizedData.installation_company,
      devices,
      membresia: sanitizedData.membresia || false,
      key_auth: '',
      wallet_address: sanitizedData.wallet_address || '',
      verified_email: sanitizedData.verified_email || false,
      verified_sms: sanitizedData.verified_sms || false,
      verified_2fa: sanitizedData.verified_2fa || false,
      status_documents: 'pending',
      photo_profile: sanitizedData.photo_profile,
      location,
      role: sanitizedData.role || 'Generator',
      wallet: {
        gaia_token_balance: 0,
        transactions: [],
        vara_balance: 0,
        willing_to_sell_excess: sanitizedData.wallet?.willing_to_sell_excess ?? false,
        amount_kwh_to_sell: sanitizedData.wallet?.amount_kwh_to_sell ?? 0
      }
    });

    return res.status(201).json({ message: 'Usuario agregado con éxito', user_id: newUser._id.toString() });
  } catch (error) {
    console.error('Error agregando usuario:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.updateUserProperty = async (req, res) => {
  try {
    const { userId } = req.params;
    const { property, value } = req.body;

    // Sanitizar datos de entrada
    const sanitizedValue = sanitizeInput(value);

    // Validar los datos de entrada
    const { error } = updateSchema.validate({ userId, property, value: sanitizedValue });
    if (error) {
      return res.status(400).json({ 
        message: 'Errores de validación', 
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Validar ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }

    const updateField = { [property]: sanitizedValue };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateField },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Log de auditoría
    console.log(`Usuario ${userId} actualizó propiedad ${property} a ${JSON.stringify(sanitizedValue)}`);

    return res.status(200).json({ message: 'Propiedad actualizada con éxito' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};