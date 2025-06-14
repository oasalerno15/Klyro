'use client';

import React, { useEffect, useState } from 'react';

interface DataPoint {
  month: string;
  value: number;
  color: string;
}

const ModernGraph: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);

  const data: DataPoint[] = [
    { month: 'Jan', value: 2400, color: '#3B82F6' },
    { month: 'Feb', value: 1800, color: '#8B5CF6' },
    { month: 'Mar', value: 3200, color: '#06B6D4' },
    { month: 'Apr', value: 2800, color: '#10B981' },
    { month: 'May', value: 4200, color: '#F59E0B' },
    { month: 'Jun', value: 3800, color: '#EF4444' },
  ];

  const maxValue = Math.max(...data.map(d => d.value));

  useEffect(() => {
    setIsVisible(true);
    
    // Animate values
    const timer = setTimeout(() => {
      data.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedValues(prev => {
            const newValues = [...prev];
            newValues[index] = data[index].value;
            return newValues;
          });
        }, index * 150);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const getBarHeight = (value: number, animatedValue: number = 0) => {
    return (animatedValue / maxValue) * 200; // 200px max height
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-8">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main Graph Container */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Savings</h3>
          <p className="text-gray-600">Track your financial progress with Klyro</p>
        </div>

        {/* Graph Area */}
        <div className="relative h-64 mb-6">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-gray-500 -ml-12">
            <span>${(maxValue / 1000).toFixed(0)}k</span>
            <span>${(maxValue * 0.75 / 1000).toFixed(0)}k</span>
            <span>${(maxValue * 0.5 / 1000).toFixed(0)}k</span>
            <span>${(maxValue * 0.25 / 1000).toFixed(0)}k</span>
            <span>$0</span>
          </div>

          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full h-px bg-gray-200 opacity-50" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative h-full flex items-end justify-between px-4">
            {data.map((item, index) => {
              const animatedValue = animatedValues[index] || 0;
              const height = getBarHeight(item.value, animatedValue);
              
              return (
                <div key={item.month} className="flex flex-col items-center group">
                  {/* Value tooltip */}
                  <div 
                    className={`mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0`}
                    style={{ 
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    ${item.value.toLocaleString()}
                  </div>
                  
                  {/* Bar */}
                  <div className="relative w-12 flex flex-col items-center">
                    {/* Glow effect */}
                    <div 
                      className="absolute bottom-0 w-full rounded-t-lg opacity-30 blur-sm"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(to top, ${item.color}, transparent)`,
                        transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: `${index * 150}ms`
                      }}
                    />
                    
                    {/* Main bar */}
                    <div 
                      className="relative w-full rounded-t-lg shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(to top, ${item.color}, ${item.color}CC)`,
                        transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: `${index * 150}ms`
                      }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 rounded-t-lg bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  
                  {/* Month label */}
                  <div className="mt-3 text-sm font-medium text-gray-700">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+24%</div>
            <div className="text-sm text-gray-600">Growth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${(data.reduce((sum, item) => sum + item.value, 0) / 1000).toFixed(0)}k</div>
            <div className="text-sm text-gray-600">Total Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.length}</div>
            <div className="text-sm text-gray-600">Months</div>
          </div>
        </div>
      </div>

      {/* Floating elements for visual appeal */}
      <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-60 animate-pulse" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 -right-6 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-50 animate-ping" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export default ModernGraph; 