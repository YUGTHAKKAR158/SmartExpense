const express = require('express');
const router  = express.Router();
const { getReportSummary, downloadCSV, downloadPDF } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getReportSummary);
router.get('/csv',     downloadCSV);
router.get('/pdf',     downloadPDF);

module.exports = router;