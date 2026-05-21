// ═══════════════════════════════════════════════
// src/context/AuthContext.jsx
//
// Global authentication state for the entire app.
// Provides: user, token, login(), logout(), loading
//
// Any component can access these with:
// const { user, login, logout } = useAuth();
// ═══════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi } from '../api/authApi';

// Step 1: Create the context object
// This is just an empty container — we fill it with
// the Provider below
const AuthContext = createContext(null);

// Step 2: Create the Provider component
// This wraps your entire app and makes auth state
// available to every child component
export const AuthProvider = ({ children }) => {

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  // user: the logged-in user object (or null)
  const [user, setUser] = useState(null);

  // token: the JWT string (or null)
  const [token, setToken] = useState(localStorage.getItem('token'));

  // loading: true while we're checking if user
  // is already logged in (page refresh case)
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────
  // PERSIST AUTH ACROSS PAGE REFRESH
  //
  // When the user refreshes the page, React state
  // is wiped. But the token is in localStorage.
  // On mount, we check if a token exists and fetch
  // the user profile to restore the session.
  // ─────────────────────────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        try {
          // Token exists — verify it's still valid
          // by fetching the current user profile
          const response = await getMeApi();
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          // Token is expired or invalid
          // Clear everything and start fresh
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }

      // Done checking — stop showing loading state
      setLoading(false);
    };

    initializeAuth();
  }, []); // Empty array = run once on mount only

  // ─────────────────────────────────────────
  // LOGIN FUNCTION
  // Called by the Login page with email + password
  // ─────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const response = await loginApi({ email, password });

    const { user: loggedInUser, token: newToken } = response.data;

    // Save to localStorage so it persists on refresh
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));

    // Update React state
    setUser(loggedInUser);
    setToken(newToken);

    return response;
  }, []);

  // ─────────────────────────────────────────
  // REGISTER FUNCTION
  // ─────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const response = await registerApi({ name, email, password });

    const { user: newUser, token: newToken } = response.data;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    setUser(newUser);
    setToken(newToken);

    return response;
  }, []);

  // ─────────────────────────────────────────
  // LOGOUT FUNCTION
  // ─────────────────────────────────────────
  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear React state
    setUser(null);
    setToken(null);
  }, []);

  // Called by OAuthCallbackPage after SSO login
  // Sets user + token in state without calling API
  const setUserFromSSO = useCallback((userData, token) => {
    setUser(userData);
    setToken(token);
  }, []);

  // ─────────────────────────────────────────
  // CONTEXT VALUE
  // Everything we expose to child components
  // ─────────────────────────────────────────
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user, // true if user exists, false if null
    setUserFromSSO,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Step 3: Custom hook for easy consumption
// Instead of: const { user } = useContext(AuthContext)
// Just write: const { user } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Safety check — if useAuth is called outside AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;