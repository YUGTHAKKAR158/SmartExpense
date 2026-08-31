import axiosInstance from './axiosInstance';

export const loginApi    = async (data) => (await axiosInstance.post('/auth/login', data)).data;
export const registerApi = async (data) => (await axiosInstance.post('/auth/register', data)).data;
export const getMeApi          = async ()     => (await axiosInstance.get('/auth/me')).data;
export const updateProfileApi  = async (data) => (await axiosInstance.patch('/auth/profile', data)).data;