// ═══════════════════════════════════════════════
// src/components/expenses/ExpenseModal.jsx
//
// Modal form for BOTH creating and editing expenses.
// When 'expense' prop is passed → edit mode (pre-filled)
// When no 'expense' prop → create mode (empty form)
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { formatDateForInput, getTodayForInput } from '../../utils/formatters';

const EMPTY_FORM = {
  amount: '',
  category: 'Food & Dining',
  description: '',
  date: getTodayForInput(),
  paymentMethod: 'UPI',
  merchant: '',
  notes: '',
};

const ExpenseModal = ({
  isOpen,       // boolean — show/hide modal
  onClose,      // function — called when modal should close
  onSubmit,     // function — called with form data on submit
  expense,      // object — if provided, we're in edit mode
  loading,      // boolean — show spinner on submit button
}) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const isEditMode = !!expense;

  // When editing — pre-fill the form with existing data
  // When creating — reset to empty
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          amount: expense.amount?.toString() || '',
          category: expense.category || 'Food & Dining',
          description: expense.description || '',
          date: formatDateForInput(expense.date) || getTodayForInput(),
          paymentMethod: expense.paymentMethod || 'UPI',
          merchant: expense.merchant || '',
          notes: expense.notes || '',
        });
      } else {
        setFormData(EMPTY_FORM);
      }
      setErrors({});
      setApiError('');
    }
  }, [isOpen, isEditMode, expense]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ─────────────────────────────────────────
  // CLIENT SIDE VALIDATION
  // ─────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.amount || isNaN(formData.amount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      onClose();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to save expense. Please try again.';
      setApiError(message);
    }
  };

  return (
    <>
      {/* BACKDROP — clicking closes modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
        onClick={(e) => {
          // Only close if clicking the backdrop itself
          // not the modal content
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* MODAL PANEL */}
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? '✏️ Edit Expense' : '➕ Add Expense'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-6 space-y-5">

              {apiError && (
                <Alert
                  message={apiError}
                  type="error"
                  onDismiss={() => setApiError('')}
                />
              )}

              {/* Amount + Category row */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Amount (₹)"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  error={errors.amount}
                  placeholder="0.00"
                  required
                />

                {/* Category select */}
                <div>
                  <label className="label">
                    Category <span className="text-danger-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <Input
                label="Description"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                placeholder="What did you spend on?"
                required
              />

              {/* Date + Payment Method row */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  error={errors.date}
                  required
                />

                {/* Payment method select */}
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="input"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Merchant */}
              <Input
                label="Merchant (optional)"
                name="merchant"
                type="text"
                value={formData.merchant}
                onChange={handleChange}
                placeholder="e.g. Swiggy, Amazon, Uber"
              />

              {/* Notes */}
              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any extra details..."
                  rows={2}
                  className="input resize-none"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {isEditMode ? 'Save Changes' : 'Add Expense'}
              </Button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
};

export default ExpenseModal;