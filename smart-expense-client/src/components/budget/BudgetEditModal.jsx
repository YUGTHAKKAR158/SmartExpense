// ═══════════════════════════════════════════════
// src/components/budget/BudgetEditModal.jsx
// Form to set monthly limit + category limits
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { CATEGORIES } from '../../utils/constants';
import { CATEGORY_ICONS } from '../../utils/constants';

const BudgetEditModal = ({
  isOpen,
  onClose,
  onSave,
  currentBudget,
  loading,
}) => {
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [categoryLimits, setCategoryLimits] = useState({});
  const [error, setError] = useState('');

  // Pre-fill with existing budget data when modal opens
  useEffect(() => {
    if (isOpen && currentBudget) {
      setMonthlyLimit(
        currentBudget.budget?.monthlyLimit > 0
          ? currentBudget.budget.monthlyLimit.toString()
          : ''
      );

      // Build map of category → limit from existing budgets
      const limits = {};
      currentBudget.budget?.categoryBudgets?.forEach(({ category, limit }) => {
        limits[category] = limit.toString();
      });
      setCategoryLimits(limits);
      setError('');
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const handleCategoryChange = (category, value) => {
    setCategoryLimits(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    setError('');

    // Send ALL categories — even ones with empty values
    // Backend will remove categories where limit is 0/empty
    // and keep/update ones with valid values
    const categoryBudgets = CATEGORIES.map(cat => ({
      category: cat,
      // Send 0 for empty/cleared fields — backend removes those
      limit: parseFloat(categoryLimits[cat]) || 0,
    }));

    try {
      await onSave({
        monthlyLimit: parseFloat(monthlyLimit) || 0,
        categoryBudgets,
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to save budget. Please try again.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            🎯 Set Budget Limits
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">

          {error && <Alert message={error} type="error" onDismiss={() => setError('')} />}

          {/* Monthly overall limit */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              💰 Overall Monthly Budget
            </h4>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="e.g. 30000"
                min="0"
                className="input pl-8"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Leave empty for no overall limit
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Category limits */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              📂 Category Budgets
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              Leave empty to skip tracking for that category
            </p>

            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center gap-3">
                  {/* Category name */}
                  <div className="flex items-center gap-2 w-44 flex-shrink-0">
                    <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                    <span className="text-sm text-gray-700 truncate">{category}</span>
                  </div>

                  {/* Limit input */}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={categoryLimits[category] || ''}
                      onChange={(e) => handleCategoryChange(category, e.target.value)}
                      placeholder="No limit"
                      min="0"
                      className="input pl-7 text-sm py-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSave}>
            Save Budgets
          </Button>
        </div>

      </div>
    </div>
  );
};

export default BudgetEditModal;