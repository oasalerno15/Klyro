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
  const { subscription, usage, loading, refreshSubscription, getCurrentTier } = useSubscription();
  const [paywallState, setPaywallState] = useState<PaywallState>({
    isOpen: false,
    feature: '',
    currentPlan: 'free'
  });

  // Get current tier from subscription using the proper function
  const currentTier = getCurrentTier();
  const limits = SUBSCRIPTION_LIMITS[currentTier];

  console.log('🎯 usePaywall - Current Tier:', currentTier);
  console.log('📊 usePaywall - Limits:', limits);
  console.log('📈 usePaywall - Usage:', usage);

  // Check if a feature access is allowed BEFORE performing the action
  const checkFeatureAccess = (feature: string): boolean => {
    console.log('🔍 SIMPLE CHECK - Feature:', feature);
    console.log('🔍 SIMPLE CHECK - Current Tier:', currentTier);
    console.log('🔍 SIMPLE CHECK - Usage:', usage);
    console.log('🔍 SIMPLE CHECK - Limits:', limits);
    
    if (!limits) {
      console.log('❌ No limits found - allowing access');
      return true; // If no limits, allow access
    }
    
    // Check specific feature limits based on tier
    switch (feature) {
      case 'ai_chat':
        const aiLimit = limits.aiChats;
        const currentAIUsage = usage.aiChats;
        
        if (aiLimit === -1) {
          // Unlimited for premium
          console.log('✅ AI CHAT - UNLIMITED ACCESS');
          return true;
        }
        
        if (currentAIUsage >= aiLimit) {
          console.log(`❌ AI CHAT BLOCKED - Used ${currentAIUsage}/${aiLimit} for ${currentTier} tier`);
          showPaywall(feature);
          return false;
        }
        
        console.log(`✅ AI CHAT ALLOWED - Used ${currentAIUsage}/${aiLimit} for ${currentTier} tier`);
        return true;
        
      case 'receipt':
        const receiptLimit = limits.receipts;
        const currentReceiptUsage = usage.receipts;
        
        if (receiptLimit === -1) {
          console.log('✅ RECEIPT - UNLIMITED ACCESS');
          return true;
        }
        
        if (currentReceiptUsage >= receiptLimit) {
          console.log(`❌ RECEIPT BLOCKED - Used ${currentReceiptUsage}/${receiptLimit} for ${currentTier} tier`);
          showPaywall(feature);
          return false;
        }
        
        console.log(`✅ RECEIPT ALLOWED - Used ${currentReceiptUsage}/${receiptLimit} for ${currentTier} tier`);
        return true;
        
      case 'transaction':
        const transactionLimit = limits.transactions;
        const currentTransactionUsage = usage.transactions;
        
        if (transactionLimit === -1) {
          console.log('✅ TRANSACTION - UNLIMITED ACCESS');
          return true;
        }
        
        if (currentTransactionUsage >= transactionLimit) {
          console.log(`❌ TRANSACTION BLOCKED - Used ${currentTransactionUsage}/${transactionLimit} for ${currentTier} tier`);
          showPaywall(feature);
          return false;
        }
        
        console.log(`✅ TRANSACTION ALLOWED - Used ${currentTransactionUsage}/${transactionLimit} for ${currentTier} tier`);
        return true;
        
      default:
        console.log(`❓ Unknown feature: ${feature} - allowing access`);
        return true;
    }
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