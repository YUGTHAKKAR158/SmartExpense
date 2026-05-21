// ═══════════════════════════════════════════════
// src/models/GroupExpense.js
//
// A single expense within a group.
// KEY FEATURE: splitAmong contains ONLY the members
// who share this particular expense — not all members.
//
// Example:
// Group: Goa Trip (4 members: A, B, C, D)
// Expense: Hotel ₹4000 — paid by A, split among A,B,C,D
// Expense: Lunch ₹600  — paid by B, split among B,C only
// ═══════════════════════════════════════════════

const mongoose = require('mongoose');

// Individual share sub-schema
// Tracks how much each member owes for THIS expense
const splitShareSchema = new mongoose.Schema({
  // Reference to the member's _id in the Group.members array
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  memberName: {
    type: String,
    required: true,
  },

  // How much this member owes for this expense
  shareAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  // The registered userId if member has an account
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { _id: true });

const groupExpenseSchema = new mongoose.Schema(
  {
    // Which group this expense belongs to
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },

    // Description of the expense
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 200,
    },

    // Total amount of this expense
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      set: (val) => Math.round(val * 100) / 100,
    },

    // Who paid for this expense
    // References a member's _id in the Group
    paidByMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    paidByMemberName: {
      type: String,
      required: true,
    },

    // The registered userId of the payer (if applicable)
    paidByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // WHO SPLITS THIS EXPENSE
    // This is the key feature — only selected members
    // not necessarily all group members
    splitAmong: [splitShareSchema],

    // Split type for reference
    splitType: {
      type: String,
      enum: ['equal'],  // Phase 11 = equal split only
      default: 'equal',
    },

    // Date of the expense
    date: {
      type: Date,
      default: Date.now,
    },

    // Category for reference
    category: {
      type: String,
      default: 'Travel',
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

groupExpenseSchema.index({ group: 1, date: -1 });

groupExpenseSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.__v; return ret; },
});

const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);
module.exports = GroupExpense;