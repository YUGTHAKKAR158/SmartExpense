// ═══════════════════════════════════════════════
// src/services/settlementService.js
//
// The debt settlement algorithm.
//
// PROBLEM: Given N people with various debts,
// find the MINIMUM number of transactions to
// settle all debts.
//
// ALGORITHM: Greedy approach
// 1. Calculate net balance for each person
//    (total paid - total owed)
// 2. Separate into creditors (+) and debtors (-)
// 3. Greedily match largest debtor with largest creditor
// 4. Repeat until all balances are zero
// ═══════════════════════════════════════════════

const Group       = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const Expense     = require('../models/Expense');
const { AppError } = require('../middleware/errorHandler');

// ───────────────────────────────────────────────
// calculateSettlements
// Core algorithm — takes group expenses and returns
// minimum transactions to settle all debts
// ───────────────────────────────────────────────
const calculateSettlements = (members, groupExpenses) => {
  // Step 1: Calculate net balance for each member
  // Positive = they are owed money (creditor)
  // Negative = they owe money (debtor)
  const balances = {};

  // Initialize all members with 0 balance
  members.forEach((member) => {
    balances[member._id.toString()] = {
      memberId: member._id,
      memberName: member.name,
      userId: member.userId,
      balance: 0,
    };
  });

  // Process each expense
  groupExpenses.forEach((expense) => {
    const payerId = expense.paidByMemberId.toString();

    // Payer gets credited the full amount
    if (balances[payerId]) {
      balances[payerId].balance += expense.amount;
    }

    // Each person in splitAmong gets debited their share
    expense.splitAmong.forEach((share) => {
      const memberId = share.memberId.toString();
      if (balances[memberId]) {
        balances[memberId].balance -= share.shareAmount;
      }
    });
  });

  // Step 2: Separate into creditors and debtors
  // Round to 2 decimal places to avoid floating point issues
  const creditors = []; // people who are owed money
  const debtors   = []; // people who owe money

  Object.values(balances).forEach((person) => {
    const roundedBalance = Math.round(person.balance * 100) / 100;

    if (roundedBalance > 0.01) {
      creditors.push({ ...person, balance: roundedBalance });
    } else if (roundedBalance < -0.01) {
      debtors.push({ ...person, balance: Math.abs(roundedBalance) });
    }
  });

  // Step 3: Greedy algorithm — match largest debtor
  // with largest creditor each iteration
  const settlements = [];

  // Sort both arrays descending by amount
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  let i = 0; // creditor pointer
  let j = 0; // debtor pointer

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor   = debtors[j];

    // The settlement amount is the minimum of what
    // the debtor owes and what the creditor is owed
    // (one of them will be fully settled in this transaction)
    const amount = Math.min(creditor.balance, debtor.balance);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0.01) {
      settlements.push({
        from: {
          memberId:   debtor.memberId,
          memberName: debtor.memberName,
          userId:     debtor.userId,
        },
        to: {
          memberId:   creditor.memberId,
          memberName: creditor.memberName,
          userId:     creditor.userId,
        },
        amount: roundedAmount,
        isPaid: false,
      });
    }

    // Reduce balances by the settled amount
    creditor.balance -= amount;
    debtor.balance   -= amount;

    // Move pointer if this person is fully settled
    if (creditor.balance < 0.01) i++;
    if (debtor.balance   < 0.01) j++;
  }

  // Return net balances + settlements
  const netBalances = Object.values(balances).map((person) => ({
    ...person,
    balance: Math.round(person.balance * 100) / 100,
  }));

  return { settlements, netBalances };
};

// ───────────────────────────────────────────────
// getGroupWithSettlements
// Fetches a group + all its expenses + calculates
// settlements in one call
// ───────────────────────────────────────────────
const getGroupWithSettlements = async (groupId, userId) => {
  const group = await Group.findById(groupId);

  if (!group) throw new AppError('Group not found', 404);

  // Verify requesting user is the creator
  const isCreator = group.createdBy.toString() === userId.toString();
  const isCollaborator = group.collaborators?.some(
    (c) => c.userId.toString() === userId.toString()
  );
  if (!isCreator && !isCollaborator) {
    throw new AppError('You do not have access to this group', 403);
  }

  const expenses = await GroupExpense.find({ group: groupId })
    .sort({ date: -1 });

  const { settlements, netBalances } = calculateSettlements(
    group.members,
    expenses
  );

  return { group, 
           expenses, 
           settlements, 
           netBalances, 
           isCreator: group.createdBy.toString() === userId.toString(), };
};

// ───────────────────────────────────────────────
// getMemberSummary
// Fetches a group + all its expenses + calculates
// Summary in one call
// ───────────────────────────────────────────────
const getMemberSummary = async (groupId, memberId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const isCreator = group.createdBy.toString() === userId.toString();
  const isCollaborator = group.collaborators?.some(
    (c) => c.userId.toString() === userId.toString()
  );
  if (!isCreator && !isCollaborator) {
    throw new AppError('Access denied', 403);
  }

  const member = group.members.id(memberId);
  if (!member) throw new AppError('Member not found', 404);

  const expenses = await GroupExpense.find({ group: groupId }).sort({ date: -1 });

  // Expenses this member PAID FOR
  const paidExpenses = expenses.filter(
    (e) => e.paidByMemberId.toString() === memberId
  );

  // Expenses this member is PART OF (split among)
  const involvedExpenses = expenses.filter((e) =>
    e.splitAmong.some((s) => s.memberId.toString() === memberId)
  );

  // Expenses this member paid but others owe them for
  const totalPaid = paidExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Total this member owes across all expenses
  const totalOwed = involvedExpenses.reduce((sum, e) => {
    const share = e.splitAmong.find(
      (s) => s.memberId.toString() === memberId
    );
    return sum + (share?.shareAmount || 0);
  }, 0);

  // Net = paid - owed
  // Positive = others owe them
  // Negative = they owe others
  const netBalance = Math.round((totalPaid - totalOwed) * 100) / 100;

  // Build detailed breakdown per expense they are involved in
  const expenseBreakdown = involvedExpenses.map((expense) => {
    const myShare = expense.splitAmong.find(
      (s) => s.memberId.toString() === memberId
    );
    const iPaid = expense.paidByMemberId.toString() === memberId;

    return {
      expenseId:        expense._id,
      description:      expense.description,
      date:             expense.date,
      totalAmount:      expense.amount,
      paidByMemberName: expense.paidByMemberName,
      iPaid,
      myShare:          myShare?.shareAmount || 0,
      // If I paid — others owe me (total - my share)
      // If I didn't pay — I owe the payer my share
      myNetOnThisExpense: iPaid
        ? Math.round((expense.amount - (myShare?.shareAmount || 0)) * 100) / 100
        : -(myShare?.shareAmount || 0),
      splitAmong: expense.splitAmong,
      splitCount: expense.splitAmong.length,
    };
  });

  return {
    member,
    totalPaid:        Math.round(totalPaid * 100) / 100,
    totalOwed:        Math.round(totalOwed * 100) / 100,
    netBalance,
    paidCount:        paidExpenses.length,
    involvedCount:    involvedExpenses.length,
    expenseBreakdown,
  };
};

// ───────────────────────────────────────────────
// closeGroupAndExportExpenses
//
// When a group is "closed":
// 1. Calculate final settlements
// 2. Find what the current user owes/paid
// 3. Add their NET expense to their personal
//    Expense tracker under the group's tripCategory
// ───────────────────────────────────────────────
const closeGroupAndExportExpenses = async (groupId, userId) => {
  const { group, expenses, netBalances } = await getGroupWithSettlements(
    groupId, userId
  );

  if (group.status === 'closed') {
    throw new AppError('Group is already closed', 400);
  }

  // Find the current user's member entry in the group
  const userMember = group.members.find(
    (m) => m.userId && m.userId.toString() === userId.toString()
  );

  if (!userMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  // Find the user's net balance
  const userBalance = netBalances.find(
    (b) => b.memberId.toString() === userMember._id.toString()
  );

  // Calculate user's total share across all expenses
  // (what they were supposed to pay, regardless of who paid)
  let userTotalShare = 0;

  expenses.forEach((expense) => {
    const userShare = expense.splitAmong.find(
      (s) => s.memberId.toString() === userMember._id.toString()
    );
    if (userShare) {
      userTotalShare += userShare.shareAmount;
    }
  });

  // Only create expense record if user had some share
  let createdExpense = null;

  if (userTotalShare > 0) {
    // Create expense in user's personal expense tracker
    createdExpense = await Expense.create({
      user: userId,
      amount: Math.round(userTotalShare * 100) / 100,
      category: group.tripCategory, // e.g. 'Travel'
      description: `${group.name} — Group expenses`,
      date: group.closedAt || new Date(),
      paymentMethod: 'UPI',
      notes: `Auto-added from group "${group.name}". Your share of ₹${userTotalShare.toFixed(2)} across ${expenses.length} group expense(s).`,
      source: 'manual',
    });
  }

  // Mark group as closed
  group.status   = 'closed';
  group.closedAt = new Date();
  await group.save();

  return {
    group,
    userTotalShare,
    createdExpense,
    netBalance: userBalance?.balance || 0,
  };
};

module.exports = {
  calculateSettlements,
  getGroupWithSettlements,
  closeGroupAndExportExpenses,
  getMemberSummary,
};