// ═══════════════════════════════════════════════
// src/api/authApi.js
//
// ALL auth-related API calls live here.
// Components and context NEVER call axios directly —
// they always go through these functions.
// ═══════════════════════════════════════════════

import axiosInstance from './axiosInstance';

// Register a new user
export const registerApi = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

// Login with email + password
export const loginApi = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

// Get current logged in user's profile
export const getMeApi = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};