const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const updateFunctions = require('./controllers/updateKwController');
const varaConnection = require('./controllers/sailsController')
const sendContracMessage = require('./controllers/tokenController');
const verifyToken = require('./middlewares/authMiddleware');
const cron = require('node-cron');
const morgan = require('morgan');
const axios = require('axios')
const { sailsInstance, signerFromAccount } = require('./services/SailsService/utils');
const { version } = require('./package.json');

// Load environment variables
dotenv.config();

const app = express();

// Configurar trust proxy
app.set('trust proxy', true); 

// Middleware to parse JSON
app.use(express.json());
// app.use(morgan('combined'));
app.use(morgan('tiny'));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 peticiones por IP
    keyGenerator: (req) => req.ip, // Utiliza la IP real obtenida a través del proxy
});
app.use(limiter);

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
const salisRoute = require('./routes/salisRoutes');
const kycRoute = require('./routes/sendEmailRoute')
const chatbotRoutes = require("./routes/chatbotRoute");
const { getDevicesByPlantList } = require('./helpers/growatt');

// Use routes
app.use('/api', apiRoutes);
app.get("/api", (req, res) => {
    res.json({
      message: "App running 👍",
      version: version,
    });
  });
app.use('/generator',verifyToken,generadorRoutes);
app.use('/credencials',verifyToken, credencialsUser);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/comercial',userComercial)
app.use('/installer',userInstaller)
app.use('/service',salisRoute)
app.use('/kyc',kycRoute)
app.use('/chatbot',chatbotRoutes)

let isUpdating = false;

// Función para actualizar usuarios
async function startUpdatingUsers() {
    try {
        isUpdating = true; // Indicar que se está actualizando
        await updateFunctions.actualizarKwGeneradoParaUsuarios()
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

varaConnection.initializeConnection()




app.listen(PORT, () => {
    console.log(`Server running on http://${IP}:${PORT}`);
});

module.exports = app;
