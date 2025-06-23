'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { createClient } from '@/lib/supabase/client';

export default function DebugSubscription() {
  const { user } = useAuth();
  const { subscription, getCurrentTier, usage, loading } = useSubscription();
  const [dbSubscription, setDbSubscription] = useState(null);
  const [dbUsage, setDbUsage] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDirectFromDB();
    }
  }, [user]);

  const fetchDirectFromDB = async () => {
    if (!user?.id) return;

    const supabase = createClient();
    
    // Get subscription directly from database
    const { data: subData, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('Direct DB subscription query:', { subData, subError });
    setDbSubscription(subData);

    // Get usage directly from database
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year', currentMonth);

    console.log('Direct DB usage query:', { usageData, usageError });
    setDbUsage(usageData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Debug Subscription</h1>
          <p>Please sign in to debug subscription data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Subscription Data</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hook Data */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">From useSubscription Hook</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
              <div><strong>Current Tier:</strong> {getCurrentTier()}</div>
              <div><strong>Subscription Object:</strong></div>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(subscription, null, 2)}
              </pre>
              <div><strong>Usage:</strong></div>
              <pre className="bg-gray-100 p-2 rounded text-xs">
                {JSON.stringify(usage, null, 2)}
              </pre>
            </div>
          </div>

          {/* Direct DB Data */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-600">Direct from Database</h2>
            <div className="space-y-2 text-sm">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>User Email:</strong> {user.email}</div>
              <div><strong>DB Subscription:</strong></div>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(dbSubscription, null, 2)}
              </pre>
              <div><strong>DB Usage:</strong></div>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(dbUsage, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-x-4">
          <button
            onClick={fetchDirectFromDB}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh DB Data
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Reload Page
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Check if the subscription data matches between hook and database</li>
            <li>2. Verify the subscription_tier field in the database</li>
            <li>3. Look for any differences in the loading states</li>
            <li>4. Check if the ProfileModal is using the same hook data</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 