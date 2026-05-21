// ═══════════════════════════════════════════════
// src/models/User.js — User Schema + Model
//
// This is more than just a data shape. It contains:
// - Field-level validation (mongoose handles this)
// - Password hashing (runs automatically before save)
// - Instance methods (comparePassword, generateJWT)
//
// WHY put logic here?
// Because no matter WHERE in the app a user is
// created or updated, this logic ALWAYS runs.
// You can't forget to hash a password — the model
// does it for you automatically.
// ═══════════════════════════════════════════════

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/config');

const userSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────
    // BASIC INFO
    // ─────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true, // removes leading/trailing whitespace
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index in MongoDB
      lowercase: true, // always store emails in lowercase
      trim: true,
      // Regex validates email format at the DB level
      // This is a second line of defense after express-validator
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      // required: [true, 'Password is required'],    // No longer required — SSO users have no password
      minlength: [6, 'Password must be at least 6 characters'],
      // select: false means this field is EXCLUDED from
      // all queries by default. You must explicitly ask
      // for it with .select('+password')
      // This prevents accidentally leaking passwords in
      // API responses — a critical security practice
      select: false,
    },

    // ─────────────────────────────────────────
    // SSO FIELDS
    // Stores the provider name + their unique ID
    // for each OAuth provider the user connects
    // ─────────────────────────────────────────

    // Which providers this user has connected
    // 'local' = email/password
    // 'google' = Google SSO
    // 'github' = GitHub SSO
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },

    // Google's unique ID for this user
    googleId: {
      type: String,
      default: null,
      sparse: true, // allows multiple null values (unique only among non-null)
    },

    // GitHub's unique ID for this user
    githubId: {
      type: String,
      default: null,
      sparse: true,
    },

    // Profile photo URL from OAuth provider
    avatar: {
      type: String,
      default: null,
    },

    // ─────────────────────────────────────────
    // PREFERENCES
    // ─────────────────────────────────────────
    currency: {
      type: String,
      default: 'INR',
      enum: {
        values: ['INR', 'USD', 'EUR', 'GBP'],
        message: '{VALUE} is not a supported currency',
      },
    },

    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Monthly budget cannot be negative'],
    },

    // ─────────────────────────────────────────
    // ACCOUNT STATE
    // ─────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    // timestamps: true automatically adds:
    // createdAt — when the document was first created
    // updatedAt — when the document was last modified
    // Mongoose manages both fields automatically
    timestamps: true,
  }
);

// ═══════════════════════════════════════════════
// PRE-SAVE MIDDLEWARE (Mongoose hooks)
//
// This function runs automatically BEFORE every
// .save() call on a User document.
//
// WHY use a hook instead of doing it in the service?
// Because if you do it in the service, you have to
// remember to hash the password in EVERY place that
// saves a user. With a hook, it's impossible to forget.
// ═══════════════════════════════════════════════
userSchema.pre('save', async function () {
  // 'this' refers to the document being saved

  // CRITICAL: only hash if password was actually modified
  // If you update the user's name, you don't want to
  // re-hash the already-hashed password — that would
  // corrupt it and make login impossible

  // Skip hashing if:
  // 1. Password wasn't modified, OR
  // 2. This is an SSO user (no password)
  if (!this.isModified('password') || !this.password) {
    return;
  }

  // bcrypt.genSalt generates a random salt
  // Salt rounds = 12 means 2^12 = 4096 iterations
  // Higher = more secure but slower
  // 12 is the industry standard for production
  // (10 is common in tutorials but slightly weaker)
  const salt = await bcrypt.genSalt(12);

  // Hash the plain text password with the salt
  // The result looks like: $2a$12$randomsalthere...hashedpassword
  this.password = await bcrypt.hash(this.password, salt);
});

// ═══════════════════════════════════════════════
// INSTANCE METHODS
// Methods defined on the schema are available on
// every document instance (individual user objects)
// Called like: user.comparePassword('plain text')
// ═══════════════════════════════════════════════

// comparePassword — safely compare a plain text
// password against the stored hash
// Used during login to verify credentials
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare hashes the candidate and compares
  // it to the stored hash — returns true or false
  // We need to explicitly include password because
  // select: false excludes it by default
  return await bcrypt.compare(candidatePassword, this.password);
};

// generateJWT — creates a signed JWT for this user
// Called after successful login or registration
userSchema.methods.generateJWT = function () {
  // jwt.sign() creates the token
  // Payload: data embedded in the token (not secret — anyone can decode it)
  // Secret: used to SIGN the token — only your server knows this
  // Options: expiry time
  return jwt.sign(
    {
      // Include only what you need — keep payloads small
      // The frontend will use this id to identify the user
      id: this._id,
      email: this.email,
      name: this.name,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expire, // '7d' from .env
    }
  );
};

// ═══════════════════════════════════════════════
// TRANSFORM — control what gets returned when
// a User document is converted to JSON
// This runs automatically when you call res.json()
// with a user object
// ═══════════════════════════════════════════════
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    // Remove sensitive/internal fields from API responses
    delete ret.password;  // never send password hash
    delete ret.__v;       // mongoose version key — not useful to clients
    return ret;
  },
});

// Create and export the model
// mongoose.model('User', schema) creates a model
// that maps to the 'users' collection in MongoDB
// (Mongoose automatically pluralizes and lowercases)
const User = mongoose.model('User', userSchema);

module.exports = User;