// ═══════════════════════════════════════════════
// src/components/reports/ReportSummaryCard.jsx
// Preview of report data before downloading
// ═══════════════════════════════════════════════

import { formatCurrency } from '../../utils/formatters';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../utils/constants';

const ReportSummaryCard = ({ reportData }) => {
  if (!reportData) return null;

  const {
    summary, categoryBreakdown,
    paymentMethodData, monthName, year, userName,
  } = reportData;

  return (
    <div className="space-y-6">

      {/* Report header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm font-medium mb-1">
              Monthly Financial Report
            </p>
            <h3 className="text-2xl font-bold">
              {monthName} {year}
            </h3>
            <p className="text-primary-200 text-sm mt-1">{userName}</p>
          </div>
          <div className="text-right">
            <p className="text-primary-200 text-xs mb-1">Total Spent</p>
            <p className="text-3xl font-bold">
              {formatCurrency(summary.totalSpent)}
            </p>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-primary-500">
          {[
            { label: 'Transactions', value: summary.totalTransactions },
            { label: 'Daily Average', value: formatCurrency(summary.avgPerDay) },
            { label: 'Per Transaction', value: formatCurrency(summary.avgPerTransaction) },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-primary-200 text-xs">{stat.label}</p>
              <p className="text-white font-bold text-lg">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget status */}
      {summary.monthlyLimit > 0 && (
        <div className={`
          p-4 rounded-xl border
          ${summary.isOverBudget
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
          }
        `}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${
              summary.isOverBudget ? 'text-red-800' : 'text-green-800'
            }`}>
              {summary.isOverBudget ? '⚠️ Over Budget' : '✅ Within Budget'}
            </span>
            <span className={`text-sm font-bold ${
              summary.isOverBudget ? 'text-red-600' : 'text-green-600'
            }`}>
              {summary.isOverBudget
                ? `Over by ${formatCurrency(Math.abs(summary.budgetLeft))}`
                : `${formatCurrency(summary.budgetLeft)} remaining`
              }
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${
                summary.isOverBudget ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(
                  Math.round((summary.totalSpent / summary.monthlyLimit) * 100),
                  100
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500">
              Spent: {formatCurrency(summary.totalSpent)}
            </span>
            <span className="text-gray-500">
              Budget: {formatCurrency(summary.monthlyLimit)}
            </span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryBreakdown && categoryBreakdown.length > 0 && (
        <div className="card">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            📂 Spending by Category
          </h4>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => {
              const pct = summary.totalSpent > 0
                ? Math.round((cat.totalAmount / summary.totalSpent) * 100)
                : 0;
              const color = CATEGORY_COLORS[cat._id] || '#6b7280';
              const icon  = CATEGORY_ICONS[cat._id]  || '📦';

              return (
                <div key={cat._id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="text-sm text-gray-700 font-medium">
                        {cat._id}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({cat.count} txn)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(Math.round(cat.totalAmount * 100) / 100)}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment method breakdown */}
      {paymentMethodData && Object.keys(paymentMethodData).length > 0 && (
        <div className="card">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            💳 Payment Methods
          </h4>
          <div className="space-y-2">
            {Object.entries(paymentMethodData)
              .sort(([, a], [, b]) => b - a)
              .map(([method, amount]) => {
                const pct = summary.totalSpent > 0
                  ? Math.round((amount / summary.totalSpent) * 100)
                  : 0;
                return (
                  <div key={method} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-28 flex-shrink-0">
                      {method}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 bg-primary-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-24 text-right flex-shrink-0">
                      {formatCurrency(Math.round(amount * 100) / 100)}
                    </span>
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportSummaryCard;