const express = require('express');
const router  = express.Router();
const { getPredictions } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getPredictions);

module.exports = router;