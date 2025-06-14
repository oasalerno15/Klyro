'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DailyBriefCardProps {
  date: string;
  mood: string;
  spendingToday: number;
  budgetRemaining: number;
}

const getMoodColor = (mood: string) => {
  switch (mood.toLowerCase()) {
    case 'productive':
      return 'bg-green-100 text-green-800';
    case 'tired':
      return 'bg-yellow-100 text-yellow-800';
    case 'stressed':
      return 'bg-red-100 text-red-800';
    case 'relaxed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function DailyBriefCard({ date, mood, spendingToday, budgetRemaining }: DailyBriefCardProps) {
  const totalBudget = spendingToday + budgetRemaining;
  const spendingPercentage = (spendingToday / totalBudget) * 100;

  return (
    <div className="max-w-[600px] mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5,
          ease: "easeOut"
        }}
        className="bg-white rounded-xl shadow-md p-5 mb-10 ring-1 ring-gray-200 w-full"
      >
        {/* Date and Mood Row */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-500 tracking-tight">Today's Date</h3>
            </div>
            <p className="text-lg font-semibold text-gray-900 tracking-tight">{date}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-500 tracking-tight">Current Mood</h3>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getMoodColor(mood)}`}>
              {mood}
            </span>
          </div>
        </div>

        {/* Spending and Budget Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-medium text-gray-500 tracking-tight">Spending Today</h3>
              </div>
              <p className="text-lg font-semibold text-red-600 tracking-tight">${spendingToday.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-sm font-medium text-gray-500 tracking-tight">Budget Remaining</h3>
              </div>
              <p className="text-lg font-semibold text-green-600 tracking-tight">${budgetRemaining.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-1.5 tracking-tight">
              <span>Spent</span>
              <span>${spendingToday.toFixed(2)} / ${totalBudget.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${spendingPercentage}%` }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 120,
                  duration: 0.8 
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400 tracking-tight">0%</span>
              <span className="text-xs text-gray-400 tracking-tight">100%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 