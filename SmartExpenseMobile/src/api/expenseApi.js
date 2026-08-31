import axiosInstance from './axiosInstance';

export const getExpensesApi = async (params = {}) =>
  (await axiosInstance.get('/expenses', { params })).data;

export const createExpenseApi = async (data) =>
  (await axiosInstance.post('/expenses', data)).data;

export const updateExpenseApi = async (id, data) =>
  (await axiosInstance.put(`/expenses/${id}`, data)).data;

export const deleteExpenseApi = async (id) =>
  (await axiosInstance.delete(`/expenses/${id}`)).data;

export const getExpenseSummaryApi = async (month, year) =>
  (await axiosInstance.get('/expenses/summary', { params: { month, year } })).data;