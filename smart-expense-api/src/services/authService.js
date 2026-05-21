// ═══════════════════════════════════════════════
// src/services/authService.js — Authentication Logic
//
// This file owns ALL auth business logic:
// - register: create user, return token
// - login: verify credentials, return token
// - getMe: fetch current user profile
//
// Controllers call these functions and send the result.
// Controllers do NOT make decisions — services do.
// ═══════════════════════════════════════════════

const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// ───────────────────────────────────────────────
// register — create a new user account
//
// @param {string} name
// @param {string} email
// @param {string} password
// @returns {object} { user, token }
// ───────────────────────────────────────────────
const register = async ({ name, email, password }) => {
  // Step 1: Check if email is already registered
  // We check BEFORE trying to create because the error
  // MongoDB throws for duplicate keys is harder to read
  // than our custom message
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    // 409 Conflict — the resource already exists
    throw new AppError('An account with this email already exists', 409);
  }

  // Step 2: Create the user
  // The pre-save hook in User.js will automatically
  // hash the password before it hits MongoDB
  const user = await User.create({
    name,
    email,
    password,
  });

  // Step 3: Generate JWT for immediate login after registration
  // User shouldn't have to log in right after registering
  const token = user.generateJWT();

  // Step 4: Return user + token
  // The toJSON transform on the model strips the password
  // so we never accidentally return it
  return { user, token };
};

// ───────────────────────────────────────────────
// login — verify credentials and return token
//
// @param {string} email
// @param {string} password
// @returns {object} { user, token }
// ───────────────────────────────────────────────
const login = async ({ email, password }) => {
  // Step 1: Find user by email
  // CRITICAL: we use .select('+password') because the
  // password field has select: false in the schema
  // Without this, user.password is undefined and
  // bcrypt.compare always returns false
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Step 2: Check if user exists
  // WHY combine "user not found" and "wrong password" into
  // the same error message?
  // Security: if you say "email not found", attackers can
  // enumerate which emails are registered in your system
  // Always give the same vague message for both cases
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Step 3: Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  // Step 4: Compare the provided password against the stored hash
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  // Step 5: Update lastLogin timestamp
  // We use findByIdAndUpdate here instead of user.save()
  // to avoid triggering the pre-save password hashing hook
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  // Step 6: Generate JWT
  const token = user.generateJWT();

  // Step 7: Return user and token
  // Remove password from the user object before returning
  user.password = undefined;

  return { user, token };
};

// ───────────────────────────────────────────────
// getMe — fetch the current authenticated user's profile
//
// @param {string} userId — from the verified JWT payload
// @returns {object} user
// ───────────────────────────────────────────────
const getMe = async (userId) => {
  // Find user by ID — password excluded by default (select: false)
  const user = await User.findById(userId);

  if (!user) {
    // This shouldn't normally happen — if the JWT was valid,
    // the user existed when the token was issued.
    // But if someone deletes their account and uses an old token:
    throw new AppError('User no longer exists', 401);
  }

  return user;
};

module.exports = { register, login, getMe };