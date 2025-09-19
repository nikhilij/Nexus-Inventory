// Payment gateway credentials and webhooks
// Example for Stripe
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const paymentConfig = {
   stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
