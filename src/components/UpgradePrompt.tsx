import React from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Lock, Star, Zap, Check } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UpgradePromptProps {
  feature: string;
  currentTier: string;
  onClose?: () => void;
  userId?: string;
}

const FEATURE_DESCRIPTIONS = {
  transaction: 'transaction logging',
  receipt: 'receipt uploads',
  calendar: 'financial calendar',
  ai_assistant: 'AI conversation assistant',
  advanced_insights: 'advanced analytics',
  custom_categories: 'custom categories',
  export_data: 'data export',
};

const TIER_BENEFITS = {
  starter: {
    price: '$9.99',
    features: [
      '50 transactions per month',
      '10 receipt uploads',
      'Basic mood tracking',
      'Dashboard access',
      'Email support'
    ]
  },
  pro: {
    price: '$24.99',
    features: [
      '500 transactions per month',
      '100 receipt uploads',
      'Advanced insights & analytics',
      'Financial calendar',
      'Goal tracking',
      'Custom categories',
      'Priority support'
    ]
  },
  premium: {
    price: '$49.99',
    features: [
      'Unlimited transactions',
      'Unlimited receipts',
      'AI conversation assistant',
      'Premium calendar features',
      'Data export',
      'Priority support',
      'Everything in Pro'
    ]
  }
};

export default function UpgradePrompt({ feature, currentTier, onClose, userId }: UpgradePromptProps) {
  const featureName = FEATURE_DESCRIPTIONS[feature as keyof typeof FEATURE_DESCRIPTIONS] || feature;
  
  const handleUpgrade = async (tier: 'starter' | 'pro' | 'premium') => {
    if (!userId) {
      alert('Please sign in to upgrade your subscription');
      return;
    }

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Get the appropriate price ID
      const priceIds = {
        starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
        pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        premium: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
      };

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: priceIds[tier],
          userId,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/dashboard?upgrade=cancelled`,
        }),
      });

      const { sessionId, url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        const result = await stripe.redirectToCheckout({ sessionId });
        if (result.error) {
          console.error('Stripe checkout error:', result.error);
          alert('Payment failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to initiate upgrade. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Upgrade Required</h2>
                <p className="text-gray-200">
                  You've reached the limit for {featureName} on the {currentTier} plan
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border-2 border-gray-200 rounded-xl p-6 relative hover:border-gray-300 transition-colors"
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {TIER_BENEFITS.starter.price}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {TIER_BENEFITS.starter.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gray-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('starter')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Upgrade to Starter
              </button>
            </motion.div>

            {/* Pro Plan - Most Popular */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border-2 border-gray-900 rounded-xl p-6 relative bg-gray-50 transform scale-105"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-4 pt-4">
                <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {TIER_BENEFITS.pro.price}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {TIER_BENEFITS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gray-900" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('pro')}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Upgrade to Pro
              </button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border-2 border-gray-200 rounded-xl p-6 relative hover:border-gray-300 transition-colors"
            >
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Premium</h3>
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {TIER_BENEFITS.premium.price}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {TIER_BENEFITS.premium.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gray-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('premium')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Upgrade to Premium
              </button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>All plans include a 14-day free trial. Cancel anytime.</p>
            <p className="mt-1">Upgrade or downgrade your plan as needed.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 