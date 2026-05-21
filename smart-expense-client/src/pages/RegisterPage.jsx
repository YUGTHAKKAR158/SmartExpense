// ═══════════════════════════════════════════════
// src/pages/RegisterPage.jsx
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useForm from '../hooks/useForm';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import SSOButtons from '../components/auth/SSOButtons';

const validateRegister = (values) => {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  } else if (!/\d/.test(values.password)) {
    errors.password = 'Password must contain at least one number';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

const RegisterPage = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    values,
    errors,
    loading,
    apiError,
    setApiError,
    handleChange,
    handleSubmit,
  } = useForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    validateRegister
  );

  const onSubmit = async (formValues) => {
    await register(formValues.name, formValues.email, formValues.password);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💰</div>
          <h1 className="text-3xl font-bold text-gray-900">SmartExpense</h1>
          <p className="text-gray-500 mt-2">Create your free account</p>
        </div>

        {/* Form Card */}
        <div className="card">

          {apiError && (
            <div className="mb-6">
              <Alert 
                message={apiError} 
                type="error" 
                onDismiss={() => setApiError('')}
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">

              <Input
                label="Full name"
                name="name"
                type="text"
                value={values.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="John Doe"
                required
                disabled={loading}
              />

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
                placeholder="Min 6 chars, at least one number"
                required
                disabled={loading}
              />

              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
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
                {loading ? 'Creating account...' : 'Create account'}
              </Button>

            </div>
          </form>

          {/* SSO Buttons */}
          <div className="mt-6">
            <SSOButtons />
          </div>

          {/* Password requirements hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">Password requirements:</p>
            <ul className="text-xs text-gray-400 space-y-0.5">
              <li className={values.password.length >= 6 ? 'text-success-500' : ''}>
                {values.password.length >= 6 ? '✅' : '○'} At least 6 characters
              </li>
              <li className={/\d/.test(values.password) ? 'text-success-500' : ''}>
                {/\d/.test(values.password) ? '✅' : '○'} At least one number
              </li>
            </ul>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;