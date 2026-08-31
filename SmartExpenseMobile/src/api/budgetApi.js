import axiosInstance from './axiosInstance';

export const getBudgetApi    = async (month, year) =>
  (await axiosInstance.get('/budgets', { params: { month, year } })).data;

export const updateBudgetApi = async (data) =>
  (await axiosInstance.put('/budgets', data)).data;