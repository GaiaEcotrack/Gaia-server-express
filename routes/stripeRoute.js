// routes/StripeRoutes.js
const express = require('express');
const router = express.Router();
const StripeController = require('../controllers/stripeController');

// Ruta para crear la sesión de pago
router.post('/create-checkout-session', StripeController.createCheckoutSession);

module.exports = router;
