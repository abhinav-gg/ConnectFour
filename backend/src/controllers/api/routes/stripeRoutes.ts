// import express from 'express';
// import Stripe from 'stripe';
// import bodyParser from 'body-parser';
// import { updateUserToPro } from '../services/userService';

// const router = express.Router();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//   apiVersion: '2024-08-01',
// });


// // Set this in Stripe Dashboard when configuring webhook
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;


// router.post('/create-payment-intent', async (req, res) => {
//   const { amount, currency } = req.body;

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency,
//     });

//     res.json({ clientSecret: paymentIntent.client_secret });
//   } catch (err) {
//     res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
//   }
// });

// // Stripe requires raw body
// router.post(
//   '/webhook',
//   bodyParser.raw({ type: 'application/json' }),
//   (req, res) => {
//     const sig = req.headers['stripe-signature'] as string;

//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//       console.error(`Webhook signature verification failed.`, err);
//       return res.sendStatus(400);
//     }

//     if (event.type === 'payment_intent.succeeded') {
//       const paymentIntent = event.data.object as Stripe.PaymentIntent;
//       const userId = paymentIntent.metadata.userId;

//       if (userId) {
//         updateUserToPro(userId)
//           .then(() => {
//             console.log(`User ${userId} upgraded to PRO`);
//             res.status(200).send();
//           })
//           .catch((err) => {
//             console.error('Error updating user:', err);
//             res.status(500).send();
//           });
//       } else {
//         console.warn('No userId in metadata');
//         res.status(400).send();
//       }
//     } else {
//       res.status(200).send();
//     }
//   }
// );

// export default router;
