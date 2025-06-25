import { createClient } from '@/lib/supabase/server';
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

export class ServerUsageService {
  // Get user's subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
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
    const supabase = await createClient();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { data, error } = await supabase
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
    console.log('🔧 ServerUsageService.incrementUsage called:', { userId, action });
    
    const canPerform = await this.canPerformAction(userId, action);
    console.log('🔍 Can perform action result:', canPerform);
    
    if (!canPerform.allowed) {
      console.log('❌ Action not allowed - usage limit reached');
      return false;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('📅 Current month:', currentMonth);
    
    // Map action to feature_type
    const featureType = action === 'transaction' ? 'transactions' : 
                       action === 'receipt' ? 'receipts' : 'ai_chats';
    
    console.log('🔄 Calling increment_user_usage RPC with:', {
      p_user_id: userId,
      p_feature_type: featureType,
      p_increment: 1
    });

    try {
      const supabase = await createClient();
      const { error } = await supabase.rpc('increment_user_usage', {
        p_user_id: userId,
        p_feature_type: featureType,
        p_increment: 1
      });

      if (error) {
        console.error('❌ RPC error:', error);
        return false;
      }
      
      console.log('✅ RPC call successful');
      return true;
    } catch (error) {
      console.error('❌ Exception in incrementUsage:', error);
      return false;
    }
  }
}

// Export singleton instance
export const serverUsageService = new ServerUsageService(); 