import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { planService, type PlanType, type PlanLimits } from '@/lib/plan-service';

interface PlanState {
  plan: PlanType;
  limits: PlanLimits;
  loading: boolean;
  error: string | null;
}

export function usePlan() {
  const { user } = useAuth();
  const [planState, setPlanState] = useState<PlanState>({
    plan: 'free',
    limits: planService.getPlanLimits('free'),
    loading: true,
    error: null,
  });

  const fetchPlan = async () => {
    if (!user) {
      setPlanState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setPlanState(prev => ({ ...prev, loading: true, error: null }));
      const userPlan = await planService.getUserPlan(user.id);
      const limits = planService.getPlanLimits(userPlan);

      setPlanState({
        plan: userPlan,
        limits,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
      setPlanState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch plan information',
      }));
    }
  };

  const updatePlan = async (newPlan: PlanType): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await planService.updateUserPlan(user.id, newPlan);
      if (success) {
        const limits = planService.getPlanLimits(newPlan);
        setPlanState(prev => ({
          ...prev,
          plan: newPlan,
          limits,
        }));
      }
      return success;
    } catch (error) {
      console.error('Error updating plan:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [user?.id]);

  // Helper functions
  const canAccessAIInsights = (): boolean => {
    return planService.canAccessAIInsights(planState.plan);
  };

  const canAccessFeature = (feature: 'aiInsights' | 'transactions' | 'receipts' | 'aiChats'): boolean => {
    return planService.canAccessFeature(planState.plan, feature);
  };

  const getFeatureLimit = (feature: 'transactions' | 'receipts' | 'aiChats'): number => {
    return planService.getFeatureLimit(planState.plan, feature);
  };

  const isPaidPlan = (): boolean => {
    return planService.isPaidPlan(planState.plan);
  };

  const getPlanDisplayName = (): string => {
    return planService.getPlanDisplayName(planState.plan);
  };

  const requiresUpgrade = (feature: 'aiInsights' | 'transactions' | 'receipts' | 'aiChats'): boolean => {
    return !canAccessFeature(feature);
  };

  return {
    ...planState,
    fetchPlan,
    updatePlan,
    canAccessAIInsights,
    canAccessFeature,
    getFeatureLimit,
    isPaidPlan,
    getPlanDisplayName,
    requiresUpgrade,
  };
} 