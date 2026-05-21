// ═══════════════════════════════════════════════
// src/models/Budget.js
//
// One Budget document per user per month.
// Contains overall monthly limit + per-category limits.
//
// Design decision: store all category budgets
// inside ONE document (not separate documents per
// category) because they're always fetched together
// and updated together.
// ═══════════════════════════════════════════════

const mongoose = require('mongoose');

// Sub-schema for individual category budgets
// This gets embedded inside the Budget document
const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
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
  },

  // Monthly limit for this category
  limit: {
    type: Number,
    required: true,
    min: [1, 'Budget limit must be at least 1'],
  },
}, { _id: true });

const budgetSchema = new mongoose.Schema(
  {
    // Which user owns this budget
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Which month + year this budget applies to
    // month: 1-12
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2020,
    },

    // Overall monthly spending limit
    // 0 means no overall limit set
    monthlyLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Array of per-category budgets
    // User can set limits for as many or as few
    // categories as they want
    categoryBudgets: [categoryBudgetSchema],

    // Alert thresholds — when to warn the user
    alertAt70: {
      type: Boolean,
      default: true,
    },

    alertAt90: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — one budget per user per month+year
// If user tries to create two budgets for Jan 2024,
// MongoDB will reject the second one
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

budgetSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Budget = mongoose.model('Budget', budgetSchema);
module.exports = Budget;