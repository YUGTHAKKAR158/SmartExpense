// ═══════════════════════════════════════════════
// src/components/expenses/ExpenseCard.jsx
// Single expense row in the list
// ═══════════════════════════════════════════════

import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const categoryColor = CATEGORY_COLORS[expense.category] || '#6b7280';
  const categoryIcon = CATEGORY_ICONS[expense.category] || '📦';

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">

      {/* Category icon circle */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
        style={{ backgroundColor: `${categoryColor}20` }}
      >
        {categoryIcon}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {expense.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {/* Category badge */}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            {expense.category}
          </span>

          {/* Payment method */}
          <span className="text-xs text-gray-400">
            {expense.paymentMethod}
          </span>

          {/* Merchant if exists */}
          {expense.merchant && (
            <span className="text-xs text-gray-400">
              · {expense.merchant}
            </span>
          )}
        </div>
      </div>

      {/* Right side — amount + date + actions */}
      <div className="flex items-center gap-4 flex-shrink-0">

        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(expense.amount)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(expense.date)}
          </p>
        </div>

        {/* Action buttons — appear on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(expense)}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit expense"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(expense)}
            className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            title="Delete expense"
          >
            🗑️
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExpenseCard;