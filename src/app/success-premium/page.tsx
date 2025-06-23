'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function SuccessPremium() {
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

    console.log('🎯 Creating Premium subscription for user:', user.email);
    
    try {
      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const subscriptionData = {
        user_id: user.id,
        subscription_tier: 'premium',
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

      console.log('✅ Premium subscription created/updated successfully');
      
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
        router.push('/dashboard?upgraded=premium');
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
    <div className="min-h-screen relative">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-50 via-cream-50 to-indigo-100"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%237C3AED" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />
      <div className="absolute inset-0 backdrop-blur-sm bg-white/40" />
      
      {/* Success Modal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            duration: 0.8 
          }}
          className="max-w-md w-full"
        >
          {/* Success Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-200/30 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-8 py-8 text-center relative overflow-hidden">
              {/* Subtle Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded-full blur-xl"></div>
              </div>
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.3,
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15 
                }}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <motion.svg 
                  className="w-8 h-8 text-purple-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </motion.svg>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Welcome to Klyro Premium!
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-purple-100"
              >
                Your unlimited subscription is now active
              </motion.p>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Unlimited access unlocked
                  </h3>
                  <p className="text-sm text-gray-600">
                    Everything you need with no limits
                  </p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { icon: "♾️", text: "Unlimited transactions", delay: 1.0 },
                    { icon: "📸", text: "Unlimited receipt scans", delay: 1.1 },
                    { icon: "🧠", text: "Unlimited AI conversations", delay: 1.2 },
                    { icon: "🚀", text: "Premium analytics & insights", delay: 1.3 }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: feature.delay }}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 border border-purple-100"
                    >
                      <div className="text-xl">{feature.icon}</div>
                      <span className="text-gray-700 font-medium text-sm">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="text-center"
              >
                {processing ? (
                  <div className="flex items-center justify-center space-x-3 py-3">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 text-sm">Setting up your account...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-purple-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-sm">Setup complete!</span>
                    </div>
                    <p className="text-xs text-gray-500">Redirecting to your dashboard...</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 