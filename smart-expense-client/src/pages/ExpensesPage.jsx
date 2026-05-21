// ═══════════════════════════════════════════════
// src/pages/ExpensesPage.jsx
//
// Main expense management page.
// Wires together all expense components.
// Manages modal open/close state and
// delegates all data operations to useExpenses hook.
// ═══════════════════════════════════════════════

import { useState } from 'react';
import useExpenses from '../hooks/useExpenses';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import ExpenseCard from '../components/expenses/ExpenseCard';
import ExpenseModal from '../components/expenses/ExpenseModal';
import DeleteConfirmModal from '../components/expenses/DeleteConfirmModal';
import Pagination from '../components/common/Pagination';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import { formatCurrency } from '../utils/formatters';

const ExpensesPage = () => {
  // ─────────────────────────────────────────
  // DATA — from custom hook
  // ─────────────────────────────────────────
  const {
    expenses,
    pagination,
    filters,
    loading,
    error,
    updateFilters,
    resetFilters,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();

  // ─────────────────────────────────────────
  // MODAL STATE
  // ─────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  const handleCreate = async (formData) => {
    setModalLoading(true);
    try {
      await createExpense(formData);
      setIsAddModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setModalLoading(true);
    try {
      await updateExpense(editingExpense._id, formData);
      setEditingExpense(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    setModalLoading(true);
    try {
      await deleteExpense(deletingExpense._id);
      setDeletingExpense(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Calculate total of currently visible expenses
  const visibleTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      {/* ─────────────────────────────────────
          PAGE HEADER
          ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2>💸 Expenses</h2>
          <p className="text-gray-500 mt-1">
            Track and manage all your spending
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          size="md"
        >
          + Add Expense
        </Button>
      </div>

      {/* ─────────────────────────────────────
          FILTERS
          ───────────────────────────────────── */}
      <ExpenseFilters
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* ─────────────────────────────────────
          EXPENSE LIST CARD
          ───────────────────────────────────── */}
      <div className="card">

        {/* List header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {pagination
              ? `${pagination.totalCount} expense${pagination.totalCount !== 1 ? 's' : ''}`
              : 'Expenses'
            }
          </h3>

          {/* Visible total */}
          {expenses.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Showing total</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(visibleTotal)}
              </p>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <Alert message={error} type="error" />
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Loading expenses...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && expenses.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">💸</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No expenses found
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {filters.search || filters.category !== 'All' || filters.startDate
                ? 'Try adjusting your filters'
                : 'Add your first expense to get started'
              }
            </p>
            {!filters.search && filters.category === 'All' && (
              <Button
                variant="primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                + Add your first expense
              </Button>
            )}
          </div>
        )}

        {/* Expense list */}
        {!loading && expenses.length > 0 && (
          <div className="divide-y divide-gray-50">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense._id}
                expense={expense}
                onEdit={(exp) => setEditingExpense(exp)}
                onDelete={(exp) => setDeletingExpense(exp)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(page) => updateFilters({ page })}
        />

      </div>

      {/* ─────────────────────────────────────
          MODALS
          ───────────────────────────────────── */}

      {/* Add expense modal */}
      <ExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreate}
        loading={modalLoading}
      />

      {/* Edit expense modal */}
      <ExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleUpdate}
        expense={editingExpense}
        loading={modalLoading}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDelete}
        expense={deletingExpense}
        loading={modalLoading}
      />

    </div>
  );
};

export default ExpensesPage;