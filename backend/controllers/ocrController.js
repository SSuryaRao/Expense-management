const { performOCR } = require('../services/ocrService');

// @desc    Perform OCR on uploaded receipt
// @route   POST /api/ocr
// @access  Private
exports.processReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        // Perform OCR
        const extractedData = await performOCR(filePath, mimeType);

        res.status(200).json(extractedData);
    } catch (error) {
        console.error('OCR Controller Error:', error);
        res.status(500).json({
            message: 'Failed to process receipt',
            error: error.message
        });
    }
};
