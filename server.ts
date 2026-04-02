import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const db = admin.firestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const app = express();
const PORT = 3000;

async function startServer() {
  // Stripe Webhook (must be before express.json())
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tournamentId = session.metadata?.tournamentId;

      if (userId && tournamentId) {
        // Update user status and create entry
        const userRef = db.collection('users').doc(userId);
        const entryRef = db.collection('tournaments').doc(tournamentId).collection('entries').doc(userId);

        await db.runTransaction(async (t) => {
          const userSnap = await t.get(userRef);
          const userData = userSnap.data();
          
          t.update(userRef, { hasPaidEntry: true });
          t.set(entryRef, {
            userId,
            displayName: userData?.displayName || 'Anonymous Player',
            tournamentId,
            score: 0,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            stripeSessionId: session.id
          });
        });
        console.log(`User ${userId} successfully entered tournament ${tournamentId}`);
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // API Routes
  app.post('/api/create-checkout-session', async (req, res) => {
    const { userId, tournamentId, entryFee, tournamentName } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Tournament Entry: ${tournamentName}`,
              },
              unit_amount: entryFee * 100, // in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/?payment=success`,
        cancel_url: `${process.env.APP_URL}/?payment=cancel`,
        metadata: {
          userId,
          tournamentId,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
