import { useState, useEffect } from 'react';
import { usageService, type UserUsage, type UserSubscription } from '@/lib/usage-service';
import { useAuth } from '@/lib/auth';
import { type SubscriptionTier, SUBSCRIPTION_LIMITS } from '@/utils/stripe-constants';

export interface UsageData {
  tier: SubscriptionTier;
  usage: UserUsage;
  limits: typeof SUBSCRIPTION_LIMITS[SubscriptionTier];
  remaining: {
    transactions: number;
    receipts: number;
    ai_chats: number;
  };
  subscription: UserSubscription | null;
}

export function useUsage() {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load usage data
  const loadUsageData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [summary, subscription] = await Promise.all([
        usageService.getUsageSummary(user.id),
        usageService.getUserSubscription(user.id)
      ]);

      setUsageData({
        ...summary,
        subscription
      });
    } catch (err) {
      console.error('Error loading usage data:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  // Check if user can perform an action
  const canPerformAction = async (action: 'transaction' | 'receipt' | 'ai_chat') => {
    if (!user?.id) return { allowed: false, remaining: 0, limit: 0, tier: 'free' as SubscriptionTier };
    
    try {
      return await usageService.canPerformAction(user.id, action);
    } catch (err) {
      console.error('Error checking action permission:', err);
      return { allowed: false, remaining: 0, limit: 0, tier: 'free' as SubscriptionTier };
    }
  };

  // Increment usage and refresh data
  const incrementUsage = async (action: 'transaction' | 'receipt' | 'ai_chat') => {
    if (!user?.id) return false;

    try {
      const success = await usageService.incrementUsage(user.id, action);
      if (success) {
        // Refresh usage data after successful increment
        await loadUsageData();
      }
      return success;
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return false;
    }
  };

  // Update subscription (called after successful payment)
  const updateSubscription = async (subscriptionData: {
    tier: SubscriptionTier;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status?: 'active' | 'canceled' | 'past_due' | 'incomplete';
  }) => {
    if (!user?.id) return false;

    try {
      const success = await usageService.updateUserSubscription(user.id, subscriptionData);
      if (success) {
        await loadUsageData();
      }
      return success;
    } catch (err) {
      console.error('Error updating subscription:', err);
      return false;
    }
  };

  // Helper functions for common checks
  const canUploadReceipt = () => {
    if (!usageData) return false;
    return usageData.limits.receipts === -1 || usageData.usage.receipts < usageData.limits.receipts;
  };

  const canUseAI = () => {
    if (!usageData) return false;
    return usageData.limits.aiChats === -1 || usageData.usage.aiChats < usageData.limits.aiChats;
  };

  const canAddTransaction = () => {
    if (!usageData) return false;
    return usageData.limits.transactions === -1 || usageData.usage.transactions < usageData.limits.transactions;
  };

  // Get remaining counts for display
  const getRemainingText = (type: 'transactions' | 'receipts' | 'ai_chats') => {
    if (!usageData) return '0';
    const remaining = usageData.remaining[type];
    return remaining === -1 ? 'Unlimited' : remaining.toString();
  };

  // Load data when user changes
  useEffect(() => {
    loadUsageData();
  }, [user?.id]);

  return {
    usageData,
    loading,
    error,
    canPerformAction,
    incrementUsage,
    updateSubscription,
    canUploadReceipt,
    canUseAI,
    canAddTransaction,
    getRemainingText,
    refresh: loadUsageData
  };
} 