import Stripe from 'stripe';
import type { SubscriptionTier } from './stripe-constants';

// Re-export types and functions from stripe-constants
export type { SubscriptionTier } from './stripe-constants';
export { hasFeatureAccess, getRemainingTransactions, getRemainingReceipts } from './stripe-constants';

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });
} else {
  console.warn('STRIPE_SECRET_KEY not configured - server-side Stripe functionality disabled');
}

export { stripe };

// Export price IDs for easy access (optional)
export const PRICE_IDS = {
  STARTER: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
  PREMIUM: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
};

// Stripe Product IDs - Replace with your actual Stripe product IDs
export const STRIPE_PRODUCTS = {
  STARTER: 'starter_product',
  PRO: 'pro_product',
  PREMIUM: 'premium_product',
};

// Get tier from Stripe price ID
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  switch (priceId) {
    case PRICE_IDS.STARTER:
      return 'starter';
    case PRICE_IDS.PRO:
      return 'pro';
    case PRICE_IDS.PREMIUM:
      return 'premium';
    default:
      return 'free';
  }
}

// Create Stripe customer - only works if Stripe is configured
export async function createStripeCustomer(email: string, name?: string, userId?: string) {
  if (!stripe) {
    throw new Error('Stripe not configured - cannot create customer');
  }
  
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: userId ? { userId } : {},
  });
  return customer;
}

// Create checkout session - only works if Stripe is configured
export async function createCheckoutSession({
  priceId,
  customerId,
  userId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - cannot create checkout session');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: userId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
} 