// ═══════════════════════════════════════════════
// src/controllers/budgetController.js
// Thin layer — extract, call service, respond
// ═══════════════════════════════════════════════

const budgetService = require('../services/budgetService');
const { sendSuccess } = require('../utils/response');

// GET /api/budgets?month=5&year=2026
const getBudget = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const data = await budgetService.getBudgetWithSpending(
      req.user.id, month, year
    );

    sendSuccess(res, data, 'Budget fetched successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/budgets
const updateBudget = async (req, res, next) => {
  try {
    const month = parseInt(req.body.month) || new Date().getMonth() + 1;
    const year = parseInt(req.body.year) || new Date().getFullYear();

    const budget = await budgetService.updateBudget(
      req.user.id,
      month,
      year,
      req.body
    );

    sendSuccess(res, { budget }, 'Budget updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudget, updateBudget };