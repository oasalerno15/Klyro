import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Sample AI insights
const SAMPLE_INSIGHTS = [
  {
    id: 'insight-1',
    title: 'Morning Mood Boost',
    description: 'You tend to log higher mood scores in the morning, averaging 7.5/10 before noon compared to 6.2/10 in the evening.',
    impact: 'High',
    category: 'Mood Pattern',
    recommendation: 'Consider scheduling important decisions or financial planning for morning hours when your mood is typically better.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    id: 'insight-2',
    title: 'Emotional Spending Trigger',
    description: 'Your spending increases by approximately 35% on days when your mood score drops below 5/10.',
    impact: 'Medium',
    category: 'Spending Pattern',
    recommendation: "Try implementing a 24-hour \"cooling off\" period before making purchases when you're feeling down.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    id: 'insight-3',
    title: 'Weekend Happiness',
    description: 'Your weekend mood scores average 1.7 points higher than weekday scores, but weekend spending is also 40% higher.',
    impact: 'Medium',
    category: 'Lifestyle Pattern',
    recommendation: 'Look for free or low-cost weekend activities that still boost your mood to maintain the positive emotional benefit without the financial impact.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: 'insight-4',
    title: 'Budget-Mood Connection',
    description: 'You report a 20% higher average mood score in weeks when you stay within your budget compared to weeks when you exceed it.',
    impact: 'High',
    category: 'Financial Wellbeing',
    recommendation: 'Continue tracking your budget closely as it appears to have a significant positive impact on your emotional wellbeing.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: 'insight-5',
    title: 'Habit Impact',
    description: 'On days when you log exercise, your mood scores average 8.3/10, compared to 6.1/10 on non-exercise days.',
    impact: 'High',
    category: 'Healthy Habits',
    recommendation: 'Consider increasing your exercise frequency to 4-5 times per week to maximize this positive mood effect.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
];

// Impact badge component
const ImpactBadge = ({ impact }: { impact: string }) => {
  const getBadgeColor = () => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-amber-100 text-amber-700';
      case 'Low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getBadgeColor()}`}>
      {impact}
    </span>
  );
};

// Category badge component
const CategoryBadge = ({ category }: { category: string }) => {
  const getBadgeColor = () => {
    switch (category) {
      case 'Mood Pattern':
        return 'bg-purple-100 text-purple-700';
      case 'Spending Pattern':
        return 'bg-emerald-100 text-emerald-700';
      case 'Lifestyle Pattern':
        return 'bg-indigo-100 text-indigo-700';
      case 'Financial Wellbeing':
        return 'bg-cyan-100 text-cyan-700';
      case 'Healthy Habits':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getBadgeColor()}`}>
      {category}
    </span>
  );
};

// Individual insight card component
const InsightCard = ({ insight }: { insight: typeof SAMPLE_INSIGHTS[0] }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div 
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
      whileHover={{ y: -1 }}
      layout
    >
      <div className="p-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-emerald-600">
              {insight.icon}
            </div>
            <h3 className="text-sm font-medium text-gray-900">{insight.title}</h3>
          </div>
          <div className="flex space-x-1">
            <ImpactBadge impact={insight.impact} />
            <CategoryBadge category={insight.category} />
          </div>
        </div>
        
        <p className="mt-1 text-xs text-gray-600 line-clamp-2">{insight.description}</p>
        
        <motion.div
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mt-2 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-800 mb-1">Recommendation:</h4>
            <p className="text-xs text-gray-600">{insight.recommendation}</p>
          </div>
        </motion.div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          {expanded ? 'Hide' : 'View recommendation'}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-3 w-3 ml-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

// Typewriter effect hook
function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
}

export default function AIInsightsView() {
  // Typewriter for subtitle
  const subtitle = useTypewriter('Patterns based on your mood and spending data', 18);

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
      },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 60, damping: 18 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="bg-white rounded-xl border border-gray-200 p-4"
    >
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 relative">
            <span className="ai-glow">AI-Generated Insights</span>
            <style>{`
              .ai-glow {
                text-shadow: 0 0 8px #34d399, 0 0 16px #34d39944;
                animation: ai-glow-pulse 2.2s infinite alternate;
              }
              @keyframes ai-glow-pulse {
                0% { text-shadow: 0 0 8px #34d399, 0 0 16px #34d39944; }
                100% { text-shadow: 0 0 18px #34d399, 0 0 32px #34d39988; }
              }
            `}</style>
          </h2>
          <p className="text-xs text-gray-500 min-h-[18px]">{subtitle}</p>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
          Updated today
        </div>
      </div>
      <motion.div
        className="space-y-2 max-h-[300px] overflow-y-auto pr-1"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {SAMPLE_INSIGHTS.map((insight, idx) => (
          <motion.div key={insight.id} variants={cardVariants}>
            <InsightCard insight={insight} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
} 