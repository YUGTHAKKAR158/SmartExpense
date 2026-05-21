// ═══════════════════════════════════════════════
// src/services/budgetService.js
//
// All budget business logic:
// - getOrCreateBudget: fetch budget, create if none exists
// - updateBudget: set monthly limit + category limits
// - getBudgetWithSpending: budget + actual spending + alerts
// ═══════════════════════════════════════════════

const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { AppError } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

// ───────────────────────────────────────────────
// getOrCreateBudget
// Fetches budget for given month/year.
// If none exists, creates an empty one automatically.
// WHY: user shouldn't have to explicitly "create" a
// budget before setting limits — it just exists.
// ───────────────────────────────────────────────
const getOrCreateBudget = async (userId, month, year) => {
  let budget = await Budget.findOne({ user: userId, month, year });

  if (!budget) {
    budget = await Budget.create({
      user: userId,
      month,
      year,
      monthlyLimit: 0,
      categoryBudgets: [],
    });
  }

  return budget;
};

// ───────────────────────────────────────────────
// updateBudget
// Sets the monthly limit and/or category budgets
// ───────────────────────────────────────────────
const updateBudget = async (userId, month, year, updateData) => {
  const { monthlyLimit, categoryBudgets } = updateData;

  // Get or create budget for this month
  let budget = await getOrCreateBudget(userId, month, year);

  // Update monthly limit if provided
  if (monthlyLimit !== undefined) {
    budget.monthlyLimit = monthlyLimit;
  }

  // Update category budgets if provided
  if (categoryBudgets && Array.isArray(categoryBudgets)) {
    // For each incoming category budget, either update
    // the existing one or add a new one
    categoryBudgets.forEach(({ category, limit }) => {
      const existingIndex = budget.categoryBudgets.findIndex(
        (cb) => cb.category === category
      );

      // Treat 0, null, undefined, empty string all as "remove"
      const shouldRemove = !limit || limit === 0 || limit === '' || isNaN(limit);

      if (existingIndex >= 0) {
        if (shouldRemove) {
          // Remove this category budget entirely
          budget.categoryBudgets.splice(existingIndex, 1);
        } else {
          budget.categoryBudgets[existingIndex].limit = parseFloat(limit);
        }
      } else if (!shouldRemove) {
        budget.categoryBudgets.push({ category, limit: parseFloat(limit) });
      }
    });
  }

  await budget.save();
  return budget;
};

// ───────────────────────────────────────────────
// getBudgetWithSpending
// The main function — returns budget + actual spending
// + calculated percentages + alert flags
//
// This is what the frontend uses to render
// the progress bars and alert messages
// ───────────────────────────────────────────────
const getBudgetWithSpending = async (userId, month, year) => {
  // Step 1: Get or create budget
  const budget = await getOrCreateBudget(userId, month, year);

  // Step 2: Get actual spending for this month
  // using MongoDB aggregation (same as expense summary)
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const spendingByCategory = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        spent: { $sum: '$amount' },
      },
    },
  ]);

  // Convert array to map for easy lookup
  // { 'Food & Dining': 1500, 'Transport': 800 }
  const spendingMap = {};
  spendingByCategory.forEach(({ _id, spent }) => {
    spendingMap[_id] = spent;
  });

  // Step 3: Calculate total spending
  const totalSpent = Object.values(spendingMap).reduce(
    (sum, amount) => sum + amount, 0
  );

  // Step 4: Build overall budget status
  const overallStatus = calculateStatus(
    totalSpent,
    budget.monthlyLimit
  );

  // Step 5: Build per-category status
  const categoryStatus = budget.categoryBudgets.map((cb) => {
    const spent = spendingMap[cb.category] || 0;
    return {
      category: cb.category,
      limit: cb.limit,
      spent,
      ...calculateStatus(spent, cb.limit),
    };
  });

  // Step 6: Find categories with spending but NO budget set
  // These are "untracked" — useful to show user
  const untrackedCategories = Object.entries(spendingMap)
    .filter(([category]) =>
      !budget.categoryBudgets.find((cb) => cb.category === category)
    )
    .map(([category, spent]) => ({ category, spent, limit: null }));

  return {
    budget,
    overall: {
      limit: budget.monthlyLimit,
      spent: totalSpent,
      ...overallStatus,
    },
    categories: categoryStatus,
    untrackedCategories,
    month,
    year,
  };
};

// ───────────────────────────────────────────────
// calculateStatus — helper
// Takes spent + limit and returns:
// - percentage used
// - status: 'safe' | 'warning' | 'danger' | 'exceeded'
// - remaining amount
// ───────────────────────────────────────────────
const calculateStatus = (spent, limit) => {
  // If no limit set, return neutral status
  if (!limit || limit === 0) {
    return {
      percentage: 0,
      status: 'no_limit',
      remaining: null,
      isOverBudget: false,
    };
  }

  const percentage = Math.round((spent / limit) * 100);
  const remaining = limit - spent;

  let status;
  if (percentage >= 100) {
    status = 'exceeded';    // Over budget — deep red
  } else if (percentage >= 90) {
    status = 'danger';      // 90-99% — red
  } else if (percentage >= 70) {
    status = 'warning';     // 70-89% — yellow
  } else {
    status = 'safe';        // Under 70% — green
  }

  return {
    percentage: Math.min(percentage, 100),
    rawPercentage: percentage,
    status,
    remaining,
    isOverBudget: spent > limit,
  };
};

module.exports = {
  getOrCreateBudget,
  updateBudget,
  getBudgetWithSpending,
};