import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: 'starter' | 'pro' | 'premium' | null;
  onUpgrade: (tier: 'starter' | 'pro' | 'premium') => Promise<void>;
}

const TIER_NAMES = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium'
};

const TIER_PRICES = {
  starter: '$9.99',
  pro: '$24.99',
  premium: '$49.99'
};

export default function PricingModal({ isOpen, onClose, selectedTier, onUpgrade }: PricingModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  
  const { user, signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      
      if (selectedTier) {
        await onUpgrade(selectedTier);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPayment = async () => {
    setLoading(true);
    try {
      if (selectedTier) {
        await onUpgrade(selectedTier);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-gray-200">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedTier ? `Upgrade to ${TIER_NAMES[selectedTier]}` : 'Create Account'}
              </h2>
              {selectedTier && (
                <p className="text-gray-600 mt-1">
                  {TIER_PRICES[selectedTier]}/month • Cancel anytime
                </p>
              )}
            </div>

            <div className="p-6">
              {user ? (
                /* Already logged in - show payment button */
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Continue to payment as {user.email}
                  </p>
                  <button
                    onClick={handleContinueToPayment}
                    disabled={loading}
                    className="w-full bg-gray-900 text-white rounded-lg py-3 px-4 font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Continue to Payment
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Not logged in - show auth form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white rounded-lg py-3 px-4 font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 