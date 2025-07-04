'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import TrialPaywallModal from './TrialPaywallModal';
import { useSubscription } from '@/hooks/useSubscription';

interface ProfileModalProps {
  user: any;
  darkMode: boolean;
  onClose: () => void;
}

interface Activity {
  type: 'transaction' | 'mood';
  description: string;
  date: string;
}

export default function ProfileModal({ user, darkMode, onClose }: ProfileModalProps) {
  const [accountStats, setAccountStats] = useState({
    transactionsCount: 0,
    totalSpent: 0,
    receiptsUploaded: 0,
    aiInsightsGenerated: 0,
    moodLogsCount: 0,
    accountAge: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Use subscription hook for actual data
  const { 
    subscription, 
    loading: subscriptionLoading, 
    usage, 
    getCurrentTier, 
    limits,
    refresh
  } = useSubscription();

  const currentTier = getCurrentTier();

  console.log('🔍 ProfileModal - User:', user?.id);
  console.log('📊 ProfileModal - Subscription:', subscription);
  console.log('🎯 ProfileModal - Current Tier:', currentTier);
  console.log('📈 ProfileModal - Usage:', usage);
  console.log('🎛️ ProfileModal - Limits:', limits);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!user?.id) return;
      
      const supabase = createClient();
      
      try {
        // Refresh subscription data first
        await refresh();
        
        // Fetch transaction stats
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('amount, created_at, ai_insight, source')
          .eq('user_id', user.id);

        // Fetch mood logs count
        const { data: moodLogs, error: moodError } = await supabase
          .from('mood_logs')
          .select('id, created_at')
          .eq('user_id', user.id);

        // Calculate stats
        const transactionsCount = transactions?.length || 0;
        const totalSpent = transactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
        const receiptsUploaded = transactions?.filter(tx => tx.source === 'receipt').length || 0;
        const aiInsightsGenerated = transactions?.filter(tx => tx.ai_insight).length || 0;
        const moodLogsCount = moodLogs?.length || 0;
        
        // Calculate account age
        const accountCreated = new Date(user.created_at);
        const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

        // Recent activity (last 5 transactions)
        const recentTransactions = transactions?.slice(0, 5).map(tx => ({
          type: 'transaction' as const,
          description: `${tx.source === 'receipt' ? 'Receipt uploaded' : 'Transaction'}: $${Math.abs(tx.amount).toFixed(2)}`,
          date: tx.created_at
        })) || [];

        const recentMoods = moodLogs?.slice(0, 3).map(mood => ({
          type: 'mood' as const,
          description: 'Mood logged',
          date: mood.created_at
        })) || [];

        const allActivity = [...recentTransactions, ...recentMoods]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        setAccountStats({
          transactionsCount,
          totalSpent,
          receiptsUploaded,
          aiInsightsGenerated,
          moodLogsCount,
          accountAge
        });
        setRecentActivity(allActivity);
      } catch (error) {
        console.warn('Could not fetch account data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [user]);

  // Refresh subscription data when modal opens
  useEffect(() => {
    if (user) {
      refresh();
      
      // Direct database check for debugging
      const checkSubscriptionDirectly = async () => {
        const supabase = createClient();
        console.log('🔍 Direct DB check for user:', user.id);
        
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id);
          
        console.log('📊 Direct DB result:', { data, error });
      };
      
      checkSubscriptionDirectly();
    }
  }, [user, refresh]);

  // Auto-refresh usage data every 10 seconds when modal is open
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing subscription/usage data...');
      refresh();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [user, refresh]);

  // Also refresh when window gains focus (user returns to tab)
  useEffect(() => {
    if (!user) return;
    
    const handleFocus = () => {
      console.log('🔄 Window focused - refreshing subscription data...');
      refresh();
    };
    
    // Listen for global refresh events (e.g., from AI chat completion)
    const handleGlobalRefresh = () => {
      console.log('🔄 Global refresh event received - updating subscription data...');
      refresh();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('refreshSubscriptionData', handleGlobalRefresh);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('refreshSubscriptionData', handleGlobalRefresh);
    };
  }, [user, refresh]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const accountTier = accountStats.transactionsCount > 50 ? 'Premium User' : 
                     accountStats.transactionsCount > 10 ? 'Active User' : 'New User';

  const handleCancelSubscription = async () => {
    if (!user?.id) return;
    
    setCancelLoading(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        // Update local subscription state
        await refresh();
        setShowCancelModal(false);
        setShowBilling(false);
        
        // Show success message (you could add a toast notification here)
        alert('Subscription cancelled successfully. You can continue using premium features until the end of your billing period.');
      } else {
        const error = await response.json();
        alert(`Failed to cancel subscription: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDownloadData = async () => {
    if (!user?.id) return;
    
    try {
      // For now, we'll show a placeholder message
      // In a real implementation, this would call an API to generate and download user data
      alert('Data export will be sent to your email address within 24 hours.');
    } catch (error) {
      console.error('Error requesting data download:', error);
      alert('Failed to request data download. Please try again or contact support.');
    }
  };

  const handleUpdatePaymentMethod = () => {
    // For now, show a placeholder message
    // In a real implementation, this would redirect to Stripe customer portal or open a payment method update modal
    alert('Redirecting to payment method update...');
  };

  const handleViewBillingHistory = () => {
    // For now, show a placeholder message
    // In a real implementation, this would open a detailed billing history view or redirect to customer portal
    alert('Opening detailed billing history...');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-4xl mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-gray-800 to-gray-900`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold">
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user?.user_metadata?.full_name || user?.email || 'U')
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Account Overview
                </h2>
                <p className="text-white/80 text-sm">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'} • {accountTier}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Account Stats */}
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                  Account Statistics
                </h3>
                
                {/* Professional Statistics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
                    <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {accountStats.transactionsCount}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Transactions
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
                    <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                      ${accountStats.totalSpent.toFixed(0)}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Tracked
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
                    <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {accountStats.receiptsUploaded}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Receipts Uploaded
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Account Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email:</span>
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member since:</span>
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {accountStats.accountAge === 0 ? 'Today' : `${accountStats.accountAge} days ago`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Plan:</span>
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Privacy & Security
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Data Analytics</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Allow usage analytics to improve the service</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className={`w-11 h-6 rounded-full peer transition-colors ${darkMode ? 'bg-gray-600 peer-checked:bg-gray-800' : 'bg-gray-200 peer-checked:bg-gray-800'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Insights</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Generate personalized financial insights</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className={`w-11 h-6 rounded-full peer transition-colors ${darkMode ? 'bg-gray-600 peer-checked:bg-gray-800' : 'bg-gray-200 peer-checked:bg-gray-800'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email Notifications</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Receive weekly spending summaries</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className={`w-11 h-6 rounded-full peer transition-colors ${darkMode ? 'bg-gray-600 peer-checked:bg-gray-800' : 'bg-gray-200 peer-checked:bg-gray-800'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                      </label>
                    </div>
                    <button 
                      onClick={handleDownloadData}
                      className={`w-full text-left px-4 py-3 mt-4 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'} text-sm transition-colors`}>
                      <div className="flex items-center justify-between">
                        <span>Download My Data</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Billing */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Billing & Subscription
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Current Plan</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {currentTier === 'free' ? 'Free tier with basic features' :
                           currentTier === 'starter' ? 'Starter plan with essential features' :
                           currentTier === 'pro' ? 'Pro plan with advanced features' :
                           'Premium plan with unlimited access'}
                        </p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        currentTier === 'free' ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700') :
                        currentTier === 'starter' ? 'bg-green-100 text-green-800' :
                        currentTier === 'pro' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button 
                        onClick={() => setShowPaywall(true)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                      >
                        Upgrade
                      </button>
                      <button 
                        onClick={() => setShowBilling(true)}
                        className={`px-3 py-2 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'} text-xs font-medium transition-colors`}
                      >
                        Billing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Need help? Contact{' '}
              </span>
              <button className="text-gray-800 hover:text-gray-900 font-medium">
                support@klyro.app
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <TrialPaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="premium features"
          />
        )}
      </AnimatePresence>

      {/* Billing Modal */}
      <AnimatePresence>
        {showBilling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            onClick={() => setShowBilling(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Compact Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Billing Overview</h3>
                      <p className="text-xs text-gray-500">Account usage and subscription details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBilling(false)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Compact Content */}
              <div className="px-6 py-4 space-y-5">
                {/* Subscription Status */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {getCurrentTier().charAt(0).toUpperCase() + getCurrentTier().slice(1)} Plan
                        </h4>
                        <p className="text-xs text-gray-500">
                          {getCurrentTier() === 'free' ? '$0.00/month' : 
                           getCurrentTier() === 'starter' ? '$9.99/month' :
                           getCurrentTier() === 'pro' ? '$24.99/month' : '$49.99/month'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {subscription?.status === 'active' ? 'Active' : 'Active'}
                    </span>
                  </div>
                  
                  {getCurrentTier() !== 'free' && (
                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      {/* Payment Method */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded text-white text-xs font-bold flex items-center justify-center">
                            VISA
                          </div>
                          <span className="text-sm text-gray-700">•••• •••• •••• 4242</span>
                        </div>
                        <button 
                          onClick={handleUpdatePaymentMethod}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Update
                        </button>
                      </div>
                      
                      {/* Next Billing */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Next billing date:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {subscription?.current_period_end ? 
                            new Date(subscription.current_period_end).toLocaleDateString() : 
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Billing History */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Recent Billing</h4>
                  
                  {getCurrentTier() === 'free' ? (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">No billing history</p>
                      <p className="text-xs text-gray-400">You're on the free plan</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Mock billing history */}
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getCurrentTier().charAt(0).toUpperCase() + getCurrentTier().slice(1)} Plan
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${getCurrentTier() === 'starter' ? '9.99' : 
                              getCurrentTier() === 'pro' ? '24.99' : '49.99'}
                          </p>
                          <p className="text-xs text-gray-500">Paid</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getCurrentTier().charAt(0).toUpperCase() + getCurrentTier().slice(1)} Plan
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${getCurrentTier() === 'starter' ? '9.99' : 
                              getCurrentTier() === 'pro' ? '24.99' : '49.99'}
                          </p>
                          <p className="text-xs text-gray-500">Paid</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleViewBillingHistory}
                        className="w-full text-center py-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        View all billing history
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Need help? <button className="text-blue-600 hover:text-blue-700 font-medium">Contact support</button>
                  </div>
                  <div className="flex space-x-2">
                    {currentTier !== 'free' && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Cancel Plan
                      </button>
                    )}
                    <button
                      onClick={() => setShowBilling(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
                    <p className="text-sm text-gray-500">This will cancel your {currentTier} plan</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">What happens when you cancel:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Your subscription will be cancelled immediately
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      You'll keep premium access until {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'the end of your billing period'}
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      No more charges will be made to your card
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      You can resubscribe anytime to regain full access
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-2">Consider staying with us</h4>
                  <p className="text-sm text-blue-700">
                    You're getting great value with your current plan features. 
                    Are you sure you want to cancel?
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={cancelLoading}
                  >
                    Keep My Plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 