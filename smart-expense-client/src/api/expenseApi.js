// ═══════════════════════════════════════════════
// src/api/expenseApi.js
// ALL expense-related API calls live here
// ═══════════════════════════════════════════════

import axiosInstance from './axiosInstance';

// Get all expenses with optional filters
// params = { category, paymentMethod, startDate, endDate, search, page, limit }
export const getExpensesApi = async (params = {}) => {
  const response = await axiosInstance.get('/expenses', { params });
  return response.data;
};

// Get single expense by ID
export const getExpenseByIdApi = async (id) => {
  const response = await axiosInstance.get(`/expenses/${id}`);
  return response.data;
};

// Create new expense
export const createExpenseApi = async (expenseData) => {
  const response = await axiosInstance.post('/expenses', expenseData);
  return response.data;
};

// Update existing expense
export const updateExpenseApi = async (id, expenseData) => {
  const response = await axiosInstance.put(`/expenses/${id}`, expenseData);
  return response.data;
};

// Delete expense
export const deleteExpenseApi = async (id) => {
  const response = await axiosInstance.delete(`/expenses/${id}`);
  return response.data;
};

// Get expense summary (totals by category)
export const getExpenseSummaryApi = async (month, year) => {
  const response = await axiosInstance.get('/expenses/summary', {
    params: { month, year },
  });
  return response.data;
};

// Get dashboard summary data
export const getDashboardDataApi = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Run both calls in parallel
  const [expenseSummary, expenseList] = await Promise.all([
    axiosInstance.get('/expenses/summary', { params: { month, year } }),
    axiosInstance.get('/expenses', { params: { page: 1, limit: 5, sortBy: 'date', sortOrder: 'desc' } }),
  ]);

  return {
    summary: expenseSummary.data.data,
    recent: expenseList.data.data,
  };
};