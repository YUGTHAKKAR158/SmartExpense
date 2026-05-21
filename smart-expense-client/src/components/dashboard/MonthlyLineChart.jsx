// ═══════════════════════════════════════════════
// src/components/dashboard/MonthlyLineChart.jsx
// 6-month spending trend line chart
// ═══════════════════════════════════════════════

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Dot,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
        <p className="text-gray-500 text-xs mb-1">{label}</p>
        <p className="font-bold text-gray-900 text-sm">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.count > 0 && (
          <p className="text-gray-400 text-xs">
            {payload[0].payload.count} transactions
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom dot — makes the current month's dot bigger
const CustomDot = (props) => {
  const { cx, cy, index, data } = props;
  const isLast = index === data.length - 1;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isLast ? 6 : 4}
      fill={isLast ? '#2563eb' : '#93c5fd'}
      stroke="white"
      strokeWidth={2}
    />
  );
};

const MonthlyLineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-gray-400 text-sm">No trend data yet</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f0f0f0"
        />

        <XAxis
          dataKey="shortLabel"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(value) =>
            value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
          }
          axisLine={false}
          tickLine={false}
          width={40}
        />

        <Tooltip content={<CustomTooltip />} />

        <Line
          type="monotone"
          dataKey="amount"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={<CustomDot data={data} />}
          activeDot={{ r: 7, fill: '#2563eb', stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MonthlyLineChart;