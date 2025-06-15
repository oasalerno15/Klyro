'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const supabase = createClient();

  useEffect(() => {
    const info = {
      windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      redirectUrl: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A',
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
    };
    setDebugInfo(info);
  }, []);

  const testGoogleAuth = async () => {
    console.log('Testing Google Auth with debug info:', debugInfo);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Auth error:', error);
      alert(`Auth Error: ${error.message}`);
    } else {
      console.log('Auth success:', data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Debug Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
          <button
            onClick={testGoogleAuth}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Test Google Sign In
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Expected Flow</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Test Google Sign In"</li>
            <li>Should redirect to Google OAuth</li>
            <li>After Google auth, should redirect to: <code className="bg-gray-100 px-2 py-1 rounded">{debugInfo.redirectUrl}</code></li>
            <li>Auth callback should process the code</li>
            <li>Should redirect to: <code className="bg-gray-100 px-2 py-1 rounded">{debugInfo.windowOrigin}/dashboard</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
} 