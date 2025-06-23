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
      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const subscriptionData = {
        user_id: user.id,
        subscription_tier: 'starter',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: existingSubscription?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('💾 Creating/updating subscription:', subscriptionData);
      
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

      console.log('✅ Starter subscription created/updated successfully');
      
      // Initialize usage for current month (only if no existing usage)
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usageTypes = ['transactions', 'receipts', 'ai_chats'];
      
      for (const featureType of usageTypes) {
        const { data: existingUsage } = await supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', user.id)
          .eq('feature_type', featureType)
          .eq('month_year', currentMonth)
          .single();

        // Only create usage record if it doesn't exist (preserve existing usage)
        if (!existingUsage) {
          await supabase
            .from('user_usage')
            .insert({
              user_id: user.id,
              feature_type: featureType,
              month_year: currentMonth,
              usage_count: 0
            });
        }
      }
      
      console.log('✅ Usage records initialized/preserved');
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
    <div className="min-h-screen relative" style={{ backgroundColor: '#fefce8' }}>
      {/* Placeholder for logo - will be replaced when user uploads actual logo */}
      <div className="absolute top-6 left-6 z-20">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
          <div className="w-6 h-6 bg-white rounded-md"></div>
        </div>
      </div>

      {/* Minimal Success Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          {/* Clean Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            {/* Success Icon */}
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Content */}
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Starter Plan Active</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Your 7-day trial has started. Cancel anytime.
            </p>
            
            {/* Features */}
            <div className="space-y-2 mb-8">
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 text-sm">Transactions</span>
                <span className="text-gray-900 font-medium text-sm">20/month</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 text-sm">Receipt scans</span>
                <span className="text-gray-900 font-medium text-sm">20/month</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 text-sm">AI conversations</span>
                <span className="text-gray-900 font-medium text-sm">10/month</span>
              </div>
            </div>

            {/* Status */}
            {processing ? (
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span className="text-sm">Setting up...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm">Ready</span>
                </div>
                <p className="text-xs text-gray-400">Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 