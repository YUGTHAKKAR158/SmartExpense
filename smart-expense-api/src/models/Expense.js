// ═══════════════════════════════════════════════
// src/models/Expense.js — Expense Schema
//
// Every expense a user logs is stored as one
// document in the 'expenses' collection.
//
// Design decisions:
// - user field links every expense to its owner
// - category uses enum to keep data consistent
// - date defaults to now but can be set manually
//   (user might log yesterday's expense today)
// - indexes speed up the most common queries
// ═══════════════════════════════════════════════

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────
    // OWNERSHIP
    // Every expense MUST belong to a user.
    // ref: 'User' tells Mongoose which model to
    // use when we call .populate('user')
    // ─────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Expense must belong to a user'],
    },

    // ─────────────────────────────────────────
    // CORE FIELDS
    // ─────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      // Round to 2 decimal places at schema level
      set: (val) => Math.round(val * 100) / 100,
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Food & Dining',
          'Transportation',
          'Shopping',
          'Entertainment',
          'Healthcare',
          'Utilities',
          'Education',
          'Travel',
          'Personal Care',
          'Other',
        ],
        message: '{VALUE} is not a valid category',
      },
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },

    date: {
      type: Date,
      // Default to now — but user can override
      // (logging an expense from yesterday)
      default: Date.now,
    },

    // ─────────────────────────────────────────
    // PAYMENT INFO
    // ─────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: {
        values: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'],
        message: '{VALUE} is not a valid payment method',
      },
      default: 'UPI',
    },

    merchant: {
      type: String,
      trim: true,
      maxlength: [100, 'Merchant name cannot exceed 100 characters'],
      default: '',
    },

    // ─────────────────────────────────────────
    // SOURCE — how was this expense created?
    // 'manual' = user typed it in
    // 'upi_auto' = captured from UPI notification
    //              (Phase 13 — mobile app)
    // ─────────────────────────────────────────
    source: {
      type: String,
      enum: ['manual', 'upi_auto'],
      default: 'manual',
    },

    // Optional notes for extra context
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ═══════════════════════════════════════════════
// INDEXES — critical for performance
//
// Without indexes, every query does a full
// collection scan (reads every document).
// With indexes, MongoDB jumps directly to matches.
//
// Think of it like a book index vs reading
// every page to find a word.
// ═══════════════════════════════════════════════

// Most common query: "get all expenses for this user"
// This index makes that query instant
expenseSchema.index({ user: 1 });

// Second most common: "get expenses for user in date range"
// Compound index covers both filters together
expenseSchema.index({ user: 1, date: -1 });

// For category filtering per user
expenseSchema.index({ user: 1, category: 1 });

// ═══════════════════════════════════════════════
// TRANSFORM — clean up what gets sent to client
// ═══════════════════════════════════════════════
expenseSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;