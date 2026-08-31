// ═══════════════════════════════════════════════
// src/config/config.js — Environment Variable Validation
//
// This file runs at startup and checks that every
// required environment variable exists and is valid.
// If anything is missing, the server crashes with a
// clear error BEFORE accepting any requests.
//
// WHY: Silent misconfiguration is the hardest bug
// to debug in production. Fail loud, fail fast.
// ═══════════════════════════════════════════════

// Define every variable your app needs to function.
// Grouped by concern so it's easy to see what each
// section of the app depends on.
const REQUIRED_ENV_VARS = [
  // Server
  'NODE_ENV',
  'PORT',

  // Database
  'MONGO_URI',

  // Authentication
  'JWT_SECRET',
  'JWT_EXPIRE',

  // CORS
  'CLIENT_URL',

  // OAuth IDs
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
];

// ───────────────────────────────────────────────
// validateEnv — call this once at startup
// Loops through every required variable and checks
// that process.env has a non-empty value for it.
// Collects ALL missing vars before throwing —
// so you see everything wrong at once, not one at a time.
// ───────────────────────────────────────────────
const validateEnv = () => {
  const missing = [];

  REQUIRED_ENV_VARS.forEach((varName) => {
    // Check if the variable is undefined OR empty string
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });

  // If any variables are missing, list them all and crash
  if (missing.length > 0) {
    console.error('═══════════════════════════════════════');
    console.error('❌ FATAL: Missing required environment variables:');
    missing.forEach((varName) => {
      console.error(`   • ${varName}`);
    });
    console.error('');
    console.error('👉 Check your .env file and add the missing variables.');
    console.error('═══════════════════════════════════════');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
};

// ───────────────────────────────────────────────
// config object — single source of truth
// Export all env vars through this object so the
// rest of the app never calls process.env directly.
//
// WHY: If you call process.env.JWT_SECRET in 20
// different files and the variable name changes,
// you have to find and update 20 files.
// With this, you update ONE place.
// ───────────────────────────────────────────────
const config = {
  server: {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10) || 5000,
  },

  db: {
    uri: process.env.MONGO_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE,
  },

  cors: {
    clientUrl: process.env.CLIENT_URL,
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/github/callback`,
    },
  },
};

module.exports = { validateEnv, config };