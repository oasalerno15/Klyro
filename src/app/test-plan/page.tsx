'use client';

import { useState } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/lib/auth';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function TestPlan() {
  const { user } = useAuth();
  const { 
    plan, 
    limits, 
    loading, 
    error, 
    canAccessAIInsights, 
    updatePlan, 
    getPlanDisplayName 
  } = usePlan();
  
  const [testResult, setTestResult] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const testAIInsights = async () => {
    if (!user) {
      setTestResult('❌ No user logged in');
      return;
    }

    setTestResult('🔄 Testing AI insights access...');

    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: 'Test message for plan enforcement',
          systemPrompt: 'Respond with just "Test successful"'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult('✅ AI insights accessible: ' + data.result);
      } else {
        const errorData = await response.json();
        if (response.status === 403 && errorData.upgradeRequired) {
          setTestResult('❌ Plan restriction: ' + errorData.error);
        } else {
          setTestResult('❌ API error: ' + (errorData.error || 'Unknown error'));
        }
      }
    } catch (error) {
      setTestResult('❌ Request failed: ' + error);
    }
  };

  const changePlan = async (newPlan: 'free' | 'starter' | 'pro' | 'premium') => {
    setUpdating(true);
    const success = await updatePlan(newPlan);
    setUpdating(false);
    
    if (success) {
      setTestResult(`✅ Plan updated to ${newPlan}`);
    } else {
      setTestResult(`❌ Failed to update plan to ${newPlan}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Plan Enforcement Test</h1>
          <p>Please sign in to test plan enforcement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Plan Enforcement Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Current Plan Status</h2>
            
            {loading ? (
              <p>Loading plan information...</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div><strong>User:</strong> {user.email}</div>
                <div><strong>Current Plan:</strong> {getPlanDisplayName()}</div>
                <div><strong>Can Access AI Insights:</strong> {canAccessAIInsights() ? '✅ Yes' : '❌ No'}</div>
                <div><strong>AI Chat Limit:</strong> {limits.aiChats === -1 ? 'Unlimited' : limits.aiChats}</div>
                <div><strong>Transaction Limit:</strong> {limits.maxTransactions === -1 ? 'Unlimited' : limits.maxTransactions}</div>
                <div><strong>Receipt Limit:</strong> {limits.maxReceipts === -1 ? 'Unlimited' : limits.maxReceipts}</div>
              </div>
            )}
          </div>

          {/* Plan Testing Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Plan Testing Controls</h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => changePlan('free')}
                  disabled={updating}
                  className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Set Free Plan
                </button>
                <button
                  onClick={() => changePlan('starter')}
                  disabled={updating}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Set Starter Plan
                </button>
                <button
                  onClick={() => changePlan('pro')}
                  disabled={updating}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Set Pro Plan
                </button>
                <button
                  onClick={() => changePlan('premium')}
                  disabled={updating}
                  className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  Set Premium Plan
                </button>
              </div>
              
              <button
                onClick={testAIInsights}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Test AI Insights Access
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}

        {/* Upgrade Prompt Demo */}
        {plan === 'free' && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Upgrade Prompt Demo</h2>
            <UpgradePrompt feature="AI insights" />
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Start with the Free plan and test AI insights access (should be blocked)</li>
            <li>Switch to Starter, Pro, or Premium plan and test again (should work)</li>
            <li>Check that the upgrade prompt appears for free users</li>
            <li>Verify plan limits are displayed correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 