'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export default function FixSubscriptionPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/debug-subscription');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setMessage('Error fetching subscription data');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (tier: string) => {
    setUpdating(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/debug-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_tier', tier })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        await fetchSubscriptionData(); // Refresh data
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to update subscription');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Please sign in to debug your subscription</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading subscription data...</h1>
        </div>
      </div>
    );
  }

  const aiChatUsage = data?.usage?.find((u: any) => u.feature_type === 'ai_chats')?.usage_count || 0;
  const currentTier = data?.subscription?.subscription_tier || 'free';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Fix Your Subscription</h1>
        
        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {message}
          </div>
        )}

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-lg">{data?.user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Tier</label>
              <p className={`text-lg font-semibold ${currentTier === 'pro' ? 'text-green-600' : 'text-red-600'}`}>
                {currentTier}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AI Chats Used This Month</label>
              <p className="text-lg">{aiChatUsage}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AI Chat Limit</label>
              <p className="text-lg">
                {currentTier === 'premium' ? 'Unlimited' : 
                 currentTier === 'pro' ? '100' : 
                 currentTier === 'starter' ? '20' : '3'} chats/month
              </p>
            </div>
          </div>
        </div>

        {/* Fix Options */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Fix Options</h2>
          
          {currentTier !== 'pro' && currentTier !== 'premium' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Issue Found</h3>
              <p className="text-yellow-700">
                Your subscription tier is set to "{currentTier}" but you mentioned you have a Pro plan. 
                This is why you're hitting the paywall.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🚀 ONE-CLICK FIX (Recommended)</h3>
              <button
                onClick={async () => {
                  setUpdating(true);
                  setMessage('🔄 Updating to premium and refreshing...');
                  
                  try {
                    // Update to premium
                    const response = await fetch('/api/debug-subscription', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'update_tier', tier: 'premium' })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                      setMessage('✅ Updated to premium! Refreshing page...');
                      // Force full page reload to reinitialize all React hooks
                      setTimeout(() => {
                        window.location.href = '/dashboard';
                      }, 1500);
                    } else {
                      setMessage(`❌ Error: ${result.error}`);
                      setUpdating(false);
                    }
                  } catch (error) {
                    setMessage('❌ Failed to update subscription');
                    setUpdating(false);
                  }
                }}
                disabled={updating}
                className="w-full px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                🎯 Fix Premium + Go to AI Chat
              </button>
              <p className="text-sm text-gray-600 mt-2">
                This will set your tier to premium and take you directly to the dashboard where AI chat will work.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Manual Options</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => updateSubscription('starter')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Set to Starter (20 AI chats)
                </button>
                <button
                  onClick={() => updateSubscription('pro')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Set to Pro (100 AI chats)
                </button>
                <button
                  onClick={() => updateSubscription('premium')}
                  disabled={updating}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  Set to Premium (Unlimited)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Raw Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Database Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={fetchSubscriptionData}
            disabled={updating}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
} 