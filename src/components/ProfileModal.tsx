'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import PaywallModal from './PaywallModal';

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

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!user?.id) return;
      
      const supabase = createClient();
      
      try {
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  
                  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
                    <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {accountStats.aiInsightsGenerated}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      AI Insights
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
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Free</span>
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
                    <button className={`w-full text-left px-4 py-3 mt-4 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'} text-sm transition-colors`}>
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
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Free tier with basic features</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        Free
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Usage This Month</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Transactions processed</p>
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {accountStats.transactionsCount}/100
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-800'}`}
                        style={{ width: `${Math.min((accountStats.transactionsCount / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button 
                        onClick={() => setShowPaywall(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                      >
                        Upgrade Plan
                      </button>
                      <button 
                        onClick={() => setShowBilling(true)}
                        className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'} text-sm font-medium transition-colors`}
                      >
                        View Billing
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
          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="upgrade"
            currentPlan="free"
            onUpgrade={() => setShowPaywall(false)}
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
                        <h4 className="font-medium text-gray-900 text-sm">Free Plan</h4>
                        <p className="text-xs text-gray-500">$0.00/month</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">5</p>
                      <p className="text-xs text-gray-500">Transactions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">2</p>
                      <p className="text-xs text-gray-500">Receipts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">AI Chats</p>
                    </div>
                  </div>
                </div>

                {/* Compact Usage */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Current Usage</h4>
                  
                  {/* Transactions */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">Transactions</span>
                      <span className="text-xs text-gray-500">{accountStats.transactionsCount}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          accountStats.transactionsCount >= 5 ? 'bg-red-500' : 
                          accountStats.transactionsCount >= 3 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((accountStats.transactionsCount / 5) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Receipts */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">Receipt Scans</span>
                      <span className="text-xs text-gray-500">{accountStats.receiptsUploaded}/2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          accountStats.receiptsUploaded >= 2 ? 'bg-red-500' : 
                          accountStats.receiptsUploaded >= 1 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((accountStats.receiptsUploaded / 2) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* AI Chats */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">AI Conversations</span>
                      <span className="text-xs text-gray-500">Upgrade required</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-gray-300 h-1.5 rounded-full w-0"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Need help? <button className="text-blue-600 hover:text-blue-700 font-medium">Contact support</button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowBilling(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowBilling(false);
                        setShowPaywall(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 