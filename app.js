const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const updateFunctions = require('./controllers/updateKwController');
const sendContracMessage = require('./controllers/tokenController');
const verifyToken = require('./middlewares/authMiddleware');
const cron = require('node-cron');
const morgan = require('morgan');

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

// Use routes
app.use('/api', apiRoutes);
app.get("/api", (req, res) => {
    res.send("App running 👍");
});
app.use('/generator', verifyToken, generadorRoutes);
app.use('/credencials', verifyToken, credencialsUser);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

let isUpdating = false;

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

app.listen(PORT, () => {
    console.log(`Server running on http://${IP}:${PORT}`);
});

module.exports = app;
