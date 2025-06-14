import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

// Dummy budget data for demonstration
const DUMMY_BUDGET_DATA = [
  { name: 'Food & Dining', value: 850, color: '#10b981' },
  { name: 'Shopping', value: 650, color: '#60a5fa' },
  { name: 'Bills & Utilities', value: 550, color: '#f59e0b' },
  { name: 'Entertainment', value: 300, color: '#8b5cf6' },
  { name: 'Transportation', value: 275, color: '#ec4899' },
  { name: 'Other', value: 125, color: '#6b7280' },
];

// Custom tooltip component for the pie chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-md shadow-md border border-gray-200">
        <p className="text-sm font-medium text-gray-800">{`${payload[0].name}`}</p>
        <p className="text-sm font-medium text-gray-600">{`$${payload[0].value}`}</p>
        <p className="text-xs text-gray-500">{`${((payload[0].value / DUMMY_BUDGET_DATA.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

// Custom legend component for more compact display
const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center">
          <div 
            className="w-2.5 h-2.5 rounded-full mr-1" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700 truncate">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface BudgetPieChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title?: string;
  subtitle?: string;
}

export default function BudgetPieChart({
  data = DUMMY_BUDGET_DATA,
  title = "Your Budget Breakdown",
  subtitle = "Monthly spending by category"
}: BudgetPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl border border-gray-200 p-4"
    >
      <div className="mb-2 flex justify-between items-baseline">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-semibold text-gray-800">${total.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="flex flex-row">
        <div className="w-1/2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                // Remove the labels on the chart itself
                label={false}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={renderLegend}
                layout="horizontal" 
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-1/2 pl-2">
          <div className="space-y-1.5 mt-3 max-h-[180px] overflow-y-auto pr-1">
            {data.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-1.5" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600 truncate max-w-[90px]">{item.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-gray-800">${item.value}</span>
                  <span className="text-[10px] text-gray-500">
                    {((item.value / total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 