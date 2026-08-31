import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend);

// Black shadow under each arc for depth
const shadowPlugin = {
  id: 'arcShadow',
  beforeDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.35)'; // black shadow
    ctx.shadowBlur    = 16;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;
  },
  afterDraw(chart) {
    chart.ctx.restore();
  },
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

  const total = data.reduce((sum, d) => sum + d.totalAmount, 0);

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.totalAmount),
        backgroundColor: data.map(
          (d) => CATEGORY_COLORS[d.category] || '#6b7280'
        ),
        // NO white border — removed completely
        borderColor:     'transparent',
        borderWidth:     0,
        hoverOffset:     14,
        hoverBorderWidth: 0,
        hoverBorderColor: 'transparent',
        offset: data.map((_, i) => (i % 2 === 0 ? 4 : 2)),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '58%',
    rotation: -90,
    plugins: {
      // ── ORIGINAL LEGEND FORMAT (from Recharts version) ──
      legend: {
        position: 'bottom',
        labels: {
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11, family: 'Inter, sans-serif' },
          color: '#64748b',
          // Simple label: just category name with dot color
          generateLabels: (chart) =>
            chart.data.labels.map((label, i) => ({
              text: `${CATEGORY_ICONS[label] || '📦'} ${label}`,
              fillStyle: chartData.datasets[0].backgroundColor[i],
              strokeStyle: 'transparent',
              lineWidth: 0,
              hidden: false,
              index: i,
            })),
        },
      },
      tooltip: {
        enabled: true,
        position: 'average',   // makes tooltip appear closer to hovered slice
        xAlign: 'right',        // pushes tooltip away from center
        yAlign: 'center',
        callbacks: {
          label: (ctx) => {
            const item = data[ctx.dataIndex];
            const pct  = total > 0
              ? ((item.totalAmount / total) * 100).toFixed(1)
              : 0;
            return [
              ` ${formatCurrency(item.totalAmount)}`,
              ` ${pct}% of total`,
              ` ${item.count} transaction${item.count !== 1 ? 's' : ''}`,
            ];
          },
          title: (ctx) => {
            const label = ctx[0].label;
            return `${CATEGORY_ICONS[label] || '📦'}  ${label}`;
          },
        },
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor:      '#f8fafc',
        bodyColor:       '#cbd5e1',
        padding:         12,
        cornerRadius:    10,
        titleFont:       { size: 12, weight: 'bold' },
        bodyFont:        { size: 11 },
        displayColors:   false,
      },
    },
    animation: {
      animateRotate: true,
      animateScale:  true,
      duration:      900,
      easing:        'easeInOutQuart',
    },
  };

  return (
    <div className="relative">
      

      <div style={{ height: 300 }}>
        <Doughnut
          data={chartData}
          options={options}
          plugins={[shadowPlugin]}
        />
      </div>
    </div>
  );
};

export default CategoryPieChart;