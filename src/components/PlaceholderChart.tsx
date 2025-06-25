import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format, subDays, parseISO, isSameDay } from 'date-fns';
import { useState, useMemo } from 'react';
import { FaCamera, FaHeart, FaExpand, FaCompress } from 'react-icons/fa';

interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  mood_at_purchase?: string;
}

interface ChartDataPoint {
  date: string;
  formattedDate: string;
  spending: number;
  mood: string | null;
  moodScore: number | null;
  // Normalized mood score to align with spending scale
  normalizedMoodScore: number | null;
}

interface SpendingChartProps {
  transactions: Transaction[];
}

const moodToScore = {
  'Excited': 10,
  'Happy': 9,
  'Content': 8,
  'Optimistic': 7,
  'Calm': 6,
  'Neutral': 5,
  'Tired': 4,
  'Worried': 3,
  'Sad': 2,
  'Anxious': 1,
  'Stressed': 1
};

// Function to get the most common mood for a day
const getMostCommonMood = (moods: string[]): string | null => {
  if (moods.length === 0) return null;
  
  const moodCounts: { [key: string]: number } = {};
  moods.forEach(mood => {
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostCommonMood = moods[0];
  
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonMood = mood;
    }
  });
  
  return mostCommonMood;
};

// Button animation variants
const buttonVariants = {
  rest: {
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeInOut'
    }
  },
  clicked: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
      times: [0, 0.3, 1]
    }
  }
};

// Icon animation variants
const iconVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: 5, scale: 1.1 },
  tap: { rotate: -5, scale: 0.95 },
  clicked: {
    rotate: [0, 180, 360],
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
      times: [0, 0.5, 1]
    }
  }
};

export default function SpendingChart({ transactions }: SpendingChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate data for the last 7 days
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Find all transactions for this day
      const dayTransactions = transactions.filter(tx => {
        const txDate = parseISO(tx.date);
        return isSameDay(txDate, date);
      });
      
      // Calculate total spending for the day
      const totalSpending = dayTransactions.reduce((sum, tx) => {
        return sum + Math.abs(tx.amount);
      }, 0);
      
      // Get all moods for the day and find the most common one
      const dayMoods = dayTransactions
        .map(tx => tx.mood_at_purchase)
        .filter(mood => mood && mood.trim() !== '')
        .map(mood => mood!.split(':')[0].trim()); // Extract just the mood name (before colon)
      
      const mostCommonMood = getMostCommonMood(dayMoods);
      const moodScore = mostCommonMood ? moodToScore[mostCommonMood as keyof typeof moodToScore] || 5 : null;
      
      data.push({
        date: dateString,
        formattedDate: format(date, 'MMM d'),
        spending: totalSpending,
        mood: mostCommonMood,
        moodScore: moodScore,
        normalizedMoodScore: null // Will be calculated after we have all data
      });
    }
    
    // Normalize mood scores to align with spending scale
    const maxSpending = Math.max(...data.map(d => d.spending));
    const normalizedData = data.map(d => ({
      ...d,
      // Scale mood (1-10) to spending range (0-maxSpending), but make it proportional
      normalizedMoodScore: d.moodScore ? (d.moodScore / 10) * (maxSpending || 100) : null
    }));
    
    return normalizedData;
  }, [transactions]);

  const hasData = chartData.some(d => d.spending > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {data.spending > 0 && (
            <p className="text-purple-600">
              Spending: <span className="font-medium">${data.spending.toFixed(2)}</span>
            </p>
          )}
          {data.mood && (
            <p className="text-blue-600">
              Mood: <span className="font-medium">{data.mood}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const chartHeight = isExpanded ? '500px' : '450px';

  return (
    <>
      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={toggleExpanded}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-6xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Spending & Mood Over Time</h2>
                  <p className="text-sm text-gray-500 mt-1">Detailed view of your spending patterns and mood correlation</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-sm text-gray-500">
                    <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
                    Spending
                  </span>
                  <span className="flex items-center text-sm text-gray-500">
                    <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                    Mood
                  </span>
                  <button
                    onClick={toggleExpanded}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Close expanded view"
                  >
                    <FaCompress size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="relative">
                {!hasData && (
                  <div className="absolute inset-0 bg-white/60 z-10 flex flex-col items-center justify-center text-center px-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="max-w-sm"
                    >
                      <p className="text-gray-600 mb-2">
                        Start uploading receipts to track your spending and see AI insights.
                      </p>
                      <p className="text-sm text-gray-500">
                        Upload receipts in the transactions section below.
                      </p>
                    </motion.div>
                  </div>
                )}

                <div className="h-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="formattedDate"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 14 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fontSize: 14 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        label={{
                          value: 'Amount ($)',
                          angle: -90,
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="spending"
                        stroke="#A855F7"
                        strokeWidth={4}
                        dot={{ stroke: '#A855F7', strokeWidth: 3, fill: '#FFFFFF', r: 6 }}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="spending"
                        stroke="transparent"
                        strokeWidth={0}
                        dot={{ stroke: '#3B82F6', strokeWidth: 2, fill: '#3B82F6', r: 3 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regular Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-sm text-gray-500">
              <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
              Spending
            </span>
            <span className="flex items-center text-sm text-gray-500">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
              Mood
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Expand chart"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            <FaExpand size={14} className="text-gray-400" />
          </motion.button>
        </div>

        <div className="relative">
          {!hasData && (
            <div className="absolute inset-0 bg-white/60 z-10 flex flex-col items-center justify-center text-center px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-sm"
              >
                <p className="text-gray-600 mb-2">
                  Start uploading receipts to track your spending and see AI insights.
                </p>
                <p className="text-sm text-gray-500">
                  Upload receipts in the transactions section below.
                </p>
              </motion.div>
            </div>
          )}

          <div className={`h-[${chartHeight}]`} style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  label={{
                    value: 'Amount ($)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="#A855F7"
                  strokeWidth={3}
                  dot={{ stroke: '#A855F7', strokeWidth: 2, fill: '#FFFFFF', r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="transparent"
                  strokeWidth={0}
                  dot={{ stroke: '#3B82F6', strokeWidth: 2, fill: '#3B82F6', r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </>
  );
} 