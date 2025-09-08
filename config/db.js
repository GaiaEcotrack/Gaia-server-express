const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Validar que la URI de MongoDB esté configurada
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI no está configurada en las variables de entorno');
        }

        // Validar formato de la URI
        if (!process.env.MONGO_URI.startsWith('mongodb://') && !process.env.MONGO_URI.startsWith('mongodb+srv://')) {
            throw new Error('Formato de MONGO_URI inválido');
        }

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Máximo 10 conexiones en el pool
            serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos para selección de servidor
            socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
            bufferMaxEntries: 0, // Deshabilitar buffering
            bufferCommands: false, // Deshabilitar comandos en buffer
            // Opciones de seguridad
            ssl: process.env.MONGO_URI.includes('mongodb+srv://'),
            sslValidate: true,
            // Opciones de autenticación
            authSource: 'admin',
            // Opciones de retry
            retryWrites: true,
            retryReads: true,
            // Opciones de heartbeat
            heartbeatFrequencyMS: 10000,
            // Opciones de compresión
            compressors: ['zlib'],
            zlibCompressionLevel: 6
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        
        // Configurar eventos de conexión
        mongoose.connection.on('connected', () => {
            console.log('MongoDB conectado exitosamente');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Error de conexión MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB desconectado');
        });

        // Manejar cierre graceful del servidor
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('Conexión MongoDB cerrada por terminación del servidor');
                process.exit(0);
            } catch (err) {
                console.error('Error cerrando conexión MongoDB:', err);
                process.exit(1);
            }
        });

        process.on('SIGTERM', async () => {
            try {
                await mongoose.connection.close();
                console.log('Conexión MongoDB cerrada por terminación del servidor');
                process.exit(0);
            } catch (err) {
                console.error('Error cerrando conexión MongoDB:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
