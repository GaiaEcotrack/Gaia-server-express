const { MongoClient, ObjectId } = require('mongodb');

// Configuración de la conexión a MongoDB
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Conectarse una vez y reutilizar la conexión
let db;

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
