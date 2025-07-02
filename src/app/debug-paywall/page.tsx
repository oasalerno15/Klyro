'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePaywall } from '@/hooks/usePaywall';
import { useSubscription } from '@/hooks/useSubscription';
import { createClient } from '@/lib/supabase/client';

export default function DebugPaywall() {
  const { user } = useAuth();
  const { usage, limits, getCurrentTier, refreshSubscription } = useSubscription();
  const { checkFeatureAccess, paywallState } = usePaywall();
  const [debugInfo, setDebugInfo] = useState('');
  const [testChatCount, setTestChatCount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${message}`);
  };

  const testAIChat = async () => {
    addDebugLog('🔍 Testing AI Chat...');
    
    // Check paywall
    const canUse = checkFeatureAccess('ai_chat');
    addDebugLog(`Paywall check result: ${canUse}`);
    addDebugLog(`Current usage: ${usage?.aiChats || 0}`);
    addDebugLog(`Current limits: ${limits?.aiChats || 0}`);
    addDebugLog(`Current tier: ${getCurrentTier()}`);
    addDebugLog(`Test session count: ${testChatCount}`);
    
    if (!canUse) {
      addDebugLog('❌ Paywall would be triggered');
      return;
    }

    // Simulate AI chat
    setTestChatCount(prev => prev + 1);
    addDebugLog(`✅ AI chat allowed, incrementing test counter to ${testChatCount + 1}`);

    try {
      // Make actual API call to test
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: 'Test message',
          systemPrompt: 'Respond with just "Test successful"'
        }),
      });

      if (response.ok) {
        addDebugLog('✅ API call successful');
        // Refresh data
        await refreshSubscription();
        addDebugLog('🔄 Subscription data refreshed');
      } else {
        const errorData = await response.json();
        addDebugLog(`❌ API call failed: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      addDebugLog(`❌ API error: ${error}`);
    }
  };

  const checkDatabase = async () => {
    if (!user) return;
    
    addDebugLog('🔍 Checking database directly...');
    const supabase = createClient();
    
    try {
      // Check usage table
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id);
      
      addDebugLog(`Usage data: ${JSON.stringify(usageData, null, 2)}`);
      if (usageError) addDebugLog(`Usage error: ${usageError.message}`);

      // Check subscription table
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id);
      
      addDebugLog(`Subscription data: ${JSON.stringify(subData, null, 2)}`);
      if (subError) addDebugLog(`Subscription error: ${subError.message}`);
      
    } catch (error) {
      addDebugLog(`Database error: ${error}`);
    }
  };

  const resetTestCounter = () => {
    setTestChatCount(0);
    addDebugLog('🔄 Test counter reset to 0');
  };

  const clearLogs = () => {
    setDebugInfo('');
  };

  const resetUsageInDatabase = async () => {
    if (!user) return;
    
    addDebugLog('🗑️ Resetting usage in database...');
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('user_usage')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        addDebugLog(`❌ Error resetting usage: ${error.message}`);
      } else {
        addDebugLog('✅ Usage reset successfully');
        await refreshSubscription();
        addDebugLog('🔄 Subscription data refreshed after reset');
      }
    } catch (error) {
      addDebugLog(`❌ Database error: ${error}`);
    }
  };

  const testPlanUpdate = async (plan: string) => {
    if (!user) return;
    
    addDebugLog(`🔄 Testing plan update to ${plan}...`);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('update_user_plan', {
        user_id: user.id,
        new_plan: plan
      });
      
      if (error) {
        addDebugLog(`❌ Plan update failed: ${error.message}`);
      } else {
        addDebugLog(`✅ Plan updated to ${plan} successfully`);
        setCurrentPlan(plan);
        await refreshSubscription();
      }
    } catch (error) {
      addDebugLog(`❌ Plan update error: ${error}`);
    }
  };

  const checkPlanAccess = async () => {
    if (!user) return;
    
    addDebugLog('🔍 Checking plan access...');
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_user_plan', {
        user_id: user.id
      });
      
      if (error) {
        addDebugLog(`❌ Error getting plan: ${error.message}`);
      } else {
        const plan = data || 'free';
        addDebugLog(`Current plan: ${plan}`);
        setCurrentPlan(plan);
        
        // Test AI insights access
        const canAccess = ['starter', 'pro', 'premium'].includes(plan);
        addDebugLog(`Can access AI insights: ${canAccess ? '✅ Yes' : '❌ No'}`);
      }
    } catch (error) {
      addDebugLog(`❌ Plan check error: ${error}`);
    }
  };

  useEffect(() => {
    if (user) {
      addDebugLog(`👤 User logged in: ${user.email}`);
      addDebugLog(`Current tier: ${getCurrentTier()}`);
      addDebugLog(`Usage: ${JSON.stringify(usage)}`);
      addDebugLog(`Limits: ${JSON.stringify(limits)}`);
    }
  }, [user, usage, limits]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Debug Paywall</h1>
          <p>Please sign in to debug paywall functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Paywall Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Controls</h2>
            
            <div className="space-y-3">
              <button
                onClick={testAIChat}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test AI Chat ({testChatCount}/3)
              </button>
              
              <button
                onClick={checkDatabase}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Check Database
              </button>
              
              <button
                onClick={() => refreshSubscription()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Refresh Subscription Data
              </button>
              
              <button
                onClick={resetTestCounter}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Reset Test Counter
              </button>
              
              <button
                onClick={clearLogs}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Logs
              </button>
              
              <button
                onClick={resetUsageInDatabase}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reset Usage in DB
              </button>
              
              <div className="border-t pt-3 mt-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Plan Testing</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => testPlanUpdate('free')}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Set Free
                  </button>
                  <button
                    onClick={() => testPlanUpdate('starter')}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Set Starter
                  </button>
                  <button
                    onClick={() => testPlanUpdate('pro')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Set Pro
                  </button>
                  <button
                    onClick={() => testPlanUpdate('premium')}
                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                  >
                    Set Premium
                  </button>
                  <button
                    onClick={checkPlanAccess}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Check Plan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Current Status</h2>
            
            <div className="space-y-2 text-sm">
              <div><strong>User:</strong> {user.email}</div>
              <div><strong>Tier:</strong> {getCurrentTier()}</div>
              <div><strong>Current Plan:</strong> {currentPlan}</div>
              <div><strong>AI Chats Used:</strong> {usage?.aiChats || 0}</div>
              <div><strong>AI Chats Limit:</strong> {limits?.aiChats || 0}</div>
              <div><strong>Test Session Count:</strong> {testChatCount}</div>
              <div><strong>Can Use AI:</strong> {checkFeatureAccess('ai_chat') ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Can Access AI Insights:</strong> {['starter', 'pro', 'premium'].includes(currentPlan) ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Paywall State:</strong> {paywallState.isOpen ? 'Open' : 'Closed'}</div>
            </div>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto h-96 whitespace-pre-wrap">
            {debugInfo || 'No logs yet...'}
          </pre>
        </div>
      </div>
    </div>
  );
} 