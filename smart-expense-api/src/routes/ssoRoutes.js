// ═══════════════════════════════════════════════
// src/routes/ssoRoutes.js
//
// SSO routes for Google and GitHub OAuth.
//
// Flow for each provider:
// GET /api/auth/google          ← start OAuth flow
// GET /api/auth/google/callback ← Google redirects here
// ═══════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { config } = require('../config/config');

// ───────────────────────────────────────────────
// HELPER — generateTokenAndRedirect
//
// After OAuth succeeds, we:
// 1. Generate OUR OWN JWT (not Google's token)
// 2. Redirect to frontend with the token in URL
// 3. Frontend reads token from URL and stores it
//
// WHY redirect with token in URL?
// Because after OAuth, the browser is on the BACKEND
// URL (localhost:5000). We need to get the token to
// the FRONTEND (localhost:5173). The cleanest way is
// to redirect to the frontend with the token as a
// query parameter, then frontend reads and stores it.
// ───────────────────────────────────────────────
const generateTokenAndRedirect = (req, res) => {
  try {
    // req.user is set by Passport after successful auth
    const user = req.user;

    // Generate our own JWT — same as regular login
    const token = user.generateJWT();

    // Redirect to frontend with token + user info in URL
    // Frontend will pick this up in a useEffect
    const userData = encodeURIComponent(JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency,
      authProvider: user.authProvider,
    }));

    // Redirect to a special frontend route that handles
    // the token extraction and then redirects to dashboard
    res.redirect(
      `${config.cors.clientUrl}/auth/callback?token=${token}&user=${userData}`
    );

  } catch (error) {
    // If something goes wrong, redirect to login with error
    res.redirect(
      `${config.cors.clientUrl}/login?error=sso_failed`
    );
  }
};

// ───────────────────────────────────────────────
// GOOGLE ROUTES
// ───────────────────────────────────────────────

// Step 1: Start Google OAuth flow
// Passport redirects user to Google's login page
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile'],
    session: false,
  })
);

// Step 2: Google redirects back here after user logs in
// Passport verifies the code, calls the verify callback,
// sets req.user, then calls generateTokenAndRedirect
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  generateTokenAndRedirect
);

// ───────────────────────────────────────────────
// GITHUB ROUTES
// ───────────────────────────────────────────────

router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
  })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=github_failed`,
  }),
  generateTokenAndRedirect
);

module.exports = router;