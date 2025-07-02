'use client';

import { useState } from 'react';
import { usePlan } from '@/hooks/usePlan';

interface UpgradePromptProps {
  feature?: string;
  className?: string;
}

const STRIPE_LINKS = {
  starter: 'https://buy.stripe.com/test_00w4gy5ikd3j4cx8PmcbC00',
  pro: 'https://buy.stripe.com/test_8x27sK124fbr4cx4z6cbC01',
  premium: 'https://buy.stripe.com/test_6oU7sKaCE8N39wRghOcbC02'
};

const PLAN_PRICING = {
  starter: { price: '$9.99', features: ['AI insights', '20 transactions', '20 AI chats', 'Basic support'] },
  pro: { price: '$24.99', features: ['Everything in Starter', '50 transactions', '100 AI chats', 'Priority support'] },
  premium: { price: '$49.99', features: ['Everything in Pro', 'Unlimited transactions', 'Unlimited AI chats', 'Premium support'] }
};

export default function UpgradePrompt({ feature = 'AI insights', className = '' }: UpgradePromptProps) {
  const { plan, getPlanDisplayName } = usePlan();
  const [showPlans, setShowPlans] = useState(false);

  const handleUpgrade = (planType: 'starter' | 'pro' | 'premium') => {
    window.open(STRIPE_LINKS[planType], '_blank');
  };

  if (showPlans) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Choose Your Plan</h3>
          <button
            onClick={() => setShowPlans(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PLAN_PRICING).map(([planKey, details]) => (
            <div key={planKey} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold capitalize">{planKey}</h4>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {details.price}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6">
                {details.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(planKey as 'starter' | 'pro' | 'premium')}
                className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                  planKey === 'pro' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Upgrade to {planKey.charAt(0).toUpperCase() + planKey.slice(1)}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upgrade Required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            You're currently on the <span className="font-medium">{getPlanDisplayName()}</span> plan. 
            To access {feature}, please upgrade to Starter, Pro, or Premium.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowPlans(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              View Plans
            </button>
            
            <button 
              onClick={() => handleUpgrade('pro')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Quick Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
      
      {/* Feature comparison */}
      <div className="mt-6 pt-6 border-t border-blue-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">What you'll get with any paid plan:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            AI-powered insights
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            More transactions
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Advanced analytics
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Priority support
          </div>
        </div>
      </div>
    </div>
  );
} 