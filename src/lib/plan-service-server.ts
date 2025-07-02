import { createClient } from '@/lib/supabase/server';
import type { PlanType, PlanLimits } from './plan-service';

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    aiInsights: false,
    maxTransactions: 10,
    maxReceipts: 5,
    aiChats: 3,
  },
  starter: {
    aiInsights: true,
    maxTransactions: 20,
    maxReceipts: 20,
    aiChats: 20,
  },
  pro: {
    aiInsights: true,
    maxTransactions: 50,
    maxReceipts: 50,
    aiChats: 100,
  },
  premium: {
    aiInsights: true,
    maxTransactions: -1, // unlimited
    maxReceipts: -1, // unlimited
    aiChats: -1, // unlimited
  },
};

export class ServerPlanService {
  async getUserPlan(userId: string): Promise<PlanType> {
    try {
      const supabase = await createClient();
      
      // Query the user_subscriptions table directly
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('subscription_tier, status')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting user plan:', error);
        return 'free';
      }

      // Return the tier if subscription is active, otherwise free
      if (data && data.status === 'active') {
        return (data.subscription_tier as PlanType) || 'free';
      }

      return 'free';
    } catch (error) {
      console.error('Error getting user plan:', error);
      return 'free';
    }
  }

  async updateUserPlan(userId: string, plan: PlanType): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      // Update the user_subscriptions table directly
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          subscription_tier: plan,
          status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating user plan:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user plan:', error);
      return false;
    }
  }

  getPlanLimits(plan: PlanType): PlanLimits {
    return PLAN_LIMITS[plan];
  }

  canAccessAIInsights(plan: PlanType): boolean {
    return PLAN_LIMITS[plan].aiInsights;
  }

  canAccessFeature(plan: PlanType, feature: 'aiInsights' | 'transactions' | 'receipts' | 'aiChats'): boolean {
    const limits = PLAN_LIMITS[plan];
    
    switch (feature) {
      case 'aiInsights':
        return limits.aiInsights;
      case 'transactions':
        return limits.maxTransactions > 0;
      case 'receipts':
        return limits.maxReceipts > 0;
      case 'aiChats':
        return limits.aiChats > 0;
      default:
        return false;
    }
  }

  getFeatureLimit(plan: PlanType, feature: 'transactions' | 'receipts' | 'aiChats'): number {
    const limits = PLAN_LIMITS[plan];
    
    switch (feature) {
      case 'transactions':
        return limits.maxTransactions;
      case 'receipts':
        return limits.maxReceipts;
      case 'aiChats':
        return limits.aiChats;
      default:
        return 0;
    }
  }

  isPaidPlan(plan: PlanType): boolean {
    return plan !== 'free';
  }

  getPlanDisplayName(plan: PlanType): string {
    switch (plan) {
      case 'free':
        return 'Free';
      case 'starter':
        return 'Starter';
      case 'pro':
        return 'Pro';
      case 'premium':
        return 'Premium';
      default:
        return 'Unknown';
    }
  }
}

// Create a singleton instance
export const serverPlanService = new ServerPlanService(); 