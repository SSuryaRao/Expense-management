const express = require('express');
const router = express.Router();
const { processReceipt } = require('../controllers/ocrController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// POST /api/ocr - Process receipt with OCR
router.post('/', protect, upload, processReceipt);

module.exports = router;
