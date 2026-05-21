// ═══════════════════════════════════════════════
// src/hooks/useExpenses.js
//
// Manages all expense data fetching and mutations.
// Components just call this hook and get back
// the data + action functions — no API logic needed.
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  getExpensesApi,
  createExpenseApi,
  updateExpenseApi,
  deleteExpenseApi,
} from '../api/expenseApi';

// Default filters — what the page starts with
const DEFAULT_FILTERS = {
  search: '',
  category: 'All',
  paymentMethod: 'All',
  startDate: '',
  endDate: '',
  sortBy: 'date',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─────────────────────────────────────────
  // FETCH EXPENSES
  // Rebuilds query from current filters and fetches
  // ─────────────────────────────────────────
  const fetchExpenses = useCallback(async (currentFilters) => {
    setLoading(true);
    setError('');

    try {
      // Build clean params — remove empty/All values
      // so we don't send ?category=All to the backend
      const params = {};

      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.category !== 'All') params.category = currentFilters.category;
      if (currentFilters.paymentMethod !== 'All') params.paymentMethod = currentFilters.paymentMethod;
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;

      params.sortBy = currentFilters.sortBy;
      params.sortOrder = currentFilters.sortOrder;
      params.page = currentFilters.page;
      params.limit = currentFilters.limit;

      const response = await getExpensesApi(params);

      setExpenses(response.data.expenses);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch whenever filters change
  useEffect(() => {
    fetchExpenses(filters);
  }, [filters, fetchExpenses]);

  // ─────────────────────────────────────────
  // UPDATE FILTERS
  // Merges new filter values with existing ones
  // Resets to page 1 whenever filters change
  // ─────────────────────────────────────────
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filter changes
      // (except when explicitly changing page)
      page: newFilters.page ?? 1,
    }));
  }, []);

  // Reset all filters to default
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // ─────────────────────────────────────────
  // CRUD OPERATIONS
  // Each one calls the API then refetches the list
  // ─────────────────────────────────────────

  const createExpense = useCallback(async (expenseData) => {
    const response = await createExpenseApi(expenseData);
    // Refetch current page to show the new expense
    fetchExpenses(filters);
    return response;
  }, [filters, fetchExpenses]);

  const updateExpense = useCallback(async (id, expenseData) => {
    const response = await updateExpenseApi(id, expenseData);
    fetchExpenses(filters);
    return response;
  }, [filters, fetchExpenses]);

  const deleteExpense = useCallback(async (id) => {
    const response = await deleteExpenseApi(id);
    fetchExpenses(filters);
    return response;
  }, [filters, fetchExpenses]);

  return {
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
    refetch: () => fetchExpenses(filters),
  };
};

export default useExpenses;