// ═══════════════════════════════════════════════
// src/components/dashboard/DailyBarChart.jsx
// Daily spending bar chart for current month
// ═══════════════════════════════════════════════

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
        <p className="text-gray-500 text-xs mb-1">Day {label}</p>
        <p className="font-bold text-gray-900 text-sm">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const DailyBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-400 text-sm">No data to display</p>
        </div>
      </div>
    );
  }

  // Find the highest spending day to highlight it
  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        barSize={data.length > 20 ? 8 : 14}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f0f0f0"
        />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          // Show fewer labels if many days
          interval={data.length > 20 ? 4 : 1}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          // Format Y axis as compact numbers: 1000 → 1k
          tickFormatter={(value) =>
            value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
          }
          axisLine={false}
          tickLine={false}
          width={40}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />

        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.day}
              // Highlight highest day in primary blue
              // All others in lighter blue
              fill={entry.amount === maxAmount && maxAmount > 0
                ? '#2563eb'
                : '#93c5fd'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DailyBarChart;