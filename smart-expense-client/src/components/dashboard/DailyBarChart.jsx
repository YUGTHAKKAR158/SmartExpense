// ═══════════════════════════════════════════════
// 3D-style Bar Chart using Chart.js
// Gradient fill + shadow gives depth effect
// ═══════════════════════════════════════════════

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Plugin: draws a shadow beneath each bar for 3D depth
const barShadowPlugin = {
  id: 'barShadow',
  beforeDatasetsDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor   = 'rgba(37,99,235,0.25)';
    ctx.shadowBlur    = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;
  },
  afterDatasetsDraw(chart) {
    chart.ctx.restore();
  },
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

  const maxAmount = Math.max(...data.map((d) => d.amount));

  // Gradient fill — created inside a plugin so canvas is available
  const gradientPlugin = {
    id: 'gradientFill',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;

      const dataset    = chart.data.datasets[0];
      const gradient   = ctx.createLinearGradient(
        0, chartArea.top, 0, chartArea.bottom
      );
      gradient.addColorStop(0,   'rgba(37,99,235,0.95)');  // top — deep blue
      gradient.addColorStop(0.5, 'rgba(59,130,246,0.80)'); // mid
      gradient.addColorStop(1,   'rgba(147,197,253,0.50)'); // bottom — light

      // Highlight max bar in a different gradient
      dataset.backgroundColor = data.map((d) =>
        d.amount === maxAmount && maxAmount > 0
          ? (() => {
              const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              g.addColorStop(0,   'rgba(234,88,12,0.95)');
              g.addColorStop(1,   'rgba(251,146,60,0.60)');
              return g;
            })()
          : gradient
      );
    },
  };

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Spent',
        data:  data.map((d) => d.amount),
        backgroundColor: 'rgba(37,99,235,0.85)', // overridden by plugin
        borderColor:     'transparent',
        borderWidth:     0,
        borderRadius:    { topLeft: 6, topRight: 6 },
        borderSkipped:   false,
        barPercentage:   0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (ctx) => `Day ${ctx[0].label}`,
          label: (ctx) => ` ${formatCurrency(ctx.raw)}`,
        },
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor:      '#f8fafc',
        bodyColor:       '#93c5fd',
        padding:         12,
        cornerRadius:    10,
        displayColors:   false,
        titleFont:       { size: 12, weight: 'bold' },
        bodyFont:        { size: 13, weight: 'bold' },
      },
    },
    scales: {
      x: {
        grid:  { display: false },
        border: { display: false },
        ticks: {
          color:     '#9ca3af',
          font:      { size: 10 },
          maxTicksLimit: 15,
        },
      },
      y: {
        grid: {
          color:     'rgba(226,232,240,0.6)',
          lineWidth: 1,
        },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: '#9ca3af',
          font:  { size: 10 },
          callback: (v) =>
            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v,
        },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 800,
      easing:   'easeInOutQuart',
      delay:    (ctx) => ctx.dataIndex * 20, // staggered bars
    },
  };

  return (
    <div style={{ height: 250 }}>
      <Bar
        data={chartData}
        options={options}
        plugins={[gradientPlugin, barShadowPlugin]}
      />
    </div>
  );
};

export default DailyBarChart;