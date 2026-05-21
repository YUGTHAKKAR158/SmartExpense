// ═══════════════════════════════════════════════
// src/components/dashboard/CategoryPieChart.jsx
// Recharts pie chart showing spending by category
// ═══════════════════════════════════════════════

import {
  PieChart, Pie, Cell, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

// Custom tooltip that shows when hovering a slice
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
        <p className="font-semibold text-gray-800 text-sm">
          {CATEGORY_ICONS[item.category]} {item.category}
        </p>
        <p className="text-primary-600 font-bold text-sm mt-1">
          {formatCurrency(item.totalAmount)}
        </p>
        <p className="text-gray-400 text-xs">{item.count} transactions</p>
      </div>
    );
  }
  return null;
};

// Custom legend item
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CategoryPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">🥧</p>
          <p className="text-gray-400 text-sm">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          // outerRadius controls pie size
          outerRadius={100}
          // innerRadius makes it a donut chart — easier to read
          innerRadius={55}
          dataKey="totalAmount"
          nameKey="category"
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell
              key={entry.category}
              fill={CATEGORY_COLORS[entry.category] || '#6b7280'}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryPieChart;