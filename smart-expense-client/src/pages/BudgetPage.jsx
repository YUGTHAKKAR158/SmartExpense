// ═══════════════════════════════════════════════
// src/pages/BudgetPage.jsx
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { getBudgetApi, updateBudgetApi } from '../api/budgetApi';
import BudgetProgressBar from '../components/budget/BudgetProgressBar';
import BudgetEditModal from '../components/budget/BudgetEditModal';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const BudgetPage = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ─────────────────────────────────────────
  // FETCH BUDGET DATA
  // ─────────────────────────────────────────
  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getBudgetApi(selectedMonth, selectedYear);
      setBudgetData(response.data);
    } catch (err) {
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  // ─────────────────────────────────────────
  // SAVE BUDGET
  // ─────────────────────────────────────────
  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await updateBudgetApi({
        ...formData,
        month: selectedMonth,
        year: selectedYear,
      });
      await fetchBudget();
      setSuccessMsg('Budget saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  // Generate year options (current year ± 1)
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2>🎯 Budget Management</h2>
          <p className="text-gray-500 mt-1">
            Set limits and track your spending
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          ✏️ Edit Budgets
        </Button>
      </div>

      {/* Month / Year selector */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Viewing:</span>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input w-auto"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-auto"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {selectedMonth === currentMonth && selectedYear === currentYear && (
            <span className="badge bg-primary-100 text-primary-700">
              Current Month
            </span>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-6">
          <Alert message={successMsg} type="success" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6">
          <Alert message={error} type="error" />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading budget data...</p>
        </div>
      )}

      {!loading && budgetData && (
        <>
          {/* Overall budget card */}
          <div className="card mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              💰 Overall Monthly Budget
            </h3>

            {budgetData.overall.limit > 0 ? (
              <>
                <BudgetProgressBar
                  data={budgetData.overall}
                  type="overall"
                />

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    {
                      label: 'Budget',
                      value: formatCurrency(budgetData.overall.limit),
                      color: 'text-gray-700',
                    },
                    {
                      label: 'Spent',
                      value: formatCurrency(budgetData.overall.spent),
                      color: budgetData.overall.isOverBudget
                        ? 'text-red-600'
                        : 'text-gray-700',
                    },
                    {
                      label: budgetData.overall.remaining >= 0 ? 'Remaining' : 'Over by',
                      value: formatCurrency(Math.abs(budgetData.overall.remaining)),
                      color: budgetData.overall.remaining >= 0
                        ? 'text-green-600'
                        : 'text-red-600',
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                      <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-gray-500 text-sm mb-4">
                  No overall budget set for this month
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Set Monthly Budget
                </Button>
              </div>
            )}
          </div>

          {/* Category budgets */}
          <div className="card mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              📂 Category Budgets
            </h3>

            {budgetData.categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetData.categories.map((cat) => (
                  <BudgetProgressBar
                    key={cat.category}
                    data={cat}
                    type="category"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📂</p>
                <p className="text-gray-500 text-sm mb-4">
                  No category budgets set yet
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Set Category Budgets
                </Button>
              </div>
            )}
          </div>

          {/* Untracked spending */}
          {budgetData.untrackedCategories.length > 0 && (
            <div className="card">
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                📊 Untracked Spending
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                You spent in these categories but haven't set budget limits
              </p>
              <div className="space-y-2">
                {budgetData.untrackedCategories.map(({ category, spent }) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(spent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      <BudgetEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        currentBudget={budgetData}
        loading={saving}
      />
    </div>
  );
};

export default BudgetPage;