// ═══════════════════════════════════════════════
// src/components/expenses/ExpenseFilters.jsx
// Search + filter controls above the expense list
// ═══════════════════════════════════════════════

import { CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';

const ExpenseFilters = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-4">

        {/* Search */}
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="🔍 Search expenses..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="input"
          />
        </div>

        {/* Category filter */}
        <div className="min-w-40">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="input"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Payment method filter */}
        <div className="min-w-40">
          <select
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange({ paymentMethod: e.target.value })}
            className="input"
          >
            <option value="All">All Methods</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
            className="input w-auto"
            title="From date"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
            className="input w-auto"
            title="To date"
          />
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="btn-secondary text-sm whitespace-nowrap"
        >
          ↺ Reset
        </button>

      </div>
    </div>
  );
};

export default ExpenseFilters;