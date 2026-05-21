import axiosInstance from './axiosInstance';

// Get budget + spending for a month
export const getBudgetApi = async (month, year) => {
  const response = await axiosInstance.get('/budgets', {
    params: { month, year },
  });
  return response.data;
};

// Update monthly limit + category budgets
export const updateBudgetApi = async (budgetData) => {
  const response = await axiosInstance.put('/budgets', budgetData);
  return response.data;
};