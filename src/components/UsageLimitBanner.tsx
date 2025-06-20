import React from 'react';
import { motion } from 'framer-motion';

interface UsageLimitBannerProps {
  feature: string;
  used: number;
  limit: number;
  onUpgrade: () => void;
  tier: string;
}

const FEATURE_LABELS = {
  transaction: 'Transactions',
  receipt: 'Receipt Scans', 
  ai_chat: 'AI Chats'
};

export default function UsageLimitBanner({ feature, used, limit, onUpgrade, tier }: UsageLimitBannerProps) {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;
  
  const featureLabel = FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS] || feature;

  if (tier === 'premium' && limit >= 500) {
    // Don't show banner for premium users with high limits
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 mb-4 border ${
        isAtLimit 
          ? 'bg-red-50 border-red-200' 
          : isNearLimit 
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
            }`}></div>
            <h4 className="font-medium text-gray-900">
              {featureLabel} Usage ({tier.charAt(0).toUpperCase() + tier.slice(1)} Plan)
            </h4>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>{used} / {limit} used this month</span>
                <span>{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isAtLimit 
                      ? 'bg-red-500' 
                      : isNearLimit 
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {isAtLimit && (
            <p className="text-sm text-red-600 mt-2">
              You've reached your monthly limit. Upgrade to continue using {featureLabel.toLowerCase()}.
            </p>
          )}
          
          {isNearLimit && !isAtLimit && (
            <p className="text-sm text-amber-600 mt-2">
              You're approaching your monthly limit. Consider upgrading for more capacity.
            </p>
          )}
        </div>

        {(isAtLimit || isNearLimit) && (
          <div className="ml-4">
            <button
              onClick={onUpgrade}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isAtLimit
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              Upgrade
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
} 