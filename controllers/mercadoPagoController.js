// src/controllers/payment.controller.js
const { order } = require('../services/mercadoPago'); // Asegúrate de que la ruta sea correcta

const PaymentController = {
  createPaymentOrder: async (req, res) => {
    try {

      const body = {
        items: [
          {
            title: 'Suscripción Gaia Ecotrack',
            quantity: 1,
            unit_price: 60,
            currency_id: 'USD',
            description: 'Suscripción mensual',
          }
        ],
        back_urls: {
          success: "http://localhost:3000/payment",
          failure: "http://localhost:3000/payment",
        },
        auto_return: 'approved',
      };
      const requestOptions = {
        idempotencyKey: "<IDEMPOTENCY_KEY>", // Para evitar pagos duplicados
      };

      // Realiza la solicitud para crear la orden de pago
      const paymentResponse = await order.create({ body, requestOptions });

      console.log(paymentResponse);
      
      res.status(200).json(paymentResponse); // Devuelve la respuesta de Mercado Pago
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      res.status(500).json({ error: 'No se pudo crear el pago' });
    }
  },
};

module.exports= PaymentController;
