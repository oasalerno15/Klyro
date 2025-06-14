import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  darkMode?: boolean;
}

// Helper function to convert newlines to paragraph elements
const formatText = (text: string) => {
  return text.split('\n\n').map((paragraph, index) => (
    <p key={index} className={index > 0 ? 'mt-2' : ''}>
      {paragraph}
    </p>
  ));
};

export default function Tooltip({ text, children, position = 'top', darkMode = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Position styles
  const getPositionStyles = () => {
    switch (tooltipPosition) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  // Check if tooltip is within viewport and adjust position if needed
  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Initially use the preferred position
      let newPosition = position;
      
      // Check if tooltip goes outside the viewport
      if (position === 'top' && tooltipRect.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltipRect.bottom > viewportHeight) {
        newPosition = 'top';
      } else if (position === 'left' && tooltipRect.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && tooltipRect.right > viewportWidth) {
        newPosition = 'left';
      }
      
      // Special case for horizontal overflow
      if ((position === 'top' || position === 'bottom') && 
          (tooltipRect.left < 0 || tooltipRect.right > viewportWidth)) {
        // If tooltip overflows horizontally, add extra class for horizontal adjustment
        tooltipRef.current.classList.add('hrestrict');
      } else {
        tooltipRef.current.classList.remove('hrestrict');
      }
      
      // Special case for vertical overflow
      if ((position === 'left' || position === 'right') && 
          (tooltipRect.top < 0 || tooltipRect.bottom > viewportHeight)) {
        // If tooltip overflows vertically, add extra class for vertical adjustment
        tooltipRef.current.classList.add('vrestrict');
      } else {
        tooltipRef.current.classList.remove('vrestrict');
      }
      
      // Update position if needed
      if (newPosition !== tooltipPosition) {
        setTooltipPosition(newPosition);
      }
    }
  }, [isVisible, position, tooltipPosition]);

  // Handle clicks outside to close tooltip when clicked elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div 
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-50 max-w-xs w-auto p-3 text-sm rounded-lg shadow-lg border ${
              darkMode 
                ? 'bg-gray-800 text-gray-200 border-gray-700' 
                : 'bg-white text-gray-700 border-gray-200'
            } ${getPositionStyles()}`}
            style={{ 
              maxWidth: '260px', 
              lineHeight: '1.5',
              textAlign: 'left',
              whiteSpace: 'normal',
              wordBreak: 'normal'
            }}
          >
            {formatText(text)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 