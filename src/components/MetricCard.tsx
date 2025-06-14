import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string;
  changePercent: number;
  insight: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  darkMode?: boolean;
}

export default function MetricCard({
  title,
  value,
  changePercent,
  insight,
  icon,
  onClick,
  darkMode = false
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isPositive = changePercent > 0;
  const changeText = `${isPositive ? '+' : ''}${changePercent.toFixed(1)}%`;
  
  return (
    <motion.div
      className={`rounded-xl border p-6 cursor-pointer transition-all duration-200 ${
        darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-3`}>
            {title}
          </h3>
          
          <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {insight}
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="mb-3">
            <span className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </span>
          </div>
          
          <div className={`inline-flex items-center ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            <svg 
              className="w-3 h-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isPositive 
                  ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                  : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
              />
            </svg>
            <span className="text-sm font-medium ml-0.5">{changeText}</span>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute bottom-2 right-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 