'use client';

import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

export default function PaymentCancelled() {
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
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4"
            >
              <XCircle className="w-8 h-8 text-red-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-lg text-gray-600">
              Your payment was not completed
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                No worries! You can try again whenever you're ready. If you experienced any issues, please don't hesitate to contact our support team.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
              >
                Return to Pricing
              </a>
              <a
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 