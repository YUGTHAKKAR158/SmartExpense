// ═══════════════════════════════════════════════
// src/api/analyticsApi.js
// ═══════════════════════════════════════════════

import axiosInstance from './axiosInstance';

export const getDashboardApi = async (month, year) => {
  const response = await axiosInstance.get('/analytics/dashboard', {
    params: { month, year },
  });
  return response.data;
};