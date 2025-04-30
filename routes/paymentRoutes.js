// src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/mercadoPagoController');

//Mercado Pago Method
router.post('/mercadopago', PaymentController.createPaymentOrder);

module.exports = router;
