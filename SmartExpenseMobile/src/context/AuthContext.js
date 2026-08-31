// ═══════════════════════════════════════════════
// src/context/AuthContext.js
// Same concept as web — global auth state
// Difference: uses AsyncStorage instead of localStorage
// ═══════════════════════════════════════════════

import React, {
  createContext, useContext,
  useState, useEffect, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, registerApi, getMeApi, updateProfileApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────
  // CHECK IF ALREADY LOGGED IN
  // Runs when app opens
  // ─────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          // Verify token still valid
          const response = await getMeApi();
          setUser(response.data.user);
          setToken(storedToken);
        }
      } catch (error) {
        // Token invalid or expired
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const response = await loginApi({ email, password });
    const { user: loggedInUser, token: newToken } = response.data;

    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
    setToken(newToken);

    return response;
  }, []);

  // ─────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const response = await registerApi({ name, email, password });
    const { user: newUser, token: newToken } = response.data;

    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));

    setUser(newUser);
    setToken(newToken);

    return response;
  }, []);

  // ─────────────────────────────────────────
  // UPDATE PROFILE
  // ─────────────────────────────────────────
  const updateUser = useCallback(async (fields) => {
    const response = await updateProfileApi(fields);
    const updated = response.data.user;
    setUser(updated);
    await AsyncStorage.setItem('user', JSON.stringify(updated));
    return updated;
  }, []);

  // ─────────────────────────────────────────
  // CURRENCY FORMATTER
  // ─────────────────────────────────────────
  const CURRENCY_LOCALE = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };
  const fmt = useCallback((amount) => {
    const currency = user?.currency || 'INR';
    const locale = CURRENCY_LOCALE[currency] || 'en-IN';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount ?? 0);
  }, [user?.currency]);

  // ─────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    fmt,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;