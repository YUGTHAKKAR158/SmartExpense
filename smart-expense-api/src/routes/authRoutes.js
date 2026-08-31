// ═══════════════════════════════════════════════
// src/routes/authRoutes.js
//
// Routes contain ZERO logic.
// They only map HTTP method + URL → controller function
// and attach any middleware that applies to that route.
// ═══════════════════════════════════════════════

const express = require('express');
const router = express.Router();

const { registerUser, loginUser, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validators');

// POST /api/auth/register
// Public — no auth required
// validateRegister runs first, then registerUser
router.post('/register', validateRegister, registerUser);

// POST /api/auth/login
// Public — no auth required
router.post('/login', validateLogin, loginUser);

// GET /api/auth/me
// Protected — protect middleware verifies JWT first
// If JWT is invalid, protect throws an error before
// getMe ever runs
router.get('/me', protect, getMe);

// PATCH /api/auth/profile
// Protected — update name, currency, or password
router.patch('/profile', protect, updateProfile);

module.exports = router;