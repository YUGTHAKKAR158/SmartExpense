import axiosInstance from './axiosInstance';

export const getPredictionsApi = async () => {
  const response = await axiosInstance.get('/predictions');
  return response.data;
};