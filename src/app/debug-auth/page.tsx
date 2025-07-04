'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [authStatus, setAuthStatus] = useState<string>('Not tested');
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const supabase = createClient();

  useEffect(() => {
    const info = {
      windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      redirectUrl: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A',
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    };
    setDebugInfo(info);

    // Check current auth status
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setAuthStatus(`Error: ${error.message}`);
      } else if (session) {
        setAuthStatus(`Logged in as: ${session.user.email}`);
      } else {
        setAuthStatus('Not logged in');
      }
    } catch (error: any) {
      setAuthStatus(`Exception: ${error.message}`);
    }
  };

  const testGoogleAuth = async () => {
    console.log('Testing Google Auth with debug info:', debugInfo);
    setAuthStatus('Testing Google Auth...');
    
    try {
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
        setAuthStatus(`Auth Error: ${error.message}`);
        alert(`Auth Error: ${error.message}`);
      } else {
        console.log('Auth success:', data);
        setAuthStatus('Redirecting to Google...');
      }
    } catch (error: any) {
      console.error('Exception during auth:', error);
      setAuthStatus(`Exception: ${error.message}`);
    }
  };

  const testEmailAuth = async () => {
    console.log('Testing Email Auth...');
    setAuthStatus('Testing Email Auth...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Email auth error:', error);
        setAuthStatus(`Email Auth Error: ${error.message}`);
      } else {
        console.log('Email auth success:', data);
        setAuthStatus(`Email Auth Success: ${data.user?.email}`);
        // Try to redirect manually
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error: any) {
      console.error('Exception during email auth:', error);
      setAuthStatus(`Exception: ${error.message}`);
    }
  };

  const testDirectDashboard = () => {
    window.location.href = '/dashboard';
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthStatus('Signed out');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth Status</h2>
          <p className="text-lg font-mono bg-gray-100 p-3 rounded">{authStatus}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={checkAuthStatus}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Refresh Auth Status
            </button>
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Debug Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Email Authentication</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={testEmailAuth}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              Test Email Sign In
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
          <div className="space-x-4">
            <button
              onClick={testGoogleAuth}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Test Google Sign In
            </button>
            <button
              onClick={testDirectDashboard}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Go to Dashboard (Direct)
            </button>
          </div>
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
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800">Key Things to Check:</h3>
            <ul className="list-disc list-inside text-yellow-700 mt-2">
              <li>appUrl should be: https://www.kly-ro.xyz</li>
              <li>windowOrigin should be: https://www.kly-ro.xyz</li>
              <li>redirectUrl should be: https://www.kly-ro.xyz/auth/callback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 