// ═══════════════════════════════════════════════
// src/controllers/authController.js
//
// Thin layer between HTTP and business logic.
// Each function:
//   1. Extracts data from req
//   2. Calls the service
//   3. Sends the response
// That's it. No logic. No DB calls. No decisions.
// ═══════════════════════════════════════════════

const authService = require('../services/authService');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

// ───────────────────────────────────────────────
// POST /api/auth/register
// ───────────────────────────────────────────────
const registerUser = async (req, res, next) => {
  try {
    // Extract only what we need from the request body
    const { name, email, password } = req.body;

    // Call service — all logic lives there
    const { user, token } = await authService.register({ name, email, password });

    // 201 Created — new resource was created
    sendSuccess(res, { user, token }, 'Account created successfully', 201);
  } catch (error) {
    // Pass to global error handler
    next(error);
  }
};

// ───────────────────────────────────────────────
// POST /api/auth/login
// ───────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await authService.login({ email, password });

    sendSuccess(res, { user, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────
// GET /api/auth/me
// Protected route — req.user is set by auth middleware
// ───────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user.id is injected by the protect middleware
    // (we'll build that in Step 2.5)
    const user = await authService.getMe(req.user.id);

    sendSuccess(res, { user }, 'User profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

// ───────────────────────────────────────────────
// PATCH /api/auth/profile
// Protected — update name, currency, or password
// ───────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, currency, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) throw new AppError('User not found', 404);

    if (name && name.trim().length >= 2) {
      user.name = name.trim();
    }

    const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
    if (currency && ALLOWED_CURRENCIES.includes(currency)) {
      user.currency = currency;
    }

    if (newPassword) {
      if (user.authProvider !== 'local') {
        throw new AppError('SSO accounts cannot change password here', 400);
      }
      if (!currentPassword) {
        throw new AppError('Current password is required to set a new one', 400);
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) throw new AppError('Current password is incorrect', 401);
      if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400);
      }
      user.password = newPassword;
    }

    await user.save();

    // Re-fetch without password field for the response
    const updated = await User.findById(req.user.id);
    sendSuccess(res, { user: updated }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe, updateProfile };