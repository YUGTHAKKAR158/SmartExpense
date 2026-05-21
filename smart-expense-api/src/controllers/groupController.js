// ═══════════════════════════════════════════════
// src/controllers/groupController.js
// ═══════════════════════════════════════════════

const groupService      = require('../services/groupService');
const settlementService = require('../services/settlementService');
const { sendSuccess }   = require('../utils/response');

// GET /api/groups
const getGroups = async (req, res, next) => {
  try {
    const groups = await groupService.getUserGroups(req.user.id);
    sendSuccess(res, { groups }, 'Groups fetched successfully');
  } catch (error) { next(error); }
};

// POST /api/groups
const createGroup = async (req, res, next) => {
  try {
    const group = await groupService.createGroup(
      req.user.id,
      req.user,        // pass user info for creator member
      req.body
    );
    sendSuccess(res, { group }, 'Group created successfully', 201);
  } catch (error) { next(error); }
};

// GET /api/groups/:id
const getGroup = async (req, res, next) => {
  try {
    const data = await settlementService.getGroupWithSettlements(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, data, 'Group fetched successfully');
  } catch (error) { next(error); }
};

// DELETE /api/groups/:id
const deleteGroup = async (req, res, next) => {
  try {
    await groupService.deleteGroup(req.params.id, req.user.id);
    sendSuccess(res, null, 'Group deleted successfully');
  } catch (error) { next(error); }
};

// POST /api/groups/:id/expenses
const addExpense = async (req, res, next) => {
  try {
    const expense = await groupService.addGroupExpense(
      req.params.id,
      req.user.id,
      req.body
    );
    sendSuccess(res, { expense }, 'Expense added successfully', 201);
  } catch (error) { next(error); }
};

// DELETE /api/groups/:id/expenses/:expenseId
const deleteExpense = async (req, res, next) => {
  try {
    await groupService.deleteGroupExpense(
      req.params.id,
      req.params.expenseId,
      req.user.id
    );
    sendSuccess(res, null, 'Expense deleted successfully');
  } catch (error) { next(error); }
};

// POST /api/groups/:id/close
// Closes group + auto-adds user's share to expenses
const closeGroup = async (req, res, next) => {
  try {
    const result = await settlementService.closeGroupAndExportExpenses(
      req.params.id,
      req.user.id
    );
    sendSuccess(
      res,
      result,
      result.createdExpense
        ? `Group closed. ₹${result.userTotalShare} added to your expenses under ${result.group.tripCategory}.`
        : 'Group closed. You had no share in this group.',
    );
  } catch (error) { next(error); }
};

// PATCH /api/groups/:id/members/:memberId
const updateMember = async (req, res, next) => {
  try {
    const group = await groupService.updateMember(
      req.params.id,
      req.params.memberId,
      req.user.id,
      req.body
    );
    sendSuccess(res, { group }, 'Member updated successfully');
  } catch (error) { next(error); }
};

// PATCH /api/groups/:id/expenses/:expenseId
const updateExpense = async (req, res, next) => {
  try {
    const expense = await groupService.updateGroupExpense(
      req.params.id,
      req.params.expenseId,
      req.user.id,
      req.body
    );
    sendSuccess(res, { expense }, 'Expense updated successfully');
  } catch (error) { next(error); }
};

// POST /api/groups/:id/members
const addMember = async (req, res, next) => {
  try {
    const group = await groupService.addMember(
      req.params.id,
      req.user.id,
      req.body
    );
    sendSuccess(res, { group }, 'Member added successfully', 201);
  } catch (error) { next(error); }
};

// DELETE /api/groups/:id/members/:memberId
const deleteMember = async (req, res, next) => {
  try {
    const group = await groupService.deleteMember(
      req.params.id,
      req.params.memberId,
      req.user.id
    );
    sendSuccess(res, { group }, 'Member removed successfully');
  } catch (error) { next(error); }
};

// GET /api/groups/:id/members/:memberId/summary
const getMemberSummary = async (req, res, next) => {
  try {
    const summary = await settlementService.getMemberSummary(
      req.params.id,
      req.params.memberId,
      req.user.id
    );
    sendSuccess(res, summary, 'Member summary fetched successfully');
  } catch (error) { next(error); }
};

module.exports = {
  getGroups, createGroup, getGroup,
  deleteGroup, addExpense, deleteExpense, 
  closeGroup, updateMember, updateExpense,
  addMember, deleteMember, getMemberSummary,
};