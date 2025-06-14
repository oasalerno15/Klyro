import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

// Generate 7 days of sample data (reduced from 14 for a cleaner view)
const generateSampleData = () => {
  return Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    // Generate slightly correlated mood and spending data
    const baseMood = Math.sin(i * 0.5) * 0.4 + 0.7; // between 0.3 and 1.1
    const mood = Math.min(10, Math.max(4, Math.round(baseMood * 10)));
    
    // Spending loosely correlates with mood (sometimes inverse, sometimes direct)
    const spendingBase = i % 3 === 0 
      ? 100 - (baseMood * 40) // inverse correlation for some days
      : 30 + (baseMood * 50);  // direct correlation for others
    
    // Add some randomness but keep general pattern
    const spending = Math.round(spendingBase + (Math.random() * 20 - 10));
    
    return {
      date: format(date, 'MMM d'),
      mood: mood,
      spending
    };
  });
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-md shadow-md border border-gray-200 text-xs">
        <p className="font-semibold text-gray-900">{label}</p>
        <div className="mt-1 space-y-1">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <p className="text-gray-700">
              Spending: <span className="font-medium">${payload[0].value}</span>
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <p className="text-gray-700">
              Mood: <span className="font-medium">{payload[1].value}/10</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface TrendLineChartProps {
  data?: Array<{
    date: string;
    mood: number;
    spending: number;
  }>;
  title?: string;
  subtitle?: string;
}

export default function TrendLineChart({
  data = generateSampleData(),
  title = "Mood & Spending Trends",
  subtitle = "7-day view of your mood and spending patterns"
}: TrendLineChartProps) {
  // Calculate some insights
  const totalSpending = data.reduce((sum, item) => sum + item.spending, 0);
  const averageMood = data.reduce((sum, item) => sum + item.mood, 0) / data.length;
  
  // Find correlation (simplified)
  const moodSpendingCorrelation = data.reduce((sum, item, index, arr) => {
    if (index === 0) return 0;
    const moodChange = item.mood - arr[index - 1].mood;
    const spendingChange = item.spending - arr[index - 1].spending;
    return sum + (Math.sign(moodChange) === Math.sign(spendingChange) ? 1 : -1);
  }, 0);
  
  // Generate correlation message
  let correlationMessage = "No clear pattern detected.";
  if (moodSpendingCorrelation > 2) {
    correlationMessage = "Your mood and spending tend to rise and fall together.";
  } else if (moodSpendingCorrelation < -2) {
    correlationMessage = "You tend to spend more when your mood is lower.";
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl border border-gray-200 p-4"
    >
      <div className="mb-3 flex justify-between items-baseline">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Total Spending</p>
          <p className="text-base font-semibold text-gray-800">${totalSpending}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Average Mood</p>
          <p className="text-base font-semibold text-gray-800">{averageMood.toFixed(1)}/10</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Key Pattern</p>
          <p className="text-xs font-medium text-gray-800">{correlationMessage}</p>
        </div>
      </div>
      
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              yAxisId="left"
              tickFormatter={(value) => `$${value}`}
              width={30}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              orientation="right"
              domain={[0, 10]}
              yAxisId="right"
              width={20}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
            />
            <Line 
              type="monotone" 
              dataKey="spending" 
              stroke="#10b981" 
              strokeWidth={2}
              yAxisId="left"
              dot={{ stroke: '#10b981', strokeWidth: 2, fill: 'white', r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0, fill: '#047857' }}
              name="Spending ($)"
            />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="#3b82f6" 
              strokeWidth={2}
              yAxisId="right"
              dot={{ stroke: '#3b82f6', strokeWidth: 2, fill: 'white', r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0, fill: '#1d4ed8' }}
              name="Mood Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
} 