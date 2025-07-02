'use client';

import React, { useState } from 'react';

interface StressDonutChartProps {
  data: {
    moodDrivenSpending: number;
    wantVsNeedSpending: number;
    transactionFrequency: number;
  };
  transactions?: any[]; // Add transactions prop to calculate real percentages
  dashboardDisplay?: 'want-need' | 'mood-driven' | 'frequency' | null;
  onDashboardDisplayChange?: (display: 'want-need' | 'mood-driven' | 'frequency' | null) => void;
}

const StressDonutChart: React.FC<StressDonutChartProps> = ({ data, transactions = [], dashboardDisplay, onDashboardDisplayChange }) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHealthyGuide, setShowHealthyGuide] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  
  // Calculate actual percentages from transaction data
  const totalTransactions = transactions.length;
  const totalSpending = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Mood-Driven: Percentage of spending with non-neutral mood
  const moodDrivenTransactions = transactions.filter(tx => 
    tx.mood_at_purchase && !tx.mood_at_purchase.toLowerCase().includes('neutral')
  );
  const moodDrivenSpending = moodDrivenTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Want vs Need: Separate calculations
  const wantTransactions = transactions.filter(tx => tx.need_vs_want === 'Want');
  const wantSpending = wantTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const needTransactions = transactions.filter(tx => tx.need_vs_want === 'Need');
  const needSpending = needTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Only use real data - no fallbacks
  const rawMoodPercentage = totalSpending > 0 ? (moodDrivenSpending / totalSpending) * 100 : 0;
  const rawWantPercentage = totalSpending > 0 ? (wantSpending / totalSpending) * 100 : 0;
  const rawFrequencyPercentage = totalTransactions > 0 ? Math.min((totalTransactions / 7) * 100, 100) : 0;
  
  // Normalize to 100% total for compact view
  const total = rawMoodPercentage + rawWantPercentage + rawFrequencyPercentage;
  const moodPercentage = total > 0 ? Math.round((rawMoodPercentage / total) * 100) : 0;
  const wantPercentage = total > 0 ? Math.round((rawWantPercentage / total) * 100) : 0;
  const frequencyPercentage = total > 0 ? (100 - moodPercentage - wantPercentage) : 0;

  // Calculations for expanded view charts
  const moodDrivenPercent = totalSpending > 0 ? Math.round((moodDrivenSpending / totalSpending) * 100) : 0;
  const neutralPercent = 100 - moodDrivenPercent;
  
  // Want vs Need should be based on tagged transactions only
  const taggedSpending = wantSpending + needSpending;
  const wantPercent = taggedSpending > 0 ? Math.round((wantSpending / taggedSpending) * 100) : 0;
  const needPercent = taggedSpending > 0 ? (100 - wantPercent) : 0;
  
  // Frequency progress out of 14 transactions per week target (research-based healthy limit)
  const transactionsPerWeek = totalTransactions;
  const frequencyProgress = transactionsPerWeek > 0 ? Math.min(Math.round((transactionsPerWeek / 14) * 100), 100) : 0;
  
  // Helper function to determine activity level
  const getActivityLevel = (transactions: number) => {
    if (transactions === 0) return "No activity";
    if (transactions <= 2) return "Low activity";
    if (transactions <= 7) return "Healthy";
    if (transactions <= 12) return "Moderate";
    return "High activity";
  };
  
  // Enhanced SVG circle parameters
  const size = isExpanded ? 200 : 120;
  const strokeWidth = isExpanded ? 30 : 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate stroke offsets for compact view
  const moodOffset = circumference - (moodPercentage / 100) * circumference;
  const wantOffset = circumference - (wantPercentage / 100) * circumference;
  const frequencyOffset = circumference - (frequencyPercentage / 100) * circumference;
  
  // Calculate rotation angles for compact view
  const wantRotation = (moodPercentage / 100) * 360;
  const frequencyRotation = ((moodPercentage + wantPercentage) / 100) * 360;

  const colors = {
    mood: '#0f172a', // black
    want: '#fef7cd', // cream white  
    frequency: '#14532d', // dark green
    neutral: '#722f37', // burgundy (changed from dark green)
    need: '#d2691e', // caramel (changed from dark green)
    progress: '#14532d' // dark green (changed from blue)
  };

  const tooltipData = {
    mood: {
      title: "Mood-Driven Spending",
      description: "Spending during emotional states vs neutral moods",
      calculation: `$${moodDrivenSpending.toFixed(0)} of $${totalSpending.toFixed(0)}`
    },
    want: {
      title: "Want vs Need Spending", 
      description: "Discretionary purchases vs essential needs",
      calculation: `$${wantSpending.toFixed(0)} of $${totalSpending.toFixed(0)}`
    },
    frequency: {
      title: "Transaction Frequency",
      description: "Purchase frequency relative to healthy patterns",
      calculation: `${transactionsPerWeek} transactions/week`
    }
  };

  // Helper function to create proper donut arcs
  const createDonutPath = (percentage: number, radius: number, strokeWidth: number, startAngle = 0) => {
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return { strokeDasharray, strokeDashoffset };
  };

  // Individual Chart Components
  const MoodChart = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => {
    const radius = (size - strokeWidth) / 2;
    const moodPath = createDonutPath(moodDrivenPercent, radius, strokeWidth);
    const neutralPath = createDonutPath(neutralPercent, radius, strokeWidth);
    
    return (
      <div className="text-center">
        {/* Button above title */}
        {onDashboardDisplayChange && (
          <div className="flex justify-center mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDashboardDisplayChange('mood-driven');
                setIsExpanded(false);
              }}
              className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 rounded border border-gray-200 transition-colors text-[10px]"
            >
              Display in Dashboard
            </button>
          </div>
        )}
        
        {/* Centered title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 text-center">Mood-Driven Spending</h3>
        </div>
        
        <div className="relative mb-4 flex justify-center">
          <div className="transform transition-all duration-300 hover:scale-105 hover:drop-shadow-lg">
            <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
              />
              {/* Mood-driven arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={colors.mood}
                strokeWidth={strokeWidth}
                strokeDasharray={moodPath.strokeDasharray}
                strokeDashoffset={moodPath.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
              />
              {/* Neutral arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={colors.neutral}
                strokeWidth={strokeWidth}
                strokeDasharray={neutralPath.strokeDasharray}
                strokeDashoffset={neutralPath.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                style={{ 
                  transform: `rotate(${(moodDrivenPercent / 100) * 360}deg)`, 
                  transformOrigin: '50% 50%' 
                }}
              />
            </svg>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{moodDrivenPercent}%</span>
            <span className="text-sm text-gray-500">Mood-Driven</span>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.mood }}></div>
              <span>Mood-Driven</span>
            </div>
            <span className="font-semibold">{moodDrivenPercent}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.neutral }}></div>
              <span>Neutral/Not Tagged</span>
            </div>
            <span className="font-semibold">{neutralPercent}%</span>
          </div>
        </div>
      </div>
    );
  };

  const WantNeedChart = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => {
    const radius = (size - strokeWidth) / 2;
    const wantPath = createDonutPath(wantPercent, radius, strokeWidth);
    const needPath = createDonutPath(needPercent, radius, strokeWidth);
    
    return (
      <div className="text-center">
        {/* Button above title */}
        {onDashboardDisplayChange && (
          <div className="flex justify-center mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDashboardDisplayChange('want-need');
                setIsExpanded(false);
              }}
              className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 rounded border border-gray-200 transition-colors text-[10px]"
            >
              Display in Dashboard
            </button>
          </div>
        )}
        
        {/* Centered title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 text-center">Want vs Need Spending</h3>
        </div>
        
        <div className="relative mb-4 flex justify-center">
          <div className="transform transition-all duration-300 hover:scale-105 hover:drop-shadow-lg">
            <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
              />
              {/* Want arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={colors.want}
                strokeWidth={strokeWidth}
                strokeDasharray={createDonutPath(wantPercent, radius, strokeWidth).strokeDasharray}
                strokeDashoffset={createDonutPath(wantPercent, radius, strokeWidth).strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                onMouseEnter={() => setHoveredSegment('want')}
                onMouseLeave={() => setHoveredSegment(null)}
              />
              {/* Need arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={colors.need}
                strokeWidth={strokeWidth}
                strokeDasharray={createDonutPath(needPercent, radius, strokeWidth).strokeDasharray}
                strokeDashoffset={createDonutPath(needPercent, radius, strokeWidth).strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                style={{ 
                  transform: `rotate(${(wantPercent / 100) * 360}deg)`, 
                  transformOrigin: '50% 50%' 
                }}
                onMouseEnter={() => setHoveredSegment('need')}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            </svg>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{wantPercent}%</span>
            <span className="text-sm text-gray-500">Wants</span>
          </div>
          
          {/* Hover Tooltip for Expanded View */}
          {hoveredSegment && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 pointer-events-none">
              {hoveredSegment === 'want' && (
                <>
                  <div className="font-medium mb-1">Want Spending</div>
                  <div className="text-gray-300">Discretionary purchases and non-essential items</div>
                  <div className="text-gray-300 mt-1">
                    <div>Amount: ${wantSpending.toFixed(0)}</div>
                    <div>Percentage: {wantPercent}% of tagged spending</div>
                    <div>Transactions: {wantTransactions.length}</div>
                  </div>
                </>
              )}
              {hoveredSegment === 'need' && (
                <>
                  <div className="font-medium mb-1">Need Spending</div>
                  <div className="text-gray-300">Essential purchases and necessities</div>
                  <div className="text-gray-300 mt-1">
                    <div>Amount: ${needSpending.toFixed(0)}</div>
                    <div>Percentage: {needPercent}% of tagged spending</div>
                    <div>Transactions: {needTransactions.length}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 border border-gray-300" style={{ backgroundColor: colors.want }}></div>
              <span>Want Spending</span>
            </div>
            <span className="font-semibold">{wantPercent}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.need }}></div>
              <span>Need Spending</span>
            </div>
            <span className="font-semibold">{needPercent}%</span>
          </div>
        </div>
      </div>
    );
  };

  const FrequencyChart = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => {
    const radius = (size - strokeWidth) / 2;
    const progressPath = createDonutPath(frequencyProgress, radius, strokeWidth);
    
    return (
      <div className="text-center">
        {/* Button above title */}
        {onDashboardDisplayChange && (
          <div className="flex justify-center mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDashboardDisplayChange('frequency');
                setIsExpanded(false);
              }}
              className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 rounded border border-gray-200 transition-colors text-[10px]"
            >
              Display in Dashboard
            </button>
          </div>
        )}
        
        {/* Centered title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 text-center">Transaction Frequency</h3>
        </div>
        
        <div className="relative mb-4 flex justify-center">
          <div className="transform transition-all duration-300 hover:scale-105 hover:drop-shadow-lg">
            <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
              />
              {/* Progress arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={colors.progress}
                strokeWidth={strokeWidth}
                strokeDasharray={progressPath.strokeDasharray}
                strokeDashoffset={progressPath.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
              />
            </svg>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{transactionsPerWeek}</span>
            <span className="text-sm text-gray-500">per week</span>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Current Rate</span>
            <span className="font-semibold">{transactionsPerWeek} transactions/week</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Frequency</span>
            <span className="font-semibold">{getActivityLevel(transactionsPerWeek)}</span>
          </div>
          <button
            onClick={() => setShowHealthyGuide(true)}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors w-full text-center mt-2"
          >
            view healthy guidelines
          </button>
        </div>
      </div>
    );
  };

  const HealthyGuideModal = () => (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setShowHealthyGuide(false)}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-5xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Healthy Transaction Guidelines</h3>
              <p className="text-gray-500 mt-1">Evidence-based spending frequency recommendations</p>
            </div>
            <button
              onClick={() => setShowHealthyGuide(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Clean Professional Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-2">Klyro Spending Index</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Our proprietary algorithm calculates frequency based on purchases tracked in the past 7 days. 
                    Subscriptions and recurring bills are included in your transaction total for comprehensive analysis.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-2">Your Current Rate</h4>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{transactionsPerWeek} transactions – {getActivityLevel(transactionsPerWeek)}</p>
                  <p className="text-gray-600 text-sm">
                    Based on CFPB & NerdWallet research showing 7-10 transactions per week as the healthy average
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Clean Professional Frequency Guidelines */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Transaction Frequency Guidelines</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Healthy Range */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="font-semibold text-gray-900 text-lg">Healthy Range</span>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-gray-900">3-7</div>
                  <div className="text-sm text-gray-600 font-medium">transactions per week</div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Balanced spending with mindful purchasing decisions and healthy financial habits
                  </div>
                </div>
              </div>
              
              {/* Moderate Range */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="font-semibold text-gray-900 text-lg">Moderate Range</span>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-gray-900">8-12</div>
                  <div className="text-sm text-gray-600 font-medium">transactions per week</div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Slightly elevated but manageable frequency that requires attention
                  </div>
                </div>
              </div>
              
              {/* High Frequency */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-gray-900 text-lg">High Frequency</span>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-gray-900">13+</div>
                  <div className="text-sm text-gray-600 font-medium">transactions per week</div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    May indicate impulsive spending patterns requiring intervention
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isExpanded) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
        
        {/* Full Screen Modal with Three Charts */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-6xl max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Detailed Spending Analysis</h2>
                <p className="text-gray-500 mt-1">Breakdown of your spending patterns and behaviors</p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Three Separate Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <MoodChart size={size} strokeWidth={strokeWidth} />
              <WantNeedChart size={size} strokeWidth={strokeWidth} />
              <FrequencyChart size={size} strokeWidth={strokeWidth} />
            </div>
          </div>
        </div>
        
        {/* Healthy Guide Modal */}
        {showHealthyGuide && <HealthyGuideModal />}
      </>
    );
  }

  // Function to render dashboard chart content based on selected display
  const renderDashboardChart = () => {
    switch (dashboardDisplay) {
      case 'mood-driven':
        return {
          title: 'Mood-Driven Analysis',
          chart: (
            <>
              <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={strokeWidth} />
                <circle
                  cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={colors.mood} strokeWidth={strokeWidth}
                  strokeDasharray={createDonutPath(moodDrivenPercent, radius, strokeWidth).strokeDasharray}
                  strokeDashoffset={createDonutPath(moodDrivenPercent, radius, strokeWidth).strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                />
                <circle
                  cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={colors.neutral} strokeWidth={strokeWidth}
                  strokeDasharray={createDonutPath(neutralPercent, radius, strokeWidth).strokeDasharray}
                  strokeDashoffset={createDonutPath(neutralPercent, radius, strokeWidth).strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                  style={{ transform: `rotate(${(moodDrivenPercent / 100) * 360}deg)`, transformOrigin: '50% 50%' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{moodDrivenPercent}%</span>
                <span className="text-[10px] text-gray-500">Mood-Driven</span>
              </div>
            </>
          ),
          legend: (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.mood }}></div>
                  <span className="text-gray-700">Mood-Driven</span>
                </div>
                <span className="font-medium text-gray-900">{moodDrivenPercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.neutral }}></div>
                  <span className="text-gray-700">Neutral/Not Tagged</span>
                </div>
                <span className="font-medium text-gray-900">{neutralPercent}%</span>
              </div>
            </>
          )
        };
      
      case 'frequency':
        return {
          title: 'Transaction Frequency',
          chart: (
            <>
              <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={strokeWidth} />
                <circle
                  cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={colors.progress} strokeWidth={strokeWidth}
                  strokeDasharray={createDonutPath(frequencyProgress, radius, strokeWidth).strokeDasharray}
                  strokeDashoffset={createDonutPath(frequencyProgress, radius, strokeWidth).strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{transactionsPerWeek}</span>
                <span className="text-[10px] text-gray-500">per week</span>
              </div>
            </>
          ),
          legend: (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Current Rate</span>
                <span className="font-medium text-gray-900">{transactionsPerWeek} transactions/week</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Frequency</span>
                <span className="font-medium text-gray-900">{getActivityLevel(transactionsPerWeek)}</span>
              </div>
            </>
          )
        };
      
      default: // 'want-need'
        return {
          title: 'Want vs Need Analysis',
          chart: (
            <>
              <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={strokeWidth} />
                <circle
                  cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={colors.want} strokeWidth={strokeWidth}
                  strokeDasharray={createDonutPath(wantPercent, radius, strokeWidth).strokeDasharray}
                  strokeDashoffset={createDonutPath(wantPercent, radius, strokeWidth).strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                  onMouseEnter={() => setHoveredSegment('want')} onMouseLeave={() => setHoveredSegment(null)}
                />
                <circle
                  cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={colors.need} strokeWidth={strokeWidth}
                  strokeDasharray={createDonutPath(needPercent, radius, strokeWidth).strokeDasharray}
                  strokeDashoffset={createDonutPath(needPercent, radius, strokeWidth).strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                  style={{ transform: `rotate(${(wantPercent / 100) * 360}deg)`, transformOrigin: '50% 50%' }}
                  onMouseEnter={() => setHoveredSegment('need')} onMouseLeave={() => setHoveredSegment(null)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{wantPercent}%</span>
                <span className="text-[10px] text-gray-500">Wants</span>
              </div>
            </>
          ),
          legend: (
            <>
              <div className="flex items-center justify-between cursor-help relative" onMouseEnter={() => setShowTooltip('want')} onMouseLeave={() => setShowTooltip(null)}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.want }}></div>
                  <span className="text-gray-700">Want Spending</span>
                  <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">{wantPercent}%</span>
                {showTooltip === 'want' && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                    <div className="font-medium mb-1">Want Spending</div>
                    <div className="text-gray-300">Discretionary purchases and non-essential items</div>
                    <div className="text-gray-300 mt-1">Amount: ${wantSpending.toFixed(0)}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between cursor-help relative" onMouseEnter={() => setShowTooltip('need')} onMouseLeave={() => setShowTooltip(null)}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.need }}></div>
                  <span className="text-gray-700">Need Spending</span>
                  <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">{needPercent}%</span>
                {showTooltip === 'need' && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                    <div className="font-medium mb-1">Need Spending</div>
                    <div className="text-gray-300">Essential purchases and necessities</div>
                    <div className="text-gray-300 mt-1">Amount: ${needSpending.toFixed(0)}</div>
                  </div>
                )}
              </div>
            </>
          )
        };
    }
  };

  const dashboardChartData = renderDashboardChart();

  return (
    <div className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsExpanded(true)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {dashboardChartData.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          title="Expand analysis"
        >
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
      
      <div className="w-full relative">
        <div className="flex items-center justify-center mb-4">
          <div className="relative mb-4 flex justify-center">
            <div className="transform transition-all duration-300 hover:scale-105 hover:drop-shadow-lg">
              {dashboardChartData.chart}
            </div>
          </div>
        </div>
        
        {/* Pie Chart Hover Tooltip - only for want-need chart */}
        {dashboardDisplay === 'want-need' && hoveredSegment && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 pointer-events-none">
            {hoveredSegment === 'want' && (
              <>
                <div className="font-medium mb-1">Want Spending</div>
                <div className="text-gray-300">Discretionary purchases and non-essential items</div>
                <div className="text-gray-300 mt-1">
                  <div>Amount: ${wantSpending.toFixed(0)}</div>
                  <div>Percentage: {wantPercent}% of tagged spending</div>
                </div>
              </>
            )}
            {hoveredSegment === 'need' && (
              <>
                <div className="font-medium mb-1">Need Spending</div>
                <div className="text-gray-300">Essential purchases and necessities</div>
                <div className="text-gray-300 mt-1">
                  <div>Amount: ${needSpending.toFixed(0)}</div>
                  <div>Percentage: {needPercent}% of tagged spending</div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Dynamic Legend */}
        <div className="space-y-2 text-xs">
          {dashboardChartData.legend}
        </div>
        
        {/* Click to expand hint */}
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-400">Click to view detailed analysis</span>
        </div>
      </div>
      
      {/* Healthy Guide Modal */}
      {showHealthyGuide && <HealthyGuideModal />}
    </div>
  );
};

export default StressDonutChart; 