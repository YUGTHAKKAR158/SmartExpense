// ═══════════════════════════════════════════════
// src/routes/receiptRoutes.js
// POST /api/receipts/scan — OCR a receipt image
// ═══════════════════════════════════════════════

const router  = require('express').Router();
const multer  = require('multer');
const { protect }     = require('../middleware/authMiddleware');
const { scanReceipt } = require('../controllers/receiptController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// POST /api/receipts/scan
router.post('/scan', protect, upload.single('receipt'), scanReceipt);

module.exports = router;
