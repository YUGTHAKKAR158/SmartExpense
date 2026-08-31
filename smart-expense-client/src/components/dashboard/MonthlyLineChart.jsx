// ═══════════════════════════════════════════════
// 3D-style Line Chart using Chart.js
// Area fill with gradient + glowing line
// ═══════════════════════════════════════════════

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend
);

// Plugin: glowing line effect
const glowPlugin = {
  id: 'lineGlow',
  beforeDatasetsDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor  = 'rgba(37,99,235,0.6)';
    ctx.shadowBlur   = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  },
  afterDatasetsDraw(chart) {
    chart.ctx.restore();
  },
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

  // Gradient area fill — built inside plugin
  const gradientPlugin = {
    id: 'areaGradient',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const gradient = ctx.createLinearGradient(
        0, chartArea.top, 0, chartArea.bottom
      );
      gradient.addColorStop(0,   'rgba(37,99,235,0.35)');
      gradient.addColorStop(0.5, 'rgba(37,99,235,0.12)');
      gradient.addColorStop(1,   'rgba(37,99,235,0.01)');

      chart.data.datasets[0].backgroundColor = gradient;
    },
  };

  const chartData = {
    labels: data.map((d) => d.shortLabel),
    datasets: [
      {
        label:           'Spending',
        data:            data.map((d) => d.amount),
        fill:            true,
        backgroundColor: 'rgba(37,99,235,0.2)', // overridden by plugin
        borderColor:     '#2563eb',
        borderWidth:     2.5,
        tension:         0.45, // smooth curves
        pointRadius:     data.map((_, i) =>
          i === data.length - 1 ? 8 : 5
        ),
        pointBackgroundColor: data.map((_, i) =>
          i === data.length - 1 ? '#2563eb' : '#60a5fa'
        ),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2.5,
        pointHoverRadius: 10,
        pointHoverBackgroundColor: '#1d4ed8',
        pointHoverBorderColor:     '#ffffff',
        pointHoverBorderWidth:     3,
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
          title: (ctx) => data[ctx[0].dataIndex]?.label || ctx[0].label,
          label: (ctx) => ` ${formatCurrency(ctx.raw)}`,
          afterLabel: (ctx) => {
            const count = data[ctx.dataIndex]?.count;
            return count ? ` ${count} transactions` : '';
          },
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
        grid:   { display: false },
        border: { display: false },
        ticks:  { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        grid: {
          color:     'rgba(226,232,240,0.6)',
          lineWidth: 1,
        },
        border: { display: false },
        ticks: {
          color: '#9ca3af',
          font:  { size: 10 },
          callback: (v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v,
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode:      'index',
      intersect: false,
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
    },
    animations: {
      x: {
        type: 'number',
        easing: 'easeInOutQuart',
        duration: 1500,
        from: NaN, // means "start from first point"
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.xStarted) return 0;
          ctx.xStarted = true;
          return ctx.index * 80; // stagger each point left to right
        },
      },
      y: {
        type: 'number',
        easing: 'easeInOutQuart',
        duration: 1500,
        from: (ctx) => {
          if (ctx.index === 0) return ctx.chart.scales.y.getPixelForValue(100);
          return ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
        },
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.yStarted) return 0;
          ctx.yStarted = true;
          return ctx.index * 80;
        },
      },
    },
  };

  return (
    <div style={{ height: 250 }}>
      <Line
        data={chartData}
        options={options}
        plugins={[gradientPlugin, glowPlugin]}
      />
    </div>
  );
};

export default MonthlyLineChart;