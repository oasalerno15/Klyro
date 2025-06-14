import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionTier, hasFeatureAccess, getRemainingTransactions, getRemainingReceipts } from '../utils/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_tier: SubscriptionTier;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

interface UserUsage {
  transactions: number;
  receipts: number;
  ai_chats: number;
}

interface UseSubscriptionResult {
  subscription: UserSubscription | null;
  usage: UserUsage;
  loading: boolean;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  canUseFeature: (feature: string) => { allowed: boolean; remaining?: number };
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(userId?: string): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsage>({ transactions: 0, receipts: 0, ai_chats: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError && subError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw subError;
      }

      // If no subscription exists, create a free one
      if (!subData) {
        const { data: newSub, error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            subscription_tier: 'free',
            status: 'active',
          })
          .select()
          .single();

        if (createError) throw createError;
        setSubscription(newSub);
      } else {
        setSubscription(subData);
      }

      // Fetch usage
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('feature_type, usage_count')
        .eq('user_id', userId)
        .eq('month_year', currentMonth);

      if (usageError) throw usageError;

      const usageMap = usageData?.reduce((acc, item) => {
        acc[item.feature_type] = item.usage_count;
        return acc;
      }, {} as Record<string, number>) || {};

      setUsage({
        transactions: usageMap.transaction || 0,
        receipts: usageMap.receipt || 0,
        ai_chats: usageMap.ai_chat || 0,
      });

    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;
    return hasFeatureAccess(subscription.subscription_tier, feature);
  };

  const canUseFeature = (feature: string): { allowed: boolean; remaining?: number } => {
    if (!subscription) return { allowed: false };

    const tier = subscription.subscription_tier;
    
    // Check if user has access to the feature at all
    if (!hasFeatureAccess(tier, feature)) {
      return { allowed: false };
    }

    // Check usage limits for specific features
    switch (feature) {
      case 'transaction':
        const remainingTransactions = getRemainingTransactions(tier, usage.transactions);
        return {
          allowed: remainingTransactions !== 0,
          remaining: remainingTransactions === -1 ? undefined : remainingTransactions
        };
      
      case 'receipt':
        const remainingReceipts = getRemainingReceipts(tier, usage.receipts);
        return {
          allowed: remainingReceipts !== 0,
          remaining: remainingReceipts === -1 ? undefined : remainingReceipts
        };
      
      default:
        return { allowed: true };
    }
  };

  return {
    subscription,
    usage,
    loading,
    error,
    hasFeature,
    canUseFeature,
    refreshSubscription: fetchSubscription,
  };
}

// Hook for incrementing usage
export function useIncrementUsage() {
  const incrementUsage = async (userId: string, featureType: string, increment: number = 1) => {
    try {
      const response = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, featureType, increment }),
      });

      if (!response.ok) {
        throw new Error('Failed to increment usage');
      }

      return await response.json();
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  };

  return { incrementUsage };
} 