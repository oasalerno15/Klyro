'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function SuccessPro() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (!loading && user) {
      createSubscription();
    } else if (!loading && !user) {
      router.push('/?error=auth_required');
    }
  }, [user, loading]);

  const createSubscription = async () => {
    if (!user?.id) return;

    console.log('🎯 Creating Pro subscription for user:', user.email);
    
    try {
      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const subscriptionData = {
        user_id: user.id,
        subscription_tier: 'pro',
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

      console.log('✅ Pro subscription created/updated successfully');
      
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
      
      setTimeout(() => {
        router.push('/dashboard?upgraded=pro');
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
      {/* Logo in top left */}
      <div className="absolute top-6 left-6 z-20">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zM6 8.5L12 5l6 3.5v7L12 19l-6-3.5v-7z"/>
          </svg>
        </div>
      </div>

      {/* Simple Success Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Klyro Pro!</h1>
          <p className="text-gray-600 mb-6">Your subscription is now active with access to all Pro features.</p>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Transactions</span>
              <span className="font-medium">50/month</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Receipt scans</span>
              <span className="font-medium">50/month</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI conversations</span>
              <span className="font-medium">100/month</span>
            </div>
          </div>

          {processing ? (
            <div className="flex items-center justify-center space-x-3 py-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Setting up your account...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Setup complete!</span>
              </div>
              <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 