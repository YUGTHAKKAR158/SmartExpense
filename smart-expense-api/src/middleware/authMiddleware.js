// ═══════════════════════════════════════════════
// src/middleware/authMiddleware.js
//
// protect — JWT verification middleware
//
// Used like: router.get('/me', protect, getMe)
// protect runs first. If JWT is valid, req.user
// is set and the request continues to getMe.
// If JWT is invalid, an error is thrown and
// the global error handler catches it.
// ═══════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const { config } = require('../config/config');

const protect = async (req, res, next) => {
  try {
    // ─────────────────────────────────────────
    // Step 1: Extract the token
    //
    // The client sends the token in the Authorization header:
    // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    //
    // We check for 'Bearer' prefix because that's the
    // industry standard OAuth 2.0 token format
    // ─────────────────────────────────────────
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      // Split "Bearer eyJ..." and take the second part
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Access denied. No token provided. Please log in.', 401);
    }

    // ─────────────────────────────────────────
    // Step 2: Verify the token
    //
    // jwt.verify() does two things:
    // 1. Checks the signature (was it signed with our secret?)
    // 2. Checks the expiry (has it expired?)
    //
    // If either check fails, it throws an error which
    // our global error handler translates to a clean message
    // ─────────────────────────────────────────
    const decoded = jwt.verify(token, config.jwt.secret);
    // decoded = { id: '...', email: '...', name: '...', iat: ..., exp: ... }

    // ─────────────────────────────────────────
    // Step 3: Confirm the user still exists
    //
    // WHY check the DB if the token is valid?
    // Because the user could have been deleted AFTER
    // the token was issued. The token is still
    // cryptographically valid but the user is gone.
    // Always verify the user still exists.
    // ─────────────────────────────────────────
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // Step 4: Check if account is still active
    if (!currentUser.isActive) {
      throw new AppError('Your account has been deactivated.', 403);
    }

    // ─────────────────────────────────────────
    // Step 5: Attach user to request object
    //
    // This is how controllers know WHO is making
    // the request. Any route with protect middleware
    // can access req.user anywhere downstream.
    // ─────────────────────────────────────────
    req.user = currentUser;

    // Pass control to the next middleware or controller
    next();

  } catch (error) {
    next(error);
  }
};

module.exports = { protect };