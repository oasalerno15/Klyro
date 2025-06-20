import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from '@/utils/stripe-constants';

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

      // Try to fetch subscription from database
      let subData = null;
      try {
        const { data, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (subError && subError.code !== 'PGRST116') { // PGRST116 is "not found"
          // Only throw if it's not a "not found" error
          if (!subError.message?.includes('relation') && !subError.message?.includes('does not exist')) {
            throw subError;
          }
        } else if (data) {
          subData = data;
        }
      } catch (dbError: any) {
        // Database tables don't exist yet - that's okay for payment links
        console.log('Subscription tables not available yet - using default free tier');
      }

      // If no subscription exists or tables don't exist, create a default free subscription
      if (!subData) {
        const defaultSubscription: UserSubscription = {
          id: `free_${userId}`,
          user_id: userId,
          subscription_tier: 'free',
          status: 'active',
        };
        setSubscription(defaultSubscription);
      } else {
        setSubscription(subData);
      }

      // Try to fetch usage
      let usageMap: Record<string, number> = {};
      try {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const { data: usageData, error: usageError } = await supabase
          .from('user_usage')
          .select('feature_type, usage_count')
          .eq('user_id', userId)
          .eq('month_year', currentMonth);

        if (usageError && !usageError.message?.includes('relation') && !usageError.message?.includes('does not exist')) {
          throw usageError;
        }

        if (usageData) {
          usageMap = usageData.reduce((acc, item) => {
            acc[item.feature_type] = item.usage_count;
            return acc;
          }, {} as Record<string, number>);
        }
      } catch (usageError: any) {
        // Usage tables don't exist yet - that's okay, we'll track locally
        console.log('Usage tracking tables not available yet - using default counts');
      }

      setUsage({
        transactions: usageMap.transaction || 0,
        receipts: usageMap.receipt || 0,
        ai_chats: usageMap.ai_chat || 0,
      });

    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      // Don't set error for missing tables - just use defaults
      if (!err.message?.includes('relation') && !err.message?.includes('does not exist')) {
        setError(err.message);
      }
      
      // Set default free subscription even on error
      if (!subscription) {
        const defaultSubscription: UserSubscription = {
          id: `free_${userId}`,
          user_id: userId || 'unknown',
          subscription_tier: 'free',
          status: 'active',
        };
        setSubscription(defaultSubscription);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  return {
    subscription,
    usage,
    loading,
    error,
    refreshSubscription: fetchSubscription,
  };
}

// Hook for incrementing usage - simplified for payment links
export function useIncrementUsage() {
  const incrementUsage = async (userId: string, featureType: string, increment: number = 1) => {
    try {
      // Try to increment in database if tables exist
      const response = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, featureType, increment }),
      });

      if (!response.ok) {
        // If API doesn't exist or fails, just log and continue
        console.log('Usage tracking API not available - continuing without tracking');
        return { success: true, tracked: false };
      }

      return await response.json();
    } catch (error) {
      console.log('Usage tracking not available - continuing without tracking');
      return { success: true, tracked: false };
    }
  };

  return { incrementUsage };
} 