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

        // Add metadata about processing
        const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const response = {
            ...extractedData,
            metadata: {
                processedByAI: extractedData.processedByAI || false,
                processingMethod: extractedData.processedByAI ? `OpenAI ${modelName}` : 'Regex Parsing'
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('OCR Controller Error:', error);
        res.status(500).json({
            message: 'Failed to process receipt',
            error: error.message
        });
    }
};
