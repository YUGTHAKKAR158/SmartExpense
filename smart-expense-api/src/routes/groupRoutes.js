const express  = require('express');
const router   = express.Router();
const {
  getGroups, createGroup, getGroup,
  deleteGroup, addExpense, deleteExpense, 
  closeGroup, updateMember, updateExpense,
  addMember, deleteMember, getMemberSummary,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Group CRUD
router.get('/',    getGroups);
router.post('/',   createGroup);
router.get('/:id', getGroup);
router.delete('/:id', deleteGroup);

// Group expenses
router.post('/:id/expenses',                  addExpense);
router.delete('/:id/expenses/:expenseId',     deleteExpense);

// Close group + export to expenses
router.post('/:id/close', closeGroup);

// Update members + Update expenses
router.patch('/:id/members/:memberId', updateMember);
router.patch('/:id/expenses/:expenseId', updateExpense);

// Add/Delete members
router.post('/:id/members',              addMember);
router.delete('/:id/members/:memberId',  deleteMember);

// Get members summary
router.get('/:id/members/:memberId/summary', getMemberSummary);

module.exports = router;