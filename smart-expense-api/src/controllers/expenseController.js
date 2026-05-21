// ═══════════════════════════════════════════════
// src/controllers/expenseController.js
// Thin layer — extract, call service, respond
// ═══════════════════════════════════════════════

const expenseService = require('../services/expenseService');
const { sendSuccess } = require('../utils/response');

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    // req.user.id comes from the protect middleware
    const expense = await expenseService.createExpense(req.user.id, req.body);
    sendSuccess(res, { expense }, 'Expense created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses
const getAllExpenses = async (req, res, next) => {
  try {
    // req.query contains URL parameters like:
    // /api/expenses?category=Food&page=2&limit=10
    const result = await expenseService.getAllExpenses(req.user.id, req.query);
    sendSuccess(res, result, 'Expenses fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/:id
const getExpenseById = async (req, res, next) => {
  try {
    // req.params.id is the :id from the URL
    const expense = await expenseService.getExpenseById(req.params.id, req.user.id);
    sendSuccess(res, { expense }, 'Expense fetched successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(
      req.params.id,
      req.user.id,
      req.body
    );
    sendSuccess(res, { expense }, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.user.id);
    // 204 = success with no content to return
    sendSuccess(res, null, 'Expense deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/summary?month=1&year=2024
const getExpenseSummary = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const summary = await expenseService.getExpenseSummary(req.user.id, month, year);
    sendSuccess(res, summary, 'Summary fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
};