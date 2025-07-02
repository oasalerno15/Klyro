'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrialPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const STRIPE_LINKS = {
  starter: 'https://buy.stripe.com/test_00w4gy5ikd3j4cx8PmcbC00',
  pro: 'https://buy.stripe.com/test_8x27sK124fbr4cx4z6cbC01',
  premium: 'https://buy.stripe.com/test_6oU7sKaCE8N39wRghOcbC02'
};

const PLAN_FEATURES = {
  starter: [
    '20 transactions/month',
    '20 receipt scans/month', 
    '20 AI chats/month',
    'Basic mood tracking'
  ],
  pro: [
    '50 transactions/month',
    '50 receipt scans/month',
    '100 AI chats/month',
    'Advanced analytics'
  ],
  premium: [
    'Unlimited transactions',
    'Unlimited receipt scans',
    'Unlimited AI chats',
    'Premium AI insights'
  ]
};

export default function TrialPaywallModal({ isOpen, onClose, feature = "AI insights" }: TrialPaywallModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleStartTrial = async (plan: 'starter' | 'pro' | 'premium') => {
    setIsLoading(plan);
    
    // Small delay for UX
    setTimeout(() => {
      window.open(STRIPE_LINKS[plan], '_blank');
      setIsLoading(null);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="relative p-8 text-center border-b border-gray-100">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo placeholder */}
            <div className="w-12 h-12 bg-gray-900 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Start Your 7-Day Free Trial
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Try Premium features and all premium features risk-free. Cancel anytime.
            </p>
          </div>

          {/* Plans */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              
              {/* Starter Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 relative hover:border-gray-300 transition-all duration-200"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="mb-4">
                    <span className="text-lg font-semibold text-green-600">7 Days Free</span>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                      then $9.99
                    </div>
                    <p className="text-gray-500 text-sm mt-1">per month • Cancel anytime</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {PLAN_FEATURES.starter.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  <li className="text-gray-500 text-sm">+1 more features</li>
                </ul>

                <button
                  onClick={() => handleStartTrial('starter')}
                  disabled={isLoading === 'starter'}
                  className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  {isLoading === 'starter' ? (
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Start 7-Day Free Trial'
                  )}
                </button>
              </motion.div>

              {/* Pro Plan - Most Popular */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border-2 border-gray-900 rounded-2xl p-6 relative transform scale-105 shadow-xl"
              >
                {/* Most Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>

                <div className="text-center mb-6 pt-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="mb-4">
                    <span className="text-lg font-semibold text-green-600">7 Days Free</span>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                      then $24.99
                    </div>
                    <p className="text-gray-500 text-sm mt-1">per month • Cancel anytime</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {PLAN_FEATURES.pro.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  <li className="text-gray-500 text-sm">+3 more features</li>
                </ul>

                <button
                  onClick={() => handleStartTrial('pro')}
                  disabled={isLoading === 'pro'}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  {isLoading === 'pro' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Start 7-Day Free Trial'
                  )}
                </button>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 relative hover:border-gray-300 transition-all duration-200"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <div className="mb-4">
                    <span className="text-lg font-semibold text-green-600">7 Days Free</span>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                      then $49.99
                    </div>
                    <p className="text-gray-500 text-sm mt-1">per month • Cancel anytime</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {PLAN_FEATURES.premium.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  <li className="text-gray-500 text-sm">+4 more features</li>
                </ul>

                <button
                  onClick={() => handleStartTrial('premium')}
                  disabled={isLoading === 'premium'}
                  className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  {isLoading === 'premium' ? (
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Start 7-Day Free Trial'
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 