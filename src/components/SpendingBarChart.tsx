import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

// Generate 7 days of sample data
const generateSampleData = () => {
  return Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    // Generate random spending between $30-100
    const spending = Math.floor(Math.random() * 70) + 30;
    // Generate random mood score between 5-10
    const mood = (Math.floor(Math.random() * 50) + 50) / 10;
    
    return {
      date: format(date, 'MMM d'),
      spending,
      mood
    };
  });
};

// Custom tooltip component
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

interface SpendingBarChartProps {
  data?: Array<{
    date: string;
    spending: number;
    mood: number;
  }>;
  title?: string;
  subtitle?: string;
}

export default function SpendingBarChart({
  data = generateSampleData(),
  title = "Spending vs. Mood",
  subtitle = "Daily spending and mood over time"
}: SpendingBarChartProps) {
  const totalSpending = data.reduce((sum, item) => sum + item.spending, 0);
  const averageMood = data.reduce((sum, item) => sum + item.mood, 0) / data.length;
  
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
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Total Spending</p>
          <p className="text-base font-semibold text-gray-800">${totalSpending}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 flex flex-col justify-center">
          <p className="text-xs text-gray-500">Average Mood</p>
          <p className="text-base font-semibold text-gray-800">{averageMood.toFixed(1)}/10</p>
        </div>
      </div>
      
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              tickFormatter={(value) => `$${value}`}
              width={30}
              yAxisId="left"
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              orientation="right"
              domain={[0, 10]}
              width={20}
              yAxisId="right"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
            />
            <Bar 
              dataKey="spending" 
              fill="#10b981" 
              yAxisId="left"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
              name="Spending ($)"
            />
            <Bar 
              dataKey="mood" 
              fill="#3b82f6" 
              yAxisId="right" 
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
              name="Mood Score"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
} 