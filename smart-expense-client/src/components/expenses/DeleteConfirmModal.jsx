// ═══════════════════════════════════════════════
// src/components/expenses/DeleteConfirmModal.jsx
// Simple confirmation dialog before deleting
// ═══════════════════════════════════════════════

import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  expense,
  loading,
}) => {
  if (!isOpen || !expense) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

        {/* Icon */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🗑️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
          <p className="text-gray-500 text-sm mt-2">
            Are you sure you want to delete this expense? This cannot be undone.
          </p>
        </div>

        {/* Expense summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6 text-sm">
          <p className="font-medium text-gray-800">{expense.description}</p>
          <p className="text-gray-500 mt-1">
            {formatCurrency(expense.amount)} · {expense.category}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            loading={loading}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>

      </div>
    </div>
  );
};

export default DeleteConfirmModal;