// ═══════════════════════════════════════════════
// src/pages/OAuthCallbackPage.jsx
//
// This page handles the redirect from backend
// after OAuth succeeds.
//
// URL looks like:
// /auth/callback?token=eyJ...&user=%7B%22name%22...%7D
//
// This page:
// 1. Reads token + user from URL
// 2. Stores them in localStorage
// 3. Updates AuthContext
// 4. Redirects to dashboard
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserFromSSO } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');

    // Handle error case
    if (errorParam || !token || !userParam) {
      setError('SSO login failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {
      // Decode the user object from URL
      const user = JSON.parse(decodeURIComponent(userParam));

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update AuthContext so the rest of the app knows
      // the user is now logged in
      setUserFromSSO(user, token);

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });

    } catch (err) {
      setError('Failed to process login. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, setUserFromSSO]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-600 font-semibold">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold text-lg">Completing sign in...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;