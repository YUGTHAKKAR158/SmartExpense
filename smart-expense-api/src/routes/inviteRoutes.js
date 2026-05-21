const express = require('express');
const router  = express.Router();
const {
  inviteFriend, getMyInvites, acceptInvite, declineInvite,
  removeCollaborator, generateShareLink, revokeShareLink,
  getPublicSummary,
} = require('../controllers/inviteController');
const { protect } = require('../middleware/authMiddleware');

// ── Protected routes (need login) ──
router.use(protect);

router.get('/invites',                                    getMyInvites);
router.post('/invites/:groupId/accept',                   acceptInvite);
router.post('/invites/:groupId/decline',                  declineInvite);
router.post('/groups/:id/invite',                         inviteFriend);
router.delete('/groups/:id/collaborators/:collaboratorId', removeCollaborator);
router.post('/groups/:id/share',                          generateShareLink);
router.delete('/groups/:id/share',                        revokeShareLink);

module.exports = router;