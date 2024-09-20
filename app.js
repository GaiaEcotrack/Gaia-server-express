const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const updateFunctions = require('./controllers/updateKwController');
const executeCommand = require('./controllers/sailsController')
const sendContracMessage = require('./controllers/tokenController');
const verifyToken = require('./middlewares/authMiddleware');
const cron = require('node-cron');
const morgan = require('morgan');
const axios = require('axios')
const { sailsInstance, signerFromAccount } = require('./services/SailsService/utils');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());
// app.use(morgan('combined'));
app.use(morgan('tiny'));

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    credentials: true
};

app.use(cors(corsOptions));

// Import routes
const apiRoutes = require('./routes/device');
const generadorRoutes = require('./routes/generadorRoutes');
const credencialsUser = require('./routes/credencialsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const userComercial = require('./routes/userComercialRoutes');
const userInstaller = require('./routes/installerRoutes');
const salisRoute = require('./routes/salisRoutes')

// Use routes
app.use('/api', apiRoutes);
app.get("/api", (req, res) => {
    res.send("App running 👍");
});
app.use('/generator',verifyToken,generadorRoutes);
app.use('/credencials', credencialsUser);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/comercial',userComercial)
app.use('/installer',userInstaller)
app.use('/service',salisRoute)

let isUpdating = false;

// Función para actualizar usuarios
async function startUpdatingUsers() {
    try {
        isUpdating = true; // Indicar que se está actualizando
        await updateFunctions.actualizarKwGeneradoParaUsuarios()
        await executeCommand.executeCommand("MiniDeXs","MintTokensToUser",)
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

app.get('/api/protected-route', verifyToken, (req, res) => {
    // req.user contiene la información decodificada del token
    res.json({ message: 'This is a protected route', user: req.user });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Start updating users
cron.schedule('00 20 * * *', async () => {
    console.log('Iniciando la actualización de usuarios programada.');
    await startUpdatingUsers();
}, {
    scheduled: true,
    timezone: "America/Bogota" // Zona horaria de Colombia
});

const IP = '0.0.0.0'; // Cambia esta IP por la correcta de tu servidor
const PORT =  8080;


app.post('/sendLogin', async (req, res) => {
    try {
      // Generar el tiempo actual en milisegundos UTC (GMT+0000)
      function getGMTTime() {
        const date = new Date();
  
        // Obtener componentes de la fecha
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');  // Meses van de 0 a 11
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
        // Formato final 'YYYY-MM-DD HH:mm:ss'
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
  
      // Obtener la hora actual en formato GMT (UTC+0000)
      const loginTime = getGMTTime();
  
      // Datos para enviar en la solicitud POST
      const data = new URLSearchParams({
        userName: 'sachar fotovoltaica', // Reemplaza con tu nombre de usuario
        password: 345446,      // Reemplaza con tu contraseña
        lang: 'en',
        loginTime: loginTime,          // Tiempo en formato UNIX (milisegundos UTC)
        noRecord: 'true',                 // Reemplaza según corresponda
        type: '1',                     // Reemplaza según corresponda
        passwordCrc: ''   // Reemplaza si es necesario
      });
  
      console.log(loginTime);
      
      // Hacer la solicitud POST con Axios
      const response = await axios.post('https://oss.growatt.com/login', data.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://server.growatt.com/',
          'Origin': 'https://server.growatt.com'
        }
      });
  
      // Enviar la respuesta de la solicitud de vuelta al cliente
      res.status(200).json({
        message: 'Login request successful',
        data: response.data
      });
    } catch (error) {
      console.error('Error al hacer la solicitud:', error);
      res.status(500).json({
        message: 'Error al hacer la solicitud',
        error: error.message
      });
    }
  });
  


app.listen(PORT, () => {
    console.log(`Server running on http://${IP}:${PORT}`);
});

module.exports = app;
