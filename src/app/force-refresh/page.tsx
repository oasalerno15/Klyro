'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from '@/hooks/usePaywall';

export default function ForceRefreshPage() {
  const { user } = useAuth();
  const { refreshSubscription, getCurrentTier, usage } = useSubscription();
  const { checkFeatureAccess } = usePaywall();
  const [refreshed, setRefreshed] = useState(false);
  const [status, setStatus] = useState('Starting refresh...');

  useEffect(() => {
    if (user && !refreshed) {
      forceRefreshAll();
    }
  }, [user, refreshed]);

  const forceRefreshAll = async () => {
    setStatus('🔄 Refreshing subscription data...');
    
    try {
      // Force refresh the subscription hook
      await refreshSubscription();
      setStatus('✅ Subscription refreshed!');
      
      // Wait a moment for hooks to update
      setTimeout(() => {
        setStatus('🔍 Checking AI chat access...');
        
        // Test the paywall
        const canUseAI = checkFeatureAccess('ai_chat');
        const currentTier = getCurrentTier();
        
        setStatus(`✅ Complete! Tier: ${currentTier}, AI Access: ${canUseAI ? 'ALLOWED' : 'BLOCKED'}`);
        setRefreshed(true);
      }, 1000);
      
    } catch (error) {
      setStatus('❌ Error refreshing data');
      console.error('Refresh error:', error);
    }
  };

  const testAiAccess = () => {
    const canUse = checkFeatureAccess('ai_chat');
    const tier = getCurrentTier();
    alert(`Current Tier: ${tier}\nAI Chat Access: ${canUse ? '✅ ALLOWED' : '❌ BLOCKED'}\n\nUsage: ${JSON.stringify(usage, null, 2)}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to refresh your subscription</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Force Refresh Subscription</h1>
        
        <div className="mb-6">
          <div className="text-lg mb-4">{status}</div>
          {refreshed && (
            <div className="text-green-600 font-semibold">
              🎉 Hooks refreshed! Your AI chat should work now.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={forceRefreshAll}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Force Refresh Again
          </button>
          
          <button
            onClick={testAiAccess}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            🧪 Test AI Access
          </button>
          
          <a
            href="/dashboard"
            className="block w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-decoration-none"
          >
            ➡️ Go to Dashboard & Try AI Chat
          </a>
        </div>

        {refreshed && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">✅ Success!</h3>
            <p className="text-green-700 text-sm">
              Your React hooks have been refreshed with the latest database data. 
              The AI chat should now work without any paywall restrictions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 