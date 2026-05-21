// ═══════════════════════════════════════════════
// src/pages/LoginPage.jsx
//
// Full login form with:
// - Frontend validation
// - Backend error display
// - Loading state
// - Redirect to dashboard on success
// - Link to register page
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import SSOButtons from '../components/auth/SSOButtons';

const validateLogin = (values) => {
  const errors = {};
  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email';
  }
  if (!values.password) {
    errors.password = 'Password is required';
  }
  return errors;
};

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // apiError lives HERE in the component — nothing can
  // accidentally clear it except our own explicit calls
  const [apiError, setApiError] = useState('');

  // Only redirect if authenticated AND we are not
  // in the middle of a failed login attempt
  useEffect(() => {
    if (isAuthenticated && !apiError) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, apiError, from, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear API error on new attempt
    setApiError('');

    // Frontend validation
    const validationErrors = validateLogin(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      await login(values.email, values.password);
      // Only navigate on explicit success
      navigate(from, { replace: true });
    } catch (error) {
      // Extract error message from backend response
      const message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';

      // Set error — this will NOT be cleared by anything
      // except the next submit attempt or manual dismiss
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💰</div>
          <h1 className="text-3xl font-bold text-gray-900">SmartExpense</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* Form Card */}
        <div className="card">

          {/* ERROR ALERT — always visible when apiError is set */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-lg flex-shrink-0">❌</span>
                <p className="text-red-800 text-sm font-semibold">{apiError}</p>
              </div>
              <button
                onClick={() => setApiError('')}
                className="text-red-400 hover:text-red-600 text-xl leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">

              <Input
                label="Email address"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="you@example.com"
                required
                disabled={loading}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                size="lg"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

            </div>
          </form>

          {/* SSO Buttons */}
          <div className="mt-6">
            <SSOButtons />
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Create one free
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;