// ═══════════════════════════════════════════════
// src/services/expenseService.js
//
// ALL expense business logic lives here:
// - createExpense
// - getAllExpenses (with filtering, sorting, pagination)
// - getExpenseById
// - updateExpense
// - deleteExpense
// - getExpenseSummary (totals by category)
// ═══════════════════════════════════════════════

const Expense = require('../models/Expense');
const { AppError } = require('../middleware/errorHandler');

// ───────────────────────────────────────────────
// createExpense
// ───────────────────────────────────────────────
const createExpense = async (userId, expenseData) => {
  // Always attach the userId from the JWT — never
  // trust userId from the request body.
  // If you used req.body.userId, any user could
  // create expenses under someone else's account.
  const expense = await Expense.create({
    ...expenseData,
    user: userId,
  });

  return expense;
};

// ───────────────────────────────────────────────
// getAllExpenses — with filtering, sorting, pagination
//
// This is the most complex function in Phase 3.
// A senior engineer builds query builders like this
// so the frontend can filter data flexibly.
// ───────────────────────────────────────────────
const getAllExpenses = async (userId, queryParams) => {
  const {
    category,
    paymentMethod,
    startDate,
    endDate,
    search,
    sortBy = 'date',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = queryParams;

  // ─────────────────────────────────────────
  // BUILD FILTER OBJECT
  // Start with user filter — ALWAYS required.
  // Then add optional filters based on what
  // the client sent as query parameters.
  // ─────────────────────────────────────────
  const filter = { user: userId };

  // Category filter — exact match
  if (category && category !== 'All') {
    filter.category = category;
  }

  // Payment method filter
  if (paymentMethod && paymentMethod !== 'All') {
    filter.paymentMethod = paymentMethod;
  }

  // Date range filter
  // MongoDB $gte = greater than or equal (start of range)
  // MongoDB $lte = less than or equal (end of range)
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      // Set end date to end of that day (23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Search filter — searches description and merchant
  // $regex allows partial matching (like SQL LIKE)
  // $options: 'i' means case-insensitive
  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: 'i' } },
      { merchant: { $regex: search, $options: 'i' } },
    ];
  }

  // ─────────────────────────────────────────
  // BUILD SORT OBJECT
  // MongoDB sort: { field: 1 } = ascending
  //               { field: -1 } = descending
  // ─────────────────────────────────────────
  const validSortFields = ['date', 'amount', 'category', 'createdAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // ─────────────────────────────────────────
  // PAGINATION
  // page=1, limit=10 → skip 0, take 10
  // page=2, limit=10 → skip 10, take 10
  // page=3, limit=10 → skip 20, take 10
  // ─────────────────────────────────────────
  const pageNumber = Math.max(1, parseInt(page));
  const limitNumber = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNumber - 1) * limitNumber;

  // ─────────────────────────────────────────
  // EXECUTE QUERIES
  // Run both in parallel using Promise.all —
  // faster than running them sequentially
  // ─────────────────────────────────────────
  const [expenses, totalCount] = await Promise.all([
    Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber),

    // countDocuments gives total matching count
    // (before pagination) — needed for frontend
    // to know how many pages exist
    Expense.countDocuments(filter),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limitNumber);
  const hasNextPage = pageNumber < totalPages;
  const hasPrevPage = pageNumber > 1;

  return {
    expenses,
    pagination: {
      totalCount,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage,
      hasPrevPage,
    },
  };
};

// ───────────────────────────────────────────────
// getExpenseById
// ───────────────────────────────────────────────
const getExpenseById = async (expenseId, userId) => {
  const expense = await Expense.findById(expenseId);

  // Check if expense exists
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  // CRITICAL SECURITY CHECK:
  // Verify this expense belongs to the requesting user.
  // Without this, any logged-in user could read
  // any other user's expense by guessing the ID.
  // expense.user is an ObjectId — convert to string to compare
  if (expense.user.toString() !== userId.toString()) {
    throw new AppError('You do not have permission to access this expense', 403);
  }

  return expense;
};

// ───────────────────────────────────────────────
// updateExpense
// ───────────────────────────────────────────────
const updateExpense = async (expenseId, userId, updateData) => {
  // First verify the expense exists and belongs to this user
  const expense = await getExpenseById(expenseId, userId);

  // Fields the user is NOT allowed to change
  // They cannot change the owner or the source
  delete updateData.user;
  delete updateData.source;

  // Apply updates
  // new: true returns the UPDATED document, not the original
  // runValidators: true runs schema validation on update too
  const updatedExpense = await Expense.findByIdAndUpdate(
    expenseId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedExpense;
};

// ───────────────────────────────────────────────
// deleteExpense
// ───────────────────────────────────────────────
const deleteExpense = async (expenseId, userId) => {
  // Verify ownership before deleting
  await getExpenseById(expenseId, userId);

  await Expense.findByIdAndDelete(expenseId);

  // Return nothing — 204 No Content is the correct
  // HTTP response for successful deletion
  return null;
};

// ───────────────────────────────────────────────
// getExpenseSummary — totals grouped by category
// Used by the dashboard for charts
// ───────────────────────────────────────────────
const getExpenseSummary = async (userId, month, year) => {
  // Build date range for the requested month
  const startDate = new Date(year, month - 1, 1);      // First day of month
  const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

  // MongoDB Aggregation Pipeline
  // Think of it like a series of processing steps
  // Each stage transforms the data for the next stage
  const summary = await Expense.aggregate([
    // Stage 1: Filter — only this user's expenses in this month
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      },
    },

    // Stage 2: Group — total amount per category
    {
      $group: {
        _id: '$category',           // group by category field
        totalAmount: { $sum: '$amount' }, // sum all amounts in group
        count: { $sum: 1 },         // count documents in group
      },
    },

    // Stage 3: Sort — highest spending category first
    {
      $sort: { totalAmount: -1 },
    },

    // Stage 4: Reshape — rename fields for cleaner output
    {
      $project: {
        _id: 0,                    // exclude MongoDB _id
        category: '$_id',          // rename _id to category
        totalAmount: 1,
        count: 1,
      },
    },
  ]);

  // Also calculate the grand total
  const totalSpent = summary.reduce((sum, item) => sum + item.totalAmount, 0);

  return { summary, totalSpent };
};

// Need mongoose for ObjectId in aggregation
const mongoose = require('mongoose');

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
};