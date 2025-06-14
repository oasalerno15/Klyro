// Client-safe Stripe constants (no server-side code)

// Subscription tiers
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'premium';

export const SUBSCRIPTION_LIMITS = {
  free: {
    transactions: 5,
    receipts: 2,
    ai_chats: 0,
    calendar: false,
    advanced_insights: false,
    custom_categories: false,
    export_data: false,
  },
  starter: {
    transactions: 20,
    receipts: 20,
    ai_chats: 10,
    calendar: true,
    advanced_insights: false,
    custom_categories: false,
    export_data: false,
  },
  pro: {
    transactions: 50,
    receipts: 50,
    ai_chats: 100,
    calendar: true,
    advanced_insights: true,
    custom_categories: true,
    export_data: false,
  },
  premium: {
    transactions: 500,
    receipts: 500,
    ai_chats: 500,
    calendar: true,
    advanced_insights: true,
    custom_categories: true,
    export_data: true,
  },
};

export const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: 9.99,
    interval: 'month',
    description: 'Perfect for getting started with financial wellness',
  },
  pro: {
    name: 'Pro',
    price: 24.99,
    interval: 'month',
    description: 'Advanced features for serious financial planning',
  },
  premium: {
    name: 'Premium',
    price: 49.99,
    interval: 'month',
    description: 'Complete financial wellness solution with AI',
  },
};

// Feature access helper
export function hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const limits = SUBSCRIPTION_LIMITS[tier];
  if (!limits) return false;

  switch (feature) {
    case 'transaction':
    case 'receipt':
    case 'ai_chat':
      return limits[feature as keyof typeof limits] !== 0;
    default:
      return Boolean(limits[feature as keyof typeof limits]);
  }
}

// Get remaining usage for limited features
export function getRemainingTransactions(tier: SubscriptionTier, currentUsage: number): number {
  const limit = SUBSCRIPTION_LIMITS[tier].transactions;
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - currentUsage);
}

export function getRemainingReceipts(tier: SubscriptionTier, currentUsage: number): number {
  const limit = SUBSCRIPTION_LIMITS[tier].receipts;
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - currentUsage);
} 