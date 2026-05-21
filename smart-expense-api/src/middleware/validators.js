// ═══════════════════════════════════════════════
// src/middleware/validators.js
//
// Input validation middleware using express-validator
//
// WHY validate here and not in the service?
// Services should receive CLEAN data and focus on
// business logic. Validation is an HTTP concern —
// it belongs in the middleware layer.
//
// HOW it works:
// 1. check() rules run and collect any errors
// 2. handleValidationErrors reads those errors
// 3. If errors exist, it returns 400 immediately
// 4. If no errors, next() passes to the controller
// ═══════════════════════════════════════════════

const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// ───────────────────────────────────────────────
// handleValidationErrors — reads validation results
// and returns 400 if anything failed
// This must be the LAST item in every validator array
// ───────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors into a clean array of messages
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return sendError(
      res,
      'Validation failed. Please check your input.',
      400,
      formattedErrors
    );
  }

  next();
};

// ───────────────────────────────────────────────
// validateRegister — rules for POST /api/auth/register
// ───────────────────────────────────────────────
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(), // lowercases and removes dots from gmail

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  // This must always be last
  handleValidationErrors,
];

// ───────────────────────────────────────────────
// validateLogin — rules for POST /api/auth/login
// ───────────────────────────────────────────────
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

// ───────────────────────────────────────────────
// validateCreateExpense
// ───────────────────────────────────────────────
const validateCreateExpense = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Food & Dining', 'Transportation', 'Shopping',
      'Entertainment', 'Healthcare', 'Utilities',
      'Education', 'Travel', 'Personal Care', 'Other',
    ]).withMessage('Invalid category'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD)'),

  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'])
    .withMessage('Invalid payment method'),

  body('merchant')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Merchant name cannot exceed 100 characters'),

  handleValidationErrors,
];

// ───────────────────────────────────────────────
// validateUpdateExpense — all fields optional on update
// ───────────────────────────────────────────────
const validateUpdateExpense = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),

  body('category')
    .optional()
    .isIn([
      'Food & Dining', 'Transportation', 'Shopping',
      'Entertainment', 'Healthcare', 'Utilities',
      'Education', 'Travel', 'Personal Care', 'Other',
    ]).withMessage('Invalid category'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid date'),

  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'])
    .withMessage('Invalid payment method'),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateExpense,
  validateUpdateExpense,
  handleValidationErrors,
};