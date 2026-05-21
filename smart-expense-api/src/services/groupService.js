// ═══════════════════════════════════════════════
// src/services/groupService.js
// CRUD operations for groups and group expenses
// ═══════════════════════════════════════════════

const Group        = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const { AppError } = require('../middleware/errorHandler');
const { calculateSettlements } = require('./settlementService');

// ───────────────────────────────────────────────
// createGroup
// ───────────────────────────────────────────────
const createGroup = async (userId, userData, groupData) => {
  const { name, description, tripCategory, members } = groupData;

  // Always add the creator as the first member
  const creatorMember = {
    name: userData.name,
    userId: userId,
    email: userData.email,
  };

  // Build members array — creator first, then others
  // Filter out any duplicate that matches creator's userId
  const otherMembers = (members || []).filter(
    (m) => !m.userId || m.userId.toString() !== userId.toString()
  );

  const allMembers = [creatorMember, ...otherMembers];

  const group = await Group.create({
    createdBy: userId,
    name,
    description,
    tripCategory: tripCategory || 'Travel',
    members: allMembers,
    status: 'active',
    totalAmount: 0,
  });

  return group;
};

// ───────────────────────────────────────────────
// getUserGroups
// Get all groups created by or involving this user
// ───────────────────────────────────────────────
const getUserGroups = async (userId) => {
  // Fetch groups where user is CREATOR or COLLABORATOR
  const groups = await Group.find({
    $or: [
      { createdBy: userId },
      { 'collaborators.userId': userId },
    ],
  }).sort({ createdAt: -1 });

  const groupsWithCount = await Promise.all(
    groups.map(async (group) => {
      const expenseCount = await GroupExpense.countDocuments({
        group: group._id,
      });

      // Tell the frontend whether this user is the creator
      // or a collaborator so UI can show the right badge
      const isCreator = group.createdBy.toString() === userId.toString();

      return {
        ...group.toJSON(),
        expenseCount,
        isCreator,
      };
    })
  );

  return groupsWithCount;
};

// ───────────────────────────────────────────────
// getGroupById
// ───────────────────────────────────────────────
const getGroupById = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const isCreator = group.createdBy.toString() === userId.toString();
  const isCollaborator = group.collaborators?.some(
    (c) => c.userId.toString() === userId.toString()
  );

  if (!isCreator && !isCollaborator) {
    throw new AppError('Access denied', 403);
  }

  return group;
};

// ───────────────────────────────────────────────
// deleteGroup
// ───────────────────────────────────────────────
const deleteGroup = async (groupId, userId) => {
  const group = await getGroupById(groupId, userId);

  // Delete all group expenses first
  await GroupExpense.deleteMany({ group: groupId });

  // Delete the group
  await Group.findByIdAndDelete(groupId);

  return null;
};

// ───────────────────────────────────────────────
// addGroupExpense
// Adds an expense to a group.
// splitAmong contains SELECTED members only.
// ───────────────────────────────────────────────
const addGroupExpense = async (groupId, userId, expenseData) => {
  const group = await getGroupById(groupId, userId);

  if (group.status === 'closed') {
    throw new AppError('Cannot add expenses to a closed group', 400);
  }

  const {
    description, amount, paidByMemberId,
    splitAmongMemberIds, date, notes, category,
  } = expenseData;

  // Find the payer in the group members
  const payerMember = group.members.find(
    (m) => m._id.toString() === paidByMemberId
  );

  if (!payerMember) {
    throw new AppError('Payer is not a member of this group', 400);
  }

  // Find all members who share this expense
  const splitMembers = group.members.filter((m) =>
    splitAmongMemberIds.includes(m._id.toString())
  );

  if (splitMembers.length === 0) {
    throw new AppError('At least one member must be selected for the split', 400);
  }

  // Calculate equal share per selected member
  const shareAmount = Math.round((amount / splitMembers.length) * 100) / 100;

  // Handle rounding — last person pays any remainder
  const totalFromShares = shareAmount * (splitMembers.length - 1);
  const lastPersonShare = Math.round((amount - totalFromShares) * 100) / 100;

  // Build splitAmong array
  const splitAmong = splitMembers.map((member, index) => ({
    memberId:   member._id,
    memberName: member.name,
    userId:     member.userId || null,
    shareAmount: index === splitMembers.length - 1
      ? lastPersonShare
      : shareAmount,
  }));

  // Create the group expense
  const expense = await GroupExpense.create({
    group:            groupId,
    description,
    amount,
    paidByMemberId:   payerMember._id,
    paidByMemberName: payerMember.name,
    paidByUserId:     payerMember.userId || null,
    splitAmong,
    splitType:        'equal',
    date:             date || new Date(),
    category:         category || group.tripCategory,
    notes:            notes || '',
  });

  // Update group total
  group.totalAmount = (group.totalAmount || 0) + amount;
  await group.save();

  return expense;
};

// ───────────────────────────────────────────────
// deleteGroupExpense
// ───────────────────────────────────────────────
const deleteGroupExpense = async (groupId, expenseId, userId) => {
  const group = await getGroupById(groupId, userId);

  if (group.status === 'closed') {
    throw new AppError('Cannot modify a closed group', 400);
  }

  const expense = await GroupExpense.findOne({
    _id: groupId,
    group: groupId,
  });

  const expenseToDelete = await GroupExpense.findById(expenseId);

  if (!expenseToDelete || expenseToDelete.group.toString() !== groupId) {
    throw new AppError('Expense not found in this group', 404);
  }

  // Reduce group total
  group.totalAmount = Math.max(0, (group.totalAmount || 0) - expenseToDelete.amount);
  await group.save();

  await GroupExpense.findByIdAndDelete(expenseId);

  return null;
};

// ───────────────────────────────────────────────
// updateMembers
// ───────────────────────────────────────────────
const updateMember = async (groupId, memberId, userId, memberData) => {
  const group = await getGroupById(groupId, userId);

  if (group.status === 'closed') {
    throw new AppError('Cannot modify a closed group', 400);
  }

  const member = group.members.id(memberId);
  if (!member) throw new AppError('Member not found', 404);

  if (memberData.name) member.name = memberData.name.trim();
  if (memberData.email !== undefined) member.email = memberData.email.trim();

  await group.save();
  return group;
};

// ───────────────────────────────────────────────
// addMembers
// ───────────────────────────────────────────────
const addMember = async (groupId, userId, memberData) => {
  const group = await getGroupById(groupId, userId);

  if (group.status === 'closed') {
    throw new AppError('Cannot add members to a closed group', 400);
  }

  if (!memberData.name || !memberData.name.trim()) {
    throw new AppError('Member name is required', 400);
  }

  // Check duplicate name
  const exists = group.members.find(
    (m) => m.name.toLowerCase() === memberData.name.trim().toLowerCase()
  );
  if (exists) throw new AppError('A member with this name already exists', 400);

  group.members.push({
    name: memberData.name.trim(),
    email: memberData.email?.trim() || '',
    userId: null,
  });

  await group.save();
  return group;
};

// ───────────────────────────────────────────────
// deleteMembers
// ───────────────────────────────────────────────
const deleteMember = async (groupId, memberId, userId) => {
  const group = await getGroupById(groupId, userId);

  if (group.status === 'closed') {
    throw new AppError('Cannot modify a closed group', 400);
  }

  // Prevent deleting creator (first member)
  const member = group.members.id(memberId);
  if (!member) throw new AppError('Member not found', 404);

  if (member.userId && member.userId.toString() === userId.toString()) {
    throw new AppError('You cannot remove yourself as the creator', 400);
  }

  // Check if member is involved in any expense
  const GroupExpense = require('../models/GroupExpense');
  const involvedExpense = await GroupExpense.findOne({
    group: groupId,
    $or: [
      { paidByMemberId: memberId },
      { 'splitAmong.memberId': memberId },
    ],
  });

  if (involvedExpense) {
    throw new AppError(
      'Cannot remove this member — they are part of one or more expenses', 400
    );
  }

  group.members.pull(memberId);
  await group.save();
  return group;
};

// ───────────────────────────────────────────────
// UpdateGroupExpense
// ───────────────────────────────────────────────

const updateGroupExpense = async (groupId, expenseId, userId, expenseData) => {
  const group = await getGroupById(groupId, userId);

  if (group.status === 'closed') {
    throw new AppError('Cannot modify a closed group', 400);
  }

  const expense = await GroupExpense.findById(expenseId);
  if (!expense || expense.group.toString() !== groupId) {
    throw new AppError('Expense not found in this group', 404);
  }

  const {
    description, amount, paidByMemberId,
    splitAmongMemberIds, date, notes,
  } = expenseData;

  // Update basic fields
  if (description) expense.description = description;
  if (date) expense.date = date;
  if (notes !== undefined) expense.notes = notes;

  // If amount or split members changed, recalculate
  if (amount || splitAmongMemberIds) {
    const newAmount = amount || expense.amount;
    const newSplitIds = splitAmongMemberIds || 
      expense.splitAmong.map((s) => s.memberId.toString());

    const splitMembers = group.members.filter((m) =>
      newSplitIds.includes(m._id.toString())
    );

    if (splitMembers.length === 0) {
      throw new AppError('At least one member must be selected', 400);
    }

    const shareAmount = Math.round((newAmount / splitMembers.length) * 100) / 100;
    const totalFromShares = shareAmount * (splitMembers.length - 1);
    const lastPersonShare = Math.round((newAmount - totalFromShares) * 100) / 100;

    expense.amount = newAmount;
    expense.splitAmong = splitMembers.map((member, index) => ({
      memberId: member._id,
      memberName: member.name,
      userId: member.userId || null,
      shareAmount: index === splitMembers.length - 1
        ? lastPersonShare
        : shareAmount,
    }));

    // Update group total
    const oldAmount = expense.amount;
    group.totalAmount = Math.max(0, (group.totalAmount || 0) - oldAmount + newAmount);
    await group.save();
  }

  // Update payer if changed
  if (paidByMemberId) {
    const payerMember = group.members.find(
      (m) => m._id.toString() === paidByMemberId
    );
    if (!payerMember) throw new AppError('Payer not found in group', 400);
    expense.paidByMemberId = payerMember._id;
    expense.paidByMemberName = payerMember.name;
    expense.paidByUserId = payerMember.userId || null;
  }

  await expense.save();
  return expense;
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  deleteGroup,
  addGroupExpense,
  deleteGroupExpense,
  updateMember,
  updateGroupExpense,
  addMember, deleteMember,
};