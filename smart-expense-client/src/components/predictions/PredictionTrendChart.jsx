// ═══════════════════════════════════════════════
// src/components/predictions/PredictionTrendChart.jsx
// Line chart showing actual + predicted spending
// ═══════════════════════════════════════════════

import {
  ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
        <p className="text-gray-500 text-xs mb-2 font-medium">{label}</p>
        {payload.map((entry) => (
          entry.value !== null && (
            <p
              key={entry.name}
              className="text-sm font-bold"
              style={{ color: entry.color }}
            >
              {entry.name === 'predicted' ? '🔮 Predicted: ' : '📊 Actual: '}
              {formatCurrency(entry.value)}
            </p>
          )
        ))}
      </div>
    );
  }
  return null;
};

const PredictionTrendChart = ({ data, budgetLimit }) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

        <XAxis
          dataKey="shortLabel"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
          axisLine={false}
          tickLine={false}
          width={40}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend
          formatter={(value) =>
            value === 'actual' ? 'Actual Spending' : 'Predicted Spending'
          }
        />

        {/* Budget reference line */}
        {budgetLimit > 0 && (
          <ReferenceLine
            y={budgetLimit}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: `Budget: ${formatCurrency(budgetLimit)}`,
              position: 'insideTopRight',
              fontSize: 11,
              fill: '#ef4444',
            }}
          />
        )}

        {/* Actual spending bars */}
        <Bar
          dataKey="actual"
          fill="#93c5fd"
          radius={[4, 4, 0, 0]}
          name="actual"
          barSize={20}
        />

        {/* Prediction line */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#7c3aed"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          dot={{ fill: '#7c3aed', r: 6, stroke: 'white', strokeWidth: 2 }}
          name="predicted"
          connectNulls={false}
        />

      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default PredictionTrendChart;