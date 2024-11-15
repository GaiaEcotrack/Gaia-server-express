const { MongoClient, ObjectId } = require('mongodb');
const Joi = require('joi');

// Configuración de la conexión a MongoDB
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Conectarse una vez y reutilizar la conexión
let db;
const userSchema = Joi.object({
  email: Joi.string().email().required()
});

const updateSchema = Joi.object({
  userId: Joi.string().required(),
  property: Joi.string().required(),
  value: Joi.any().required(),
});

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
  const data = req.body;

  const { error } = userSchema.validate({ email: data.email });

  if (error) {
    return res.status(400).json({ message: 'Validation errors', errors: error.details });
  }

  const email = data.email;

  try {
    const collection = await connectToDatabase();
    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const newUser = {
      email: email,
      full_name: data.full_name,
      identification_number: data.identification_number,
      address: data.address,
      phone: data.phone,
      identity_document: data.identity_document,
      bank_account_status: data.bank_account_status,
      tax_declarations: data.tax_declarations,
      other_financial_documents: data.other_financial_documents,
      device_brand: data.device_brand,
      username: data.username,
      installation_company: data.installation_company,
      devices: data.devices || [],
      membresia: data.membresia || false,
      key_auth: '',
      verified_email: data.verified_email || false,
      verified_sms: data.verified_sms || false,
      verified_2fa: data.verified_2fa || false,
      status_documents: 'pending',
      photo_profile: data.photo_profile,
      location: data.location,
      role: data.role || 'Generator',
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
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};



exports.updateUserProperty = async (req, res) => {
  const { userId, property, value } = req.body;

  // Validar los datos de entrada
  const { error } = updateSchema.validate({ userId, property, value });
  if (error) {
    return res.status(400).json({ message: 'Errores de validación', errors: error.details });
  }

  try {
    const collection = await connectToDatabase();

    // Construir el campo de actualización dinámicamente
    const updateField = { [property]: value };

    // Realizar la actualización
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateField }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ message: 'Propiedad actualizada con éxito' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};