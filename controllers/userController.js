const { MongoClient, ObjectId } = require('mongodb');
const Joi = require('joi');

// Configuración de la conexión a MongoDB
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Conectarse una vez y reutilizar la conexión
let db;

// Esquemas de validación mejorados
const userSchema = Joi.object({
  email: Joi.string().email().required().max(255),
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
  role: Joi.string().valid('Generator', 'Admin', 'Installer', 'Comercial').default('Generator')
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
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
};

async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db('gaia').collection('users');
  }
  return db;
}

exports.getUserByEmail = async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ message: 'Parámetro "email" no proporcionado' });
  }

  try {
    const collection = await connectToDatabase();
    const user = await collection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Convertir todos los ObjectId a cadenas antes de devolver la respuesta JSON
    user._id = user._id.toString();
    if (user.devices) {
      user.devices = user.devices.map(device => ({
        ...device,
        _id: device._id.toString()
      }));
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};


exports.deleteUserById = async (req, res) => {
  const userId = req.params.user_id;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'ID de usuario no válido' });
  }

  try {
    const collection = await connectToDatabase();
    const result = await collection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
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

  try {
    const collection = await connectToDatabase();
    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user._id = user._id.toString();
    if (user.devices && Array.isArray(user.devices)) {
      user.devices = user.devices.map(device => ({
        ...device,
        _id: device._id.toString()
      }));
    }

    return res.status(200).json({ message: 'Usuario encontrado', user: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const collection = await connectToDatabase();
    const users = await collection.find().toArray();

    users.forEach(user => {
      user._id = user._id.toString();
      if (user.devices && Array.isArray(user.devices)) {
        user.devices = user.devices.map(device => ({
          ...device,
          _id: device._id.toString()
        }));
      }
    });

    return res.status(200).json({ message: 'Hello, Express and MongoDB Atlas!', users: users });
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

    const email = sanitizedData.email;

    const collection = await connectToDatabase();
    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const newUser = {
      email: email,
      full_name: sanitizedData.full_name,
      identification_number: sanitizedData.identification_number,
      address: sanitizedData.address,
      phone: sanitizedData.phone,
      identity_document: sanitizedData.identity_document,
      bank_account_status: sanitizedData.bank_account_status,
      tax_declarations: sanitizedData.tax_declarations,
      other_financial_documents: sanitizedData.other_financial_documents,
      device_brand: sanitizedData.device_brand,
      username: sanitizedData.username,
      installation_company: sanitizedData.installation_company,
      devices: sanitizedData.devices || [],
      membresia: sanitizedData.membresia || false,
      key_auth: '',
      verified_email: sanitizedData.verified_email || false,
      verified_sms: sanitizedData.verified_sms || false,
      verified_2fa: sanitizedData.verified_2fa || false,
      status_documents: 'pending',
      photo_profile: sanitizedData.photo_profile,
      location: sanitizedData.location,
      role: sanitizedData.role || 'Generator',
      wallet: {
        gaia_token_balance: 0,
        transactions: [],
        vara_balance: 0,
        willing_to_sell_excess: false,
        amount_kwh_to_sell: 0
      }
    };

    const result = await collection.insertOne(newUser);
    const insertedId = result.insertedId;

    return res.status(201).json({ message: 'Usuario agregado con éxito', user_id: insertedId.toString() });
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
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }

    const collection = await connectToDatabase();

    // Construir el campo de actualización dinámicamente
    const updateField = { [property]: sanitizedValue };

    // Realizar la actualización
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateField }
    );

    if (result.matchedCount === 0) {
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