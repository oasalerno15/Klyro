import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'receipt' | 'ai_chat' | 'transaction' | 'upgrade';
  currentPlan?: string;
  onUpgrade?: () => void;
}

const FEATURE_DESCRIPTIONS = {
  receipt: 'Receipt scanning and analysis',
  ai_chat: 'AI-powered financial insights',
  transaction: 'Advanced transaction tracking',
  upgrade: 'Premium features'
};

// Payment links - These need to be updated in Stripe dashboard to redirect to:
// Success URL: https://www.kly-ro.xyz/success-{tier} (e.g., /success-starter)
// Cancel URL: https://www.kly-ro.xyz/?canceled=true
const PAYMENT_LINKS = {
  starter: 'https://buy.stripe.com/test_00w4gy5ikd3j4cx8PmcbC00',
  pro: 'https://buy.stripe.com/test_8x27sK124fbr4cx4z6cbC01',
  premium: 'https://buy.stripe.com/test_6oU7sKaCE8N39wRghOcbC02'
};

const PLAN_FEATURES = {
  starter: {
    name: 'Starter',
    price: 9.99,
    yearlyPrice: 99,
    popular: false,
    description: 'Perfect for getting started with financial wellness',
    features: [
      '20 transactions/month',
      '20 receipt scans/month', 
      '20 AI chats/month',
      'Basic mood tracking',
      'Email support'
    ]
  },
  pro: {
    name: 'Pro',
    price: 24.99,
    yearlyPrice: 249,
    popular: true,
    description: 'Best for regular users who want advanced insights',
    features: [
      '50 transactions/month',
      '50 receipt scans/month',
      '100 AI chats/month',
      'Advanced analytics',
      'Priority support',
      'Custom categories',
      'Data export'
    ]
  },
  premium: {
    name: 'Premium',
    price: 49.99,
    yearlyPrice: 499,
    popular: false,
    description: 'For power users who need everything unlocked',
    features: [
      'Unlimited transactions',
      'Unlimited receipt scans',
      'Unlimited AI chats',
      'Premium AI insights',
      'Advanced forecasting',
      'Custom reports',
      'API access',
      '1-on-1 support'
    ]
  }
};

export default function PaywallModal({ isOpen, onClose, feature, currentPlan, onUpgrade }: PaywallModalProps) {
  const { user } = useAuth();

  // Handle payment flow
  const handlePayment = (tier: 'starter' | 'pro' | 'premium') => {
    // If user is not signed in, prompt them to sign in first
    if (!user) {
      alert('Please sign in or create an account before purchasing a subscription. This helps us associate your payment with your account.');
      onClose(); // Close the paywall modal
      // Note: You'd need to trigger the auth modal here in a real app
      return;
    }

    // Store user info in localStorage so webhook can find them
    localStorage.setItem('klyro_payment_user_email', user.email || '');
    
    // Redirect to Stripe
    window.location.href = PAYMENT_LINKS[tier];
  };

  if (!isOpen) return null;

  const featureDescription = FEATURE_DESCRIPTIONS[feature as keyof typeof FEATURE_DESCRIPTIONS] || 'This premium feature';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(254, 252, 232, 0.95)' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
      >
        {/* Placeholder for logo - will be replaced when user uploads actual logo */}
        <div className="absolute top-6 left-6 z-10">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 bg-white rounded-md"></div>
          </div>
        </div>

        {/* Header */}
        <div className="relative p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <div className="text-center pt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Start Your 7-Day Free Trial</h2>
            <p className="text-gray-600 text-lg">
              Try {featureDescription} and all premium features risk-free. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(PLAN_FEATURES).map(([planKey, plan], index) => (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
                className={`relative bg-white rounded-xl border-2 p-6 shadow-lg ${
                  plan.popular 
                    ? 'border-gray-800 shadow-xl transform scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 hover:shadow-xl`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-lg font-bold text-green-600 mb-1">7 Days Free</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">then ${plan.price}</div>
                  <p className="text-gray-500 text-sm">per month • Cancel anytime</p>
                </div>

                <ul className="space-y-3 mb-8 text-sm">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-gray-500 text-xs pl-7">
                      +{plan.features.length - 4} more features
                    </li>
                  )}
                </ul>

                <motion.button
                  onClick={() => handlePayment(planKey as keyof typeof PAYMENT_LINKS)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    plan.popular 
                      ? 'bg-gray-800 hover:bg-gray-900 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start 7-Day Free Trial
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 