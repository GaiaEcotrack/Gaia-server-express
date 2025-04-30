// controllers/StripeController.js
const Stripe = require('stripe');


const secret_key = process.env.STRIPE_API_KEY
const stripe = new Stripe(secret_key); // tu clave secreta de Stripe

class StripeController {
  
  static async createCheckoutSession(req, res) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Suscripción Plataforma',
              },
              unit_amount: 6000, // 60 dólares en centavos
              recurring: { interval: 'month' }, // mensual
            },
            quantity: 1,
          },
        ],
        success_url: 'https://app.gaiaecotrack.com//success',
        cancel_url: 'https://app.gaiaecotrack.com/cancel',
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creando la sesión de Stripe:', error);
      res.status(500).json({ error: error.message });
    }
  }

}

module.exports = StripeController;
