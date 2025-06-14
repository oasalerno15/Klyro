import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/utils/stripe-constants';

export interface UserUsage {
  transactions_used: number;
  receipts_scanned: number;
  ai_chats_used: number;
}

export interface UserSubscription {
  subscription_tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export class UsageService {
  private supabase = createClient();

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('subscription_tier, status, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      // Return free tier if no subscription found
      return {
        subscription_tier: 'free',
        status: 'active'
      };
    }

    return data as UserSubscription;
  }

  // Get user's current month usage
  async getCurrentUsage(userId: string): Promise<UserUsage> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { data, error } = await this.supabase
      .from('user_usage')
      .select('transactions_used, receipts_scanned, ai_chats_used')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();

    if (error || !data) {
      return {
        transactions_used: 0,
        receipts_scanned: 0,
        ai_chats_used: 0
      };
    }

    return data;
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
        currentUsage = usage.transactions_used;
        limit = limits.transactions;
        break;
      case 'receipt':
        currentUsage = usage.receipts_scanned;
        limit = limits.receipts;
        break;
      case 'ai_chat':
        currentUsage = usage.ai_chats_used;
        limit = limits.ai_chats;
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

    // Use upsert to handle both insert and update cases
    const updateField = action === 'transaction' ? 'transactions_used' : 
                       action === 'receipt' ? 'receipts_scanned' : 'ai_chats_used';

    const { error } = await this.supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        [updateField]: (await this.getCurrentUsage(userId))[updateField as keyof UserUsage] + 1
      }, {
        onConflict: 'user_id,month_year'
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
      transactions: limits.transactions === -1 ? -1 : Math.max(0, limits.transactions - usage.transactions_used),
      receipts: limits.receipts === -1 ? -1 : Math.max(0, limits.receipts - usage.receipts_scanned),
      ai_chats: limits.ai_chats === -1 ? -1 : Math.max(0, limits.ai_chats - usage.ai_chats_used)
    };

    return {
      tier,
      usage,
      limits,
      remaining
    };
  }

  // Create or update user subscription (called after successful Stripe payment)
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
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    return !error;
  }
}

// Export singleton instance
export const usageService = new UsageService(); 