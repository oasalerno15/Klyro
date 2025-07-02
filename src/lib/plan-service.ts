import { createClient } from '@/lib/supabase/client';

export type PlanType = 'free' | 'starter' | 'pro' | 'premium';

export interface PlanLimits {
  aiInsights: boolean;
  maxTransactions: number;
  maxReceipts: number;
  aiChats: number;
}

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

export class PlanService {
  private supabase = createClient();

  async getUserPlan(userId: string): Promise<PlanType> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_plan', {
        user_id: userId
      });

      if (error) {
        console.error('Error getting user plan:', error);
        return 'free';
      }

      return (data as PlanType) || 'free';
    } catch (error) {
      console.error('Error getting user plan:', error);
      return 'free';
    }
  }

  async updateUserPlan(userId: string, plan: PlanType): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('update_user_plan', {
        user_id: userId,
        new_plan: plan
      });

      if (error) {
        console.error('Error updating user plan:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error updating user plan:', error);
      return false;
    }
  }

  async refreshUserPlan(userId: string): Promise<PlanType> {
    try {
      // Force a fresh database query by bypassing any caching
      const { data, error } = await this.supabase.rpc('get_user_plan', {
        user_id: userId
      });

      if (error) {
        console.error('Error refreshing user plan:', error);
        return 'free';
      }

      const plan = (data as PlanType) || 'free';
      console.log('🔄 Refreshed user plan:', { userId, plan });
      return plan;
    } catch (error) {
      console.error('Error refreshing user plan:', error);
      return 'free';
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
export const planService = new PlanService(); 