import axiosInstance from './axiosInstance';

export const getReportSummaryApi = async (month, year) =>
  (await axiosInstance.get('/reports/summary', { params: { month, year } })).data;