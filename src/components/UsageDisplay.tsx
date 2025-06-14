'use client';

import { useUsage } from '@/hooks/useUsage';
import { motion } from 'framer-motion';
import { CreditCard, FileText, MessageSquare, Zap } from 'lucide-react';

interface UsageDisplayProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
}

export default function UsageDisplay({ compact = false, showUpgradeButton = true }: UsageDisplayProps) {
  const { usageData, loading, getRemainingText } = useUsage();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    );
  }

  if (!usageData) {
    return null;
  }

  const { tier, usage, limits, remaining } = usageData;

  const usageItems = [
    {
      icon: FileText,
      label: 'Receipt Scans',
      used: usage.receipts_scanned,
      limit: limits.receipts,
      remaining: remaining.receipts,
      color: 'blue'
    },
    {
      icon: CreditCard,
      label: 'Transactions',
      used: usage.transactions_used,
      limit: limits.transactions,
      remaining: remaining.transactions,
      color: 'green'
    },
    {
      icon: MessageSquare,
      label: 'AI Chats',
      used: usage.ai_chats_used,
      limit: limits.ai_chats,
      remaining: remaining.ai_chats,
      color: 'purple'
    }
  ];

  const getProgressPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (used: number, limit: number) => {
    if (limit === -1) return 'bg-green-500'; // Unlimited
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 capitalize">{tier} Plan</h3>
          <Zap className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="space-y-2">
          {usageItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">
                {item.limit === -1 ? 'Unlimited' : `${item.used}/${item.limit}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 capitalize">{tier} Plan</h2>
          <p className="text-sm text-gray-600">Your current usage this month</p>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </div>
      </div>

      <div className="space-y-6">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const percentage = getProgressPercentage(item.used, item.limit);
          const progressColor = getProgressColor(item.used, item.limit);

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 text-${item.color}-500`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {item.limit === -1 ? (
                      <span className="text-green-600">Unlimited</span>
                    ) : (
                      `${item.used} / ${item.limit}`
                    )}
                  </div>
                  {item.limit !== -1 && (
                    <div className="text-xs text-gray-500">
                      {item.remaining} remaining
                    </div>
                  )}
                </div>
              </div>
              
              {item.limit !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${progressColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showUpgradeButton && tier === 'free' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Need more? Upgrade your plan for higher limits and premium features.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Upgrade Plan
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 