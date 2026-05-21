const express = require('express');
const router = express.Router();
const { getInsights } = require('../controllers/insightsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getInsights);

module.exports = router;