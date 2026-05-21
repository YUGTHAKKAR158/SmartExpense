// ═══════════════════════════════════════════════
// src/hooks/useForm.js
//
// Custom hook that handles form state management.
// Tracks values, errors, and loading state.
//
// WHY a custom hook?
// Every form needs: values, errors, onChange handler,
// loading state, submit handler. Without this hook,
// you'd repeat that logic in every form component.
// ═══════════════════════════════════════════════

import { useState, useCallback } from 'react';

const useForm = (initialValues, validateFn) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setValues(prev => ({ ...prev, [name]: value }));

    // Only clear the field-level error for THIS field
    // Do NOT clear apiError here — let it stay visible
    // until the user submits again
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    if (!validateFn) return true;
    const validationErrors = validateFn(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values, validateFn]);

  const handleSubmit = useCallback((submitFn) => async (e) => {
    e.preventDefault();

    // Clear previous messages only when user tries again
    setApiError('');
    setApiSuccess('');

    if (!validate()) return;

    setLoading(true);

    try {
      await submitFn(values);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';

      setApiError(message);
    } finally {
      setLoading(false);
    }
  }, [validate, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setApiError('');
    setApiSuccess('');
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    apiError,
    apiSuccess,
    setApiSuccess,
    setApiError,
    handleChange,
    handleSubmit,
    reset,
  };
};

export default useForm;