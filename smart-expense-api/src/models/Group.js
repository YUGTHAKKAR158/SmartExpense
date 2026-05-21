// ═══════════════════════════════════════════════
// src/models/Group.js
//
// A Group represents a trip or shared event.
// Members are stored with name + userId (if they
// are registered users) or just name (if guests).
//
// Status:
// 'active'   = trip ongoing, expenses being added
// 'settled'  = trip ended, settlements calculated
// 'closed'   = settlements done, expenses exported
// ═══════════════════════════════════════════════

const mongoose = require('mongoose');

// Member sub-schema
// A member can be a registered user OR just a name
const memberSchema = new mongoose.Schema({
  // Display name — always required
  name: {
    type: String,
    required: true,
    trim: true,
  },

  // If this member is a registered user in the app
  // null = guest member (just a name, no account)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Email for identification (optional for guests)
  email: {
    type: String,
    default: '',
    trim: true,
  },
}, { _id: true });

const groupSchema = new mongoose.Schema(
  {
    // Who created this group
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },

    // Trip/event category — determines which expense
    // category to use when auto-adding to expenses
    tripCategory: {
      type: String,
      enum: [
        'Travel', 'Food & Dining', 'Entertainment',
        'Shopping', 'Other',
      ],
      default: 'Travel',
    },

    // All members including the creator
    members: [memberSchema],

    // Group lifecycle status
    status: {
      type: String,
      enum: ['active', 'settled', 'closed'],
      default: 'active',
    },

    // When status becomes 'closed', record the date
    closedAt: {
      type: Date,
      default: null,
    },

    // Total amount spent in this group
    // Recalculated every time an expense is added/removed
    totalAmount: {
      type: Number,
      default: 0,
    },

    // Currency for this group
    currency: {
      type: String,
      default: 'INR',
    },

    // ── Feature 1: Registered user invites ──
    invites: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted'],
          default: 'pending',
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],

    // Registered users (other than creator) who have access
    collaborators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        name:  { type: String, required: true },
        email: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
      }
    ],

    // ── Feature 2: Public share link ──
    shareToken: {
      type: String,
      default: null,
      unique: true,
      sparse: true, // allows multiple null values
    },

    shareEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup of groups by creator
groupSchema.index({ createdBy: 1, status: 1 });

groupSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.__v; return ret; },
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;