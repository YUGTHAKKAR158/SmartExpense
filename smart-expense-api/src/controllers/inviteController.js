const inviteService   = require('../services/inviteService');
const { sendSuccess } = require('../utils/response');

// POST /api/groups/:id/invite
const inviteFriend = async (req, res, next) => {
  try {
    const result = await inviteService.inviteFriend(
      req.params.id, req.user.id, req.body.email
    );
    sendSuccess(res, result, result.message, 201);
  } catch (error) { next(error); }
};

// GET /api/invites
const getMyInvites = async (req, res, next) => {
  try {
    const invites = await inviteService.getMyInvites(req.user.id);
    sendSuccess(res, { invites }, 'Invites fetched successfully');
  } catch (error) { next(error); }
};

// POST /api/invites/:groupId/accept
const acceptInvite = async (req, res, next) => {
  try {
    const result = await inviteService.acceptInvite(
      req.params.groupId, req.user.id
    );
    sendSuccess(res, result, result.message);
  } catch (error) { next(error); }
};

// POST /api/invites/:groupId/decline
const declineInvite = async (req, res, next) => {
  try {
    const result = await inviteService.declineInvite(
      req.params.groupId, req.user.id
    );
    sendSuccess(res, result, result.message);
  } catch (error) { next(error); }
};

// DELETE /api/groups/:id/collaborators/:collaboratorId
const removeCollaborator = async (req, res, next) => {
  try {
    const result = await inviteService.removeCollaborator(
      req.params.id, req.params.collaboratorId, req.user.id
    );
    sendSuccess(res, result, result.message);
  } catch (error) { next(error); }
};

// POST /api/groups/:id/share
const generateShareLink = async (req, res, next) => {
  try {
    const result = await inviteService.generateShareLink(
      req.params.id, req.user.id
    );
    sendSuccess(res, result, 'Share link generated');
  } catch (error) { next(error); }
};

// DELETE /api/groups/:id/share
const revokeShareLink = async (req, res, next) => {
  try {
    const result = await inviteService.revokeShareLink(
      req.params.id, req.user.id
    );
    sendSuccess(res, result, result.message);
  } catch (error) { next(error); }
};

// GET /api/share/:token  (no auth)
const getPublicSummary = async (req, res, next) => {
  try {
    const data = await inviteService.getPublicGroupSummary(req.params.token);
    sendSuccess(res, data, 'Group summary fetched');
  } catch (error) { next(error); }
};

module.exports = {
  inviteFriend, getMyInvites, acceptInvite, declineInvite,
  removeCollaborator, generateShareLink, revokeShareLink,
  getPublicSummary,
};