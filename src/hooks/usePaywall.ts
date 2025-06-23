import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubscription } from './useSubscription';
import { SUBSCRIPTION_LIMITS } from '@/utils/stripe-constants';

interface PaywallState {
  isOpen: boolean;
  feature: string;
  currentPlan: string;
}

export function usePaywall() {
  const { user } = useAuth();
  const { subscription, usage, loading, refreshSubscription } = useSubscription();
  const [paywallState, setPaywallState] = useState<PaywallState>({
    isOpen: false,
    feature: '',
    currentPlan: 'free'
  });

  // Get current tier from subscription
  const currentTier = subscription?.subscription_tier || 'free';
  const limits = SUBSCRIPTION_LIMITS[currentTier];

  // Check if a feature access is allowed BEFORE performing the action
  const checkFeatureAccess = (feature: string): boolean => {
    if (!user) {
      console.log('❌ No user found');
      showPaywall(feature);
      return false;
    }

    if (!limits) {
      console.log('❌ No limits found for tier:', currentTier);
      showPaywall(feature);
      return false;
    }

    // Check specific feature limits
    switch (feature) {
      case 'receipt':
        const canUseReceipts = limits.receipts === -1 || usage.receipts < limits.receipts;
        console.log(`🧾 Receipt check: ${usage.receipts}/${limits.receipts} - ${canUseReceipts ? 'ALLOWED' : 'BLOCKED'}`);
        if (!canUseReceipts) {
          showPaywall(feature);
          return false;
        }
        break;

      case 'transaction':
        const canUseTransactions = limits.transactions === -1 || usage.transactions < limits.transactions;
        console.log(`💳 Transaction check: ${usage.transactions}/${limits.transactions} - ${canUseTransactions ? 'ALLOWED' : 'BLOCKED'}`);
        if (!canUseTransactions) {
          showPaywall(feature);
          return false;
        }
        break;

      case 'ai_chat':
        const canUseAI = limits.aiChats === -1 || usage.aiChats < limits.aiChats;
        console.log(`🤖 AI Chat check: ${usage.aiChats}/${limits.aiChats} - ${canUseAI ? 'ALLOWED' : 'BLOCKED'}`);
        if (!canUseAI) {
          showPaywall(feature);
          return false;
        }
        break;

      default:
        // For other features, check if they're available in the current tier
        const featureAvailable = limits[feature as keyof typeof limits];
        if (!featureAvailable) {
          showPaywall(feature);
          return false;
        }
        break;
    }

    console.log(`✅ Feature ${feature} access granted for ${currentTier} tier`);
    return true;
  };

  const showPaywall = (feature: string) => {
    console.log(`🔒 Showing paywall for feature: ${feature}`);
    setPaywallState({
      isOpen: true,
      feature,
      currentPlan: currentTier
    });
  };

  const hidePaywall = () => {
    setPaywallState(prev => ({ ...prev, isOpen: false }));
  };

  const getFeatureLimits = () => {
    return limits;
  };

  const isFeatureLocked = (feature: string): boolean => {
    if (!limits) return true;
    
    switch (feature) {
      case 'receipt':
        return limits.receipts === 0;
      case 'transaction': 
        return limits.transactions === 0;
      case 'ai_chat':
        return limits.aiChats === 0;
      default:
        return !limits[feature as keyof typeof limits];
    }
  };

  const getRemainingUsage = (feature: string): number | null => {
    if (!limits) return null;

    switch (feature) {
      case 'receipt':
        return limits.receipts === -1 ? -1 : Math.max(0, limits.receipts - usage.receipts);
      case 'transaction':
        return limits.transactions === -1 ? -1 : Math.max(0, limits.transactions - usage.transactions);
      case 'ai_chat':
        return limits.aiChats === -1 ? -1 : Math.max(0, limits.aiChats - usage.aiChats);
      default:
        return null;
    }
  };

  // Get usage status for display
  const getUsageStatus = () => {
    if (!limits) return null;

    return {
      transactions: {
        used: usage.transactions,
        limit: limits.transactions,
        remaining: getRemainingUsage('transaction'),
        canUse: limits.transactions === -1 || usage.transactions < limits.transactions
      },
      receipts: {
        used: usage.receipts,
        limit: limits.receipts,
        remaining: getRemainingUsage('receipt'),
        canUse: limits.receipts === -1 || usage.receipts < limits.receipts
      },
      aiChats: {
        used: usage.aiChats,
        limit: limits.aiChats,
        remaining: getRemainingUsage('ai_chat'),
        canUse: limits.aiChats === -1 || usage.aiChats < limits.aiChats
      }
    };
  };

  // Increment usage after a successful action
  const incrementUsage = async (feature: string) => {
    if (!user?.id) return false;

    try {
      // Increment in database
      await fetch('/api/usage/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          featureType: feature,
          increment: 1 
        }),
      });

      // Refresh subscription data to get updated usage
      await refreshSubscription();
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  return {
    paywallState,
    checkFeatureAccess,
    showPaywall,
    hidePaywall,
    getFeatureLimits,
    isFeatureLocked,
    getRemainingUsage,
    getUsageStatus,
    incrementUsage,
    subscription,
    currentTier,
    usage,
    loading
  };
} 