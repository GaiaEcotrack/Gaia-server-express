// src/mercadopago.js
const mercadopago = require('mercadopago');

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN; // Asegúrate de tener tu token en las variables de entorno

// Inicializa el cliente con tu accessToken
const client = new mercadopago.MercadoPagoConfig({
  accessToken: accessToken, // Reemplaza con tu token de acceso
  options: { timeout: 5000 }, // Configuración de tiempo de espera (opcional)
});

const order = new mercadopago.Preference(client); // Objeto API para manejar órdenes

module.exports={ client, order };
