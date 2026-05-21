// ═══════════════════════════════════════════════
// src/api/axiosInstance.js
//
// One configured Axios client for the entire app.
// Every API call goes through this — never raw axios.
//
// This instance automatically:
// 1. Prepends the base URL
// 2. Attaches the JWT token to every request
// 3. Handles 401 responses (token expired → logout)
// ═══════════════════════════════════════════════

import axios from 'axios';

// Read base URL from environment variable
// Vite exposes env vars prefixed with VITE_
// We'll create .env in a moment
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,

  // Default timeout — don't wait forever for a response
  timeout: 10000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// ═══════════════════════════════════════════════
// REQUEST INTERCEPTOR
// Runs before every request is sent.
// Reads the token from localStorage and attaches it.
// ═══════════════════════════════════════════════
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to the Authorization header
    // Backend's protect middleware reads this header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// Runs after every response is received.
// Handles global errors like token expiry.
// ═══════════════════════════════════════════════
axiosInstance.interceptors.response.use(
  // Success — just return the response as-is
  (response) => response,

  // Error handler
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Only auto-redirect to login if:
    // 1. Status is 401 (unauthorized)
    // 2. AND there was actually a token stored (session expired case)
    // 3. AND this was NOT a login/register request
    //
    // WHY: A failed login also returns 401, but that's
    // expected — wrong password. We must NOT redirect
    // in that case. Only redirect when a previously
    // valid session has expired.
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    const hasToken = !!localStorage.getItem('token');

    if (status === 401 && hasToken && !isAuthRoute) {
      // Session expired — clear everything and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // For everything else (including wrong password 401),
    // just reject normally so the component can handle it
    return Promise.reject(error);
  }
);

export default axiosInstance;