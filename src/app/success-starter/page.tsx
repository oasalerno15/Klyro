'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function SuccessStarter() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (!loading && user) {
      createSubscription();
    } else if (!loading && !user) {
      // Redirect to login if no user
      router.push('/?error=auth_required');
    }
  }, [user, loading]);

  const createSubscription = async () => {
    if (!user?.id) return;

    console.log('🎯 Creating Starter subscription for user:', user.email);
    
    try {
      const subscriptionData = {
        user_id: user.id,
        subscription_tier: 'starter',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('💾 Creating subscription:', subscriptionData);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Error creating subscription:', error);
        setError('Failed to activate subscription. Please contact support.');
        setProcessing(false);
        return;
      }

      console.log('✅ Starter subscription created successfully');
      
      // Initialize usage for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usageTypes = ['transactions', 'receipts', 'ai_chats'];
      
      for (const featureType of usageTypes) {
        await supabase
          .from('user_usage')
          .upsert({
            user_id: user.id,
            feature_type: featureType,
            month_year: currentMonth,
            usage_count: 0
          }, {
            onConflict: 'user_id,feature_type,month_year'
          });
      }
      
      console.log('✅ Usage records initialized');
      setProcessing(false);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard?upgraded=starter');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error in subscription creation:', error);
      setError('An unexpected error occurred. Please contact support.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Klyro Starter!</h1>
        <p className="text-gray-600 mb-6">
          Your subscription has been activated successfully. You now have access to:
        </p>
        
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              20 transactions per month
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              20 receipt scans per month
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              10 AI chats per month
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Receipt scanning & mood tracking
            </li>
          </ul>
        </div>
        
        {processing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
            <span className="text-gray-600">Setting up your account...</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        )}
      </motion.div>
    </div>
  );
} 