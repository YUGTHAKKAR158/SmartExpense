// ═══════════════════════════════════════════════
// src/config/passport.js
//
// Configures Passport.js with Google and GitHub
// OAuth strategies.
//
// HOW PASSPORT WORKS:
// 1. User hits /api/auth/google
// 2. Passport redirects to Google
// 3. Google redirects back to /api/auth/google/callback
// 4. Passport calls the 'verify callback' below
// 5. Verify callback finds/creates user in YOUR database
// 6. Returns the user to the route handler
// ═══════════════════════════════════════════════

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const { config } = require('./config');

// ───────────────────────────────────────────────
// GOOGLE STRATEGY
// ───────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.callbackUrl,
    },

    // This 'verify callback' runs after Google authenticates the user
    // accessToken: token to call Google APIs (we don't need this)
    // refreshToken: to get new access tokens (we don't need this)
    // profile: user's Google profile data
    // done: callback to tell Passport what user to attach
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        // Step 1: Check if user already connected Google
        let user = await User.findOne({ googleId });

        if (user) {
          // User has logged in with Google before
          // Just return them — no need to create anything
          return done(null, user);
        }

        // Step 2: Check if user exists with same email
        // (they might have registered with email/password before)
        user = await User.findOne({ email });

        if (user) {
          // Email exists — LINK this Google account to their
          // existing account instead of creating a duplicate
          user.googleId = googleId;
          user.avatar = avatar;
          // Keep their existing authProvider as 'local' since
          // they originally registered with email/password
          await user.save();
          return done(null, user);
        }

        // Step 3: Brand new user — create account
        user = await User.create({
          name,
          email,
          googleId,
          avatar,
          authProvider: 'google',
          // No password — SSO users authenticate through Google
          isActive: true,
        });

        return done(null, user);

      } catch (error) {
        // Pass error to Passport
        return done(error, null);
      }
    }
  )
);

// ───────────────────────────────────────────────
// GITHUB STRATEGY
// Same pattern as Google but GitHub profile
// structure is slightly different
// ───────────────────────────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret,
      callbackURL: config.oauth.github.callbackUrl,
      // Request email scope — not included by default
      scope: ['user:email'],
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const githubId = profile.id.toString();

        // GitHub can return multiple emails
        // Find the primary/verified one
        const email =
          profile.emails?.find((e) => e.primary && e.verified)?.value ||
          profile.emails?.[0]?.value ||
          `github_${githubId}@noemail.com`; // fallback if no email

        const name = profile.displayName || profile.username;
        const avatar = profile.photos?.[0]?.value;

        // Same 3-step pattern as Google
        let user = await User.findOne({ githubId });
        if (user) return done(null, user);

        user = await User.findOne({ email });
        if (user) {
          user.githubId = githubId;
          user.avatar = avatar;
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          name,
          email,
          githubId,
          avatar,
          authProvider: 'github',
          isActive: true,
        });

        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// ───────────────────────────────────────────────
// SERIALIZE / DESERIALIZE
//
// These are required by Passport but we use them
// minimally since we're JWT-based, not session-based.
//
// serializeUser: what to store when saving user to session
// deserializeUser: how to retrieve user from session
//
// We just store the user ID — Passport needs these
// even though we immediately convert to JWT and
// don't actually use Passport sessions after that.
// ───────────────────────────────────────────────
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;