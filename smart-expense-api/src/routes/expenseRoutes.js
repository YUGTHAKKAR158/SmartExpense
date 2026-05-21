// ═══════════════════════════════════════════════
// src/routes/expenseRoutes.js
// All routes protected — user must be logged in
// ═══════════════════════════════════════════════

const express = require('express');
const router = express.Router();

const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require('../controllers/expenseController');

const { protect } = require('../middleware/authMiddleware');

const {
  validateCreateExpense,
  validateUpdateExpense,
} = require('../middleware/validators');

// Apply protect to ALL routes in this router
// Instead of adding protect to every single route,
// router.use() applies it to everything below
router.use(protect);

// Summary route MUST come before /:id routes
// Otherwise Express matches 'summary' as an :id
router.get('/summary', getExpenseSummary);

// Standard CRUD routes
router.get('/', getAllExpenses);
router.post('/', validateCreateExpense, createExpense);

router.get('/:id', getExpenseById);
router.put('/:id', validateUpdateExpense, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;