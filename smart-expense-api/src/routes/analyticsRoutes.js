const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/dashboard', getDashboard);

module.exports = router;