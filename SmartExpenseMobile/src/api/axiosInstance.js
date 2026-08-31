// ═══════════════════════════════════════════════
// src/api/axiosInstance.js
// ═══════════════════════════════════════════════

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

// AsyncStorage = React Native's version of localStorage
// Works the same way but is async (returns Promises)

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // slightly longer for mobile networks
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR — attach token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Token read error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status      = error.response?.status;
    const requestUrl  = error.config?.url || '';
    const isAuthRoute = requestUrl.includes('/auth/login') ||
                        requestUrl.includes('/auth/register');

    const token = await AsyncStorage.getItem('token');

    if (status === 401 && token && !isAuthRoute) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigation to login handled by AuthContext
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;