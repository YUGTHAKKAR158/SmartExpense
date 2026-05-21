// ═══════════════════════════════════════════════
// src/components/budget/BudgetProgressBar.jsx
//
// Visual progress bar showing budget usage.
// Color changes based on percentage:
// Green (safe) → Yellow (warning) → Red (danger/exceeded)
// ═══════════════════════════════════════════════

import { formatCurrency } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';

const BudgetProgressBar = ({ data, type = 'category' }) => {
  // Map status to colors
  const statusConfig = {
    safe: {
      bar: 'bg-green-500',
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'On track',
    },
    warning: {
      bar: 'bg-yellow-500',
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Getting close',
    },
    danger: {
      bar: 'bg-red-500',
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Almost at limit',
    },
    exceeded: {
      bar: 'bg-red-600',
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-300',
      label: 'Over budget!',
    },
    no_limit: {
      bar: 'bg-gray-300',
      text: 'text-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      label: 'No limit set',
    },
  };

  const config = statusConfig[data.status] || statusConfig.safe;
  const icon = type === 'category'
    ? (CATEGORY_ICONS[data.category] || '📦')
    : '💰';

  const label = type === 'category' ? data.category : 'Monthly Budget';

  return (
    <div className={`
      p-4 rounded-xl border ${config.border} ${config.bg}
      transition-all duration-200
    `}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-gray-800 text-sm">{label}</span>
        </div>

        {/* Status badge */}
        <span className={`text-xs font-semibold ${config.text}`}>
          {data.isOverBudget ? '⚠️ ' : ''}{config.label}
        </span>
      </div>

      {/* Progress bar track */}
      <div className="w-full bg-white rounded-full h-2.5 mb-3 overflow-hidden border border-gray-200">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${config.bar}`}
          style={{ width: `${data.percentage}%` }}
        />
      </div>

      {/* Spending info row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          Spent:{' '}
          <span className={`font-semibold ${config.text}`}>
            {formatCurrency(data.spent)}
          </span>
        </span>

        {data.limit ? (
          <span className="text-gray-500">
            {data.remaining >= 0
              ? <>Left: <span className="font-semibold text-gray-700">{formatCurrency(data.remaining)}</span></>
              : <>Over by: <span className="font-semibold text-red-600">{formatCurrency(Math.abs(data.remaining))}</span></>
            }
          </span>
        ) : (
          <span className="text-gray-400">No limit set</span>
        )}

        {data.limit && (
          <span className="text-gray-500">
            <span className={`font-bold ${config.text}`}>{data.percentage}%</span>
            {' '}of {formatCurrency(data.limit)}
          </span>
        )}
      </div>
    </div>
  );
};

export default BudgetProgressBar;