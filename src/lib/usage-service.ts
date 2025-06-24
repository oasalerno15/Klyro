import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/utils/stripe-constants';

export interface UserUsage {
  transactions: number;
  receipts: number;
  aiChats: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_tier: SubscriptionTier;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export class UsageService {
  private supabase = createClient();

  // Get user's subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  // Get user's current month usage
  async getCurrentUsage(userId: string): Promise<UserUsage> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { data, error } = await this.supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth);

    if (error || !data) {
      return {
        transactions: 0,
        receipts: 0,
        aiChats: 0
      };
    }

    // Convert from feature_type/usage_count format to our interface
    const usageData = {
      transactions: 0,
      receipts: 0,
      aiChats: 0
    };

    data.forEach((item) => {
      if (item.feature_type === 'transactions') usageData.transactions = item.usage_count;
      if (item.feature_type === 'receipts') usageData.receipts = item.usage_count;
      if (item.feature_type === 'ai_chats') usageData.aiChats = item.usage_count;
    });

    return usageData;
  }

  // Check if user can perform an action
  async canPerformAction(userId: string, action: 'transaction' | 'receipt' | 'ai_chat'): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    tier: SubscriptionTier;
  }> {
    const [subscription, usage] = await Promise.all([
      this.getUserSubscription(userId),
      this.getCurrentUsage(userId)
    ]);

    const tier = subscription?.subscription_tier || 'free';
    const limits = SUBSCRIPTION_LIMITS[tier];

    let currentUsage: number;
    let limit: number;

    switch (action) {
      case 'transaction':
        currentUsage = usage.transactions;
        limit = limits.transactions;
        break;
      case 'receipt':
        currentUsage = usage.receipts;
        limit = limits.receipts;
        break;
      case 'ai_chat':
        currentUsage = usage.aiChats;
        limit = limits.aiChats;
        break;
    }

    const allowed = limit === -1 || currentUsage < limit; // -1 means unlimited
    const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);

    return {
      allowed,
      remaining,
      limit,
      tier
    };
  }

  // Increment usage for an action
  async incrementUsage(userId: string, action: 'transaction' | 'receipt' | 'ai_chat'): Promise<boolean> {
    const canPerform = await this.canPerformAction(userId, action);
    
    if (!canPerform.allowed) {
      return false;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Map action to feature_type
    const featureType = action === 'transaction' ? 'transactions' : 
                       action === 'receipt' ? 'receipts' : 'ai_chats';

    try {
      const { error } = await this.supabase.rpc('increment_user_usage', {
        p_user_id: userId,
        p_feature_type: featureType,
        p_increment: 1
      });

      return !error;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  // Update user subscription
  async updateUserSubscription(userId: string, subscriptionData: {
    tier: SubscriptionTier;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status?: 'active' | 'canceled' | 'past_due' | 'incomplete';
  }): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        subscription_tier: subscriptionData.tier,
        stripe_customer_id: subscriptionData.stripeCustomerId,
        stripe_subscription_id: subscriptionData.stripeSubscriptionId,
        status: subscriptionData.status || 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    return !error;
  }

  // Get usage summary for display
  async getUsageSummary(userId: string): Promise<{
    tier: SubscriptionTier;
    usage: UserUsage;
    limits: typeof SUBSCRIPTION_LIMITS[SubscriptionTier];
    remaining: {
      transactions: number;
      receipts: number;
      ai_chats: number;
    };
  }> {
    const [subscription, usage] = await Promise.all([
      this.getUserSubscription(userId),
      this.getCurrentUsage(userId)
    ]);

    const tier = subscription?.subscription_tier || 'free';
    const limits = SUBSCRIPTION_LIMITS[tier];

    const remaining = {
      transactions: limits.transactions === -1 ? -1 : Math.max(0, limits.transactions - usage.transactions),
      receipts: limits.receipts === -1 ? -1 : Math.max(0, limits.receipts - usage.receipts),
      ai_chats: limits.aiChats === -1 ? -1 : Math.max(0, limits.aiChats - usage.aiChats)
    };

    return {
      tier,
      usage,
      limits,
      remaining
    };
  }
}

// Export singleton instance
export const usageService = new UsageService(); 