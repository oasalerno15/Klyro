'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { PLAN_DETAILS } from '../../../utils/stripe-constants';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [planType, setPlanType] = useState<'starter' | 'pro' | 'premium' | null>(null);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && ['starter', 'pro', 'premium'].includes(plan)) {
      setPlanType(plan as 'starter' | 'pro' | 'premium');
    }
  }, [searchParams]);

  const plan = planType ? PLAN_DETAILS[planType] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Klyro!</h1>
            <p className="text-lg text-gray-600">
              Your subscription has been successfully activated
            </p>
          </div>

          {plan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 rounded-xl p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Plan Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium text-gray-900">${plan.price}/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Billing Interval</span>
                  <span className="font-medium text-gray-900">Monthly</span>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                    <span className="text-blue-600 font-medium">1</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Start Uploading Receipts</h3>
                  <p className="mt-1 text-gray-600">Upload your first receipt to begin tracking your spending patterns and emotional connections.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                    <span className="text-blue-600 font-medium">2</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">View Personalized Insights</h3>
                  <p className="mt-1 text-gray-600">Get AI-powered insights about your spending habits and emotional patterns to make better financial decisions.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                    <span className="text-blue-600 font-medium">3</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Explore Your Plan Features</h3>
                  <p className="mt-1 text-gray-600">Discover all the powerful tools and features available in your {plan?.name} plan.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
            >
              Go to Dashboard
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 