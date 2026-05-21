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

module.exports = { registerUser, loginUser, getMe };