const express = require('express');
const router  = express.Router();
const { getPublicSummary } = require('../controllers/inviteController');

// No auth — public
router.get('/share/:token', getPublicSummary);

module.exports = router;