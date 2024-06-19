const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const updateFunctions = require('./controllers/updateKwController')
const sendContracMessage = require('./controllers/tokenController')

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST','PUT','DELETE'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['Content-Length'],
    credentials: true
  };
  
  app.use(cors(corsOptions));
// Import routes
// const userRoutes = require('./routes/userRoutes');
// const productRoutes = require('./routes/productRoutes');
const apiRoutes = require('./routes/device');
const generadorRoutes = require('./routes/generadorRoutes');
const credencialsUser = require('./routes/credencialsRoutes');

// // Use routes
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);
let shouldExecute = false;
app.use('/api', apiRoutes);
app.get("/api", (req, res) => {
    res.send("App running 👍");
  });
app.use('/generator', generadorRoutes);
app.use('/credencials',credencialsUser)

let isUpdating = false
// Función para actualizar usuarios
async function startUpdatingUsers() {
  try {
      isUpdating = true; // Indicar que se está actualizando
      await updateFunctions.actualizarKwGeneradoParaUsuarios();
      console.log('Proceso de actualización completado.');
  } catch (error) {
      console.error('Error durante la actualización de usuarios:', error.message);
  } finally {
      isUpdating = false; // Indicar que se ha finalizado la actualización
  }
}

// Ruta GET para iniciar el proceso de actualización
app.get('/update-users', async (req, res) => {
  if (isUpdating) {
      res.send('Se está realizando el proceso de actualización.');
  } else {
      await startUpdatingUsers();
      res.send('Se terminó el proceso de actualización.');
  }
});



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));


//     async function startUpdatingUsers() {
//       try {
//           await updateFunctions.actualizarKwGeneradoParaUsuarios();
//           console.log('Esperando 10 segundos antes de la siguiente actualización...');
//       } catch (error) {
//           console.error('Error durante la actualización de usuarios:', error.message);
//       } finally {
//           setTimeout(startUpdatingUsers, 10000); // Esperar 10 segundos y ejecutar de nuevo
//       }
//   }
  
//   // Start updating users
//   // startUpdatingUsers();
// // sendContracMessage.sendMessageContract()
const PORT = process.env.PORT || 5100;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;;
