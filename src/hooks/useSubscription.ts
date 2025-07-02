import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/utils/stripe-constants';

const supabase = createClient();

export type { SubscriptionTier };

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

interface SubscriptionLimits {
  transactions: number;
  receipts: number;
  aiChats: number;
  calendar: boolean;
  advanced_insights: boolean;
  custom_categories: boolean;
  export_data: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    transactions: 0,
    receipts: 0,
    aiChats: 0
  });

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchUsage();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    console.log('🔍 Fetching subscription for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('📊 Subscription query result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        if (error.message || error.details || Object.keys(error).length > 0) {
          console.error('❌ Error fetching subscription:', error);
        } else {
          console.log('📋 No subscription data found for user - using free tier');
        }
      } else {
        console.log('✅ Setting subscription:', data);
        setSubscription(data);
      }
    } catch (error) {
      if (error && (error instanceof Error || Object.keys(error).length > 0)) {
        console.error('❌ Error fetching subscription:', error);
      } else {
        console.log('📋 Subscription service not available - using free tier');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth);

      if (error) {
        if (error.message || error.details || Object.keys(error).length > 0) {
          console.error('Error fetching usage:', error);
        } else {
          console.log('📊 Usage data not available - using defaults');
        }
        return;
      }

      const usageData = {
        transactions: 0,
        receipts: 0,
        aiChats: 0
      };

      data?.forEach((item) => {
        if (item.feature_type === 'transactions') usageData.transactions = item.usage_count;
        if (item.feature_type === 'receipts') usageData.receipts = item.usage_count;
        if (item.feature_type === 'ai_chats') usageData.aiChats = item.usage_count;
      });

      setUsage(usageData);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  // Get current subscription tier
  const getCurrentTier = (): SubscriptionTier => {
    console.log('🎯 getCurrentTier called with subscription:', subscription);
    
    if (!subscription || subscription.status !== 'active') {
      console.log('📋 Returning free tier - no subscription or inactive');
      return 'free';
    }
    
    console.log('🎉 Returning tier:', subscription.subscription_tier);
    return subscription.subscription_tier as SubscriptionTier;
  };

  // Check if user has access to a feature
  const hasFeatureAccess = (feature: string): boolean => {
    const tier = getCurrentTier();
    const limits = SUBSCRIPTION_LIMITS[tier];
    
    // Check specific features based on the subscription limits structure
    switch (feature) {
      case 'calendar':
        return limits.calendar;
      case 'advanced_insights':
        return limits.advanced_insights;
      case 'custom_categories':
        return limits.custom_categories;
      case 'export_data':
        return limits.export_data;
      case 'transactions':
        return limits.transactions > 0;
      case 'receipts':
        return limits.receipts > 0;
      case 'ai_chats':
        return limits.aiChats > 0;
      default:
        return false;
    }
  };

  // Check if user can use a feature based on usage limits
  const canUseFeature = (featureType: 'transactions' | 'receipts' | 'aiChats'): boolean => {
    const tier = getCurrentTier();
    const limit = SUBSCRIPTION_LIMITS[tier][featureType];
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    return usage[featureType] < limit;
  };

  // Get remaining usage for a feature
  const getRemainingUsage = (featureType: 'transactions' | 'receipts' | 'aiChats'): number => {
    const tier = getCurrentTier();
    const limit = SUBSCRIPTION_LIMITS[tier][featureType];
    
    // -1 means unlimited
    if (limit === -1) return -1;
    
    return Math.max(0, limit - usage[featureType]);
  };

  // Increment usage for a feature
  const incrementUsage = async (featureType: 'transactions' | 'receipts' | 'aiChats'): Promise<boolean> => {
    if (!user) return false;

    // Check if user can use this feature
    if (!canUseFeature(featureType)) {
      return false;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      const { error } = await supabase.rpc('increment_user_usage', {
        p_user_id: user.id,
        p_feature_type: featureType,
        p_increment: 1
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      // Update local usage state
      setUsage(prev => ({
        ...prev,
        [featureType]: prev[featureType] + 1
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  // Check if subscription is active and not expired
  const isSubscriptionActive = (): boolean => {
    if (!subscription) return false;
    
    if (subscription.status !== 'active') return false;
    
    // Check if subscription has expired
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      const now = new Date();
      return endDate > now;
    }
    
    return true;
  };

  // Refresh subscription data (useful after payment)
  const refreshSubscription = async () => {
    if (user) {
      setLoading(true);
      await fetchSubscription();
      await fetchUsage();
    }
  };

  return {
    subscription,
    loading,
    usage,
    getCurrentTier,
    hasFeatureAccess,
    canUseFeature,
    getRemainingUsage,
    incrementUsage,
    isSubscriptionActive,
    refreshSubscription,
    refresh: async () => {
      if (user) {
        console.log('🔄 Refreshing subscription and usage data...');
        setLoading(true);
        await fetchSubscription();
        await fetchUsage();
        console.log('✅ Subscription and usage data refreshed');
      }
    },
    limits: SUBSCRIPTION_LIMITS[getCurrentTier()]
  };
};

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