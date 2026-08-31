import axiosInstance from './axiosInstance';

export const getDashboardApi = async (month, year) =>
  (await axiosInstance.get('/analytics/dashboard', { params: { month, year } })).data;