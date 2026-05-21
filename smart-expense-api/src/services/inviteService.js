// ═══════════════════════════════════════════════
// src/services/inviteService.js
//
// Handles:
// 1. Sending invite to a registered user by email
// 2. Accepting an invite (friend joins group)
// 3. Removing a collaborator
// 4. Generating / revoking public share links
// ═══════════════════════════════════════════════

const crypto  = require('crypto');
const Group   = require('../models/Group');
const User    = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// ─────────────────────────────────────────────
// Helper — check if requesting user can access group
// Either creator OR accepted collaborator
// ─────────────────────────────────────────────
const assertAccess = (group, userId) => {
  const isCreator = group.createdBy.toString() === userId.toString();
  const isCollaborator = group.collaborators.some(
    (c) => c.userId.toString() === userId.toString()
  );
  if (!isCreator && !isCollaborator) {
    throw new AppError('You do not have access to this group', 403);
  }
};

// ─────────────────────────────────────────────
// inviteFriend
// Creator sends invite to a friend's email
// If the friend has an account → invite stored
// Friend will see it when they hit "My Invites"
// ─────────────────────────────────────────────
const inviteFriend = async (groupId, requestingUserId, email) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  // Only creator can send invites
  if (group.createdBy.toString() !== requestingUserId.toString()) {
    throw new AppError('Only the group creator can send invites', 403);
  }

  if (group.status === 'closed') {
    throw new AppError('Cannot invite to a closed group', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Cannot invite yourself
  const creator = await User.findById(requestingUserId);
  if (creator.email === normalizedEmail) {
    throw new AppError('You cannot invite yourself', 400);
  }

  // Check if already invited or already a collaborator
  const alreadyInvited = group.invites.some(
    (i) => i.email === normalizedEmail
  );
  const alreadyCollaborator = group.collaborators.some(
    (c) => c.email === normalizedEmail
  );

  if (alreadyInvited || alreadyCollaborator) {
    throw new AppError('This person has already been invited or has access', 400);
  }

  // Check if the email belongs to a registered user
  const invitedUser = await User.findOne({ email: normalizedEmail });
  if (!invitedUser) {
    throw new AppError(
      'No account found with this email. They need to register first.',
      404
    );
  }

  // Add invite
  group.invites.push({ email: normalizedEmail, status: 'pending' });
  await group.save();

  return {
    message: `Invite sent to ${normalizedEmail}`,
    invitedUserName: invitedUser.name,
  };
};

// ─────────────────────────────────────────────
// getMyInvites
// Logged-in user fetches all pending invites for them
// ─────────────────────────────────────────────
const getMyInvites = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Find all groups where this user's email has a pending invite
  const groups = await Group.find({
    'invites.email': user.email,
    'invites.status': 'pending',
  }).select('name description tripCategory members createdBy createdAt');

  // Populate creator info manually
  const invites = await Promise.all(
    groups.map(async (group) => {
      const creator = await User.findById(group.createdBy).select('name email');
      const invite  = (group.invites || []).find(
        (i) => i.email === user.email && i.status === 'pending'
      );
      return {
        groupId:      group._id,
        groupName:    group.name,
        description:  group.description,
        tripCategory: group.tripCategory,
        memberCount:  group.members.length,
        createdBy:    creator?.name || 'Unknown',
        invitedAt:    invite?.invitedAt,
      };
    })
  );

  return invites;
};

// ─────────────────────────────────────────────
// acceptInvite
// Logged-in user accepts an invite to a group
// They become a collaborator with full access
// ─────────────────────────────────────────────
const acceptInvite = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Find the invite for this user
  const invite = group.invites.find(
    (i) => i.email === user.email && i.status === 'pending'
  );

  if (!invite) {
    throw new AppError('No pending invite found for your account', 404);
  }

  // Mark invite as accepted
  invite.status = 'accepted';

  // Add as collaborator
  group.collaborators.push({
    userId:   user._id,
    name:     user.name,
    email:    user.email,
    joinedAt: new Date(),
  });

  // Also add as a group member if not already there
  const alreadyMember = group.members.some(
    (m) => m.email === user.email || 
    (m.userId && m.userId.toString() === userId.toString())
  );

  if (!alreadyMember) {
    group.members.push({
      name:   user.name,
      userId: user._id,
      email:  user.email,
    });
  }

  await group.save();

  return { message: `You now have full access to "${group.name}"`, group };
};

// ─────────────────────────────────────────────
// declineInvite
// User declines an invite — removes it from list
// ─────────────────────────────────────────────
const declineInvite = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const user = await User.findById(userId);

  const inviteIndex = group.invites.findIndex(
    (i) => i.email === user.email && i.status === 'pending'
  );

  if (inviteIndex === -1) {
    throw new AppError('No pending invite found', 404);
  }

  group.invites.splice(inviteIndex, 1);
  await group.save();

  return { message: 'Invite declined' };
};

// ─────────────────────────────────────────────
// removeCollaborator
// Creator removes a collaborator's access
// ─────────────────────────────────────────────
const removeCollaborator = async (groupId, collaboratorId, requestingUserId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  if (group.createdBy.toString() !== requestingUserId.toString()) {
    throw new AppError('Only the creator can remove collaborators', 403);
  }

  const collabIndex = group.collaborators.findIndex(
    (c) => c.userId.toString() === collaboratorId
  );

  if (collabIndex === -1) throw new AppError('Collaborator not found', 404);

  // Remove from collaborators
  group.collaborators.splice(collabIndex, 1);

  // Also revert their invite to pending so they can be re-invited
  const collab = group.collaborators[collabIndex];
  if (collab) {
    const invite = group.invites.find((i) => i.email === collab.email);
    if (invite) invite.status = 'pending';
  }

  await group.save();
  return { message: 'Collaborator removed successfully' };
};

// ─────────────────────────────────────────────
// generateShareLink
// Creates a unique token for public read-only access
// ─────────────────────────────────────────────
const generateShareLink = async (groupId, requestingUserId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  if (group.createdBy.toString() !== requestingUserId.toString()) {
    throw new AppError('Only the creator can generate share links', 403);
  }

  // Generate a cryptographically random token
  const shareToken = crypto.randomBytes(32).toString('hex');

  group.shareToken   = shareToken;
  group.shareEnabled = true;
  await group.save();

  return { shareToken, shareEnabled: true };
};

// ─────────────────────────────────────────────
// revokeShareLink
// Disables the public share link
// ─────────────────────────────────────────────
const revokeShareLink = async (groupId, requestingUserId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  if (group.createdBy.toString() !== requestingUserId.toString()) {
    throw new AppError('Only the creator can revoke share links', 403);
  }

  group.shareToken   = null;
  group.shareEnabled = false;
  await group.save();

  return { message: 'Share link revoked' };
};

// ─────────────────────────────────────────────
// getPublicGroupSummary
// No auth needed — uses shareToken to fetch
// read-only group data + all member summaries
// ─────────────────────────────────────────────
const getPublicGroupSummary = async (shareToken) => {
  const group = await Group.findOne({
    shareToken,
    shareEnabled: true,
  });

  if (!group) {
    throw new AppError('Invalid or expired share link', 404);
  }

  const GroupExpense       = require('../models/GroupExpense');
  const { calculateSettlements } = require('./settlementService');

  const expenses = await GroupExpense.find({ group: group._id })
    .sort({ date: -1 });

  const { settlements, netBalances } = calculateSettlements(
    group.members,
    expenses
  );

  // Build per-member summary
  const memberSummaries = group.members.map((member) => {
    const memberId = member._id.toString();

    const involvedExpenses = expenses.filter((e) =>
      e.splitAmong.some((s) => s.memberId.toString() === memberId)
    );

    const paidExpenses = expenses.filter(
      (e) => e.paidByMemberId.toString() === memberId
    );

    const totalPaid = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOwed = involvedExpenses.reduce((sum, e) => {
      const share = e.splitAmong.find(
        (s) => s.memberId.toString() === memberId
      );
      return sum + (share?.shareAmount || 0);
    }, 0);

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
        myNetOnThisExpense: iPaid
          ? Math.round((expense.amount - (myShare?.shareAmount || 0)) * 100) / 100
          : -(myShare?.shareAmount || 0),
        splitAmong:  expense.splitAmong,
        splitCount:  expense.splitAmong.length,
      };
    });

    const netBalance = netBalances.find(
      (b) => b.memberId.toString() === memberId
    );

    return {
      member,
      totalPaid:     Math.round(totalPaid * 100) / 100,
      totalOwed:     Math.round(totalOwed * 100) / 100,
      netBalance:    netBalance?.balance || 0,
      paidCount:     paidExpenses.length,
      involvedCount: involvedExpenses.length,
      expenseBreakdown,
    };
  });

  return {
    group: {
      _id:          group._id,
      name:         group.name,
      description:  group.description,
      tripCategory: group.tripCategory,
      totalAmount:  group.totalAmount,
      status:       group.status,
      members:      group.members,
      createdAt:    group.createdAt,
    },
    expenses,
    settlements,
    netBalances,
    memberSummaries,
  };
};

module.exports = {
  inviteFriend,
  getMyInvites,
  acceptInvite,
  declineInvite,
  removeCollaborator,
  generateShareLink,
  revokeShareLink,
  getPublicGroupSummary,
};