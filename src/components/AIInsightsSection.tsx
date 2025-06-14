'use client';

import React, { useState, useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

const AIInsightsSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-800 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            AI-Powered Insights
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your Personal
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Financial Advisor</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Klyro's AI analyzes your spending patterns, identifies opportunities, and provides personalized recommendations to optimize your financial health.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text Content */}
          <div>
            <h2 className="text-5xl font-bold mb-8 max-w-3xl text-gray-900">
              Traditional finance apps ignore the emotional dimension of your financial decisions.
            </h2>
            
            <div className="text-2xl font-semibold mb-6 text-gray-700">
              Klyro connects your mood with your money, creating a complete picture of your financial wellbeing.
            </div>
            
            <p className="text-lg text-gray-600 max-w-2xl">
              We've built an intelligent platform that helps you understand how your emotions impact your spending. We believe that society has become disconnected with the true meaning of spending money because of the digital world. That is why Klyro goes beyond what traditional financial apps can offer and we help you reconnect with your financial decisions by making every transaction meaningful and emotionally aware.
            </p>
          </div>

          {/* Right side - AI Analysis Visual Demo */}
          <div className="relative">
            {/* Main demo container */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              {/* Demo header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">AI Analysis</h3>
                  <p className="text-sm text-gray-600">Real-time insights</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Live</span>
                </div>
              </div>

              {/* Animated chart placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 relative overflow-hidden">
                {/* Animated lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                  
                  {/* Animated path */}
                  <path
                    d="M 50 150 Q 100 100 150 120 T 250 80 T 350 100"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    fill="none"
                    className="animate-pulse"
                    style={{
                      strokeDasharray: '1000',
                      strokeDashoffset: isVisible ? '0' : '1000',
                      transition: 'stroke-dashoffset 2s ease-in-out'
                    }}
                  />
                  
                  {/* Data points */}
                  {[50, 150, 250, 350].map((x, i) => (
                    <circle
                      key={i}
                      cx={x}
                      cy={[150, 120, 80, 100][i]}
                      r="4"
                      fill="#3B82F6"
                      className="animate-pulse"
                      style={{
                        animationDelay: `${i * 0.5}s`
                      }}
                    />
                  ))}
                </svg>
                
                {/* Floating insights */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
                  <div className="text-green-600 font-semibold">↗ 12% improvement</div>
                </div>
                
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
                  <div className="text-blue-600 font-semibold">AI Recommendation</div>
                </div>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">24/7</div>
                  <div className="text-sm text-gray-600">Monitoring</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-bounce" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-30 animate-pulse" />
            <div className="absolute top-1/2 -left-4 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-40 animate-ping" />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            <span>Powered by advanced machine learning algorithms</span>
          </div>
          <p className="text-lg text-gray-700">
            Join thousands of users who've improved their financial health with AI-driven insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsSection; 