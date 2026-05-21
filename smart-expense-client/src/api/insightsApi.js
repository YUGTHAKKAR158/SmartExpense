import axiosInstance from './axiosInstance';

export const getInsightsApi = async (month, year) => {
  const response = await axiosInstance.get('/insights', {
    params: { month, year },
  });
  return response.data;
};