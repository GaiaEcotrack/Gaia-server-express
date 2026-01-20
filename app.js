const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const updateFunctions = require('./controllers/updateKwController');
const varaConnection = require('./controllers/sailsController')
const verifyToken = require('./middlewares/authMiddleware');
const { errorHandler, notFoundHandler, jsonErrorHandler, validateContentType } = require('./middlewares/errorMiddleware');
const cron = require('node-cron');
const morgan = require('morgan');

const { version } = require('./package.json');



// Load environment variables
dotenv.config();

const app = express();

// Configurar trust proxy
app.set('trust proxy', true); 

// Middleware de seguridad con helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware to parse JSON con límites de seguridad
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar logging seguro
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      // Filtrar información sensible en logs
      const sanitizedMessage = message
        .replace(/password=([^&\s]+)/g, 'password=***')
        .replace(/token=([^&\s]+)/g, 'token=***')
        .replace(/secret=([^&\s]+)/g, 'secret=***');
      console.log(sanitizedMessage.trim());
    }
  }
}));

// Rate limiting más restrictivo
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 peticiones por IP (reducido de 1500)
    keyGenerator: (req) => req.ip,
    message: {
        error: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Rate limiting específico para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos de login por IP
    keyGenerator: (req) => req.ip,
    message: {
        error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
    },
    skipSuccessfulRequests: true,
});

// CORS más restrictivo
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'https://app.gaiaecotrack.com'];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como aplicaciones móviles)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    credentials: true,
    maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Import routes
const apiRoutes = require('./routes/devicesRoutes');
const generadorRoutes = require('./routes/generadorRoutes');
const credencialsUser = require('./routes/credencialsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const userComercial = require('./routes/userComercialRoutes');
const userInstaller = require('./routes/installerRoutes');
const salisRoute = require('./routes/salisRoutes');
const kycRoute = require('./routes/sendEmailRoute')
const chatbotRoutes = require("./routes/chatbotRoute");
const paymentRoute = require("./routes/paymentRoutes");
const carbonRoutes = require("./routes/carbonRoutes");
const createWalletRoute = require('./routes/createWalletRoute');
// Use routes
app.use('/api', apiRoutes);
app.get("/", (req, res) => {
    res.json({
      message: "App running 👍",
      version: version,
    });
  });

// Aplicar rate limiting específico para autenticación
app.use('/auth', authLimiter, authRoutes);

app.use('/generator',verifyToken,generadorRoutes);
app.use('/credencials',verifyToken, credencialsUser);
app.use('/users', userRoutes);
app.use('/comercial',userComercial)
app.use('/installer',userInstaller)
app.use('/service',verifyToken,salisRoute)
app.use('/kyc',kycRoute)
app.use('/chatbot',chatbotRoutes)
app.use('/create-wallet',createWalletRoute)
app.use('/payment',paymentRoute)
app.use('/carbon', carbonRoutes);

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

// Middleware de validación de contenido
app.use(validateContentType);

// Middleware de manejo de errores de JSON
app.use(jsonErrorHandler);

// Middleware para rutas no encontradas (debe ir después de todas las rutas)
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);


let isUpdating = false;



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
const PORT = process.env.PORT || 8080;

varaConnection.initializeConnection()


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

module.exports = app;
