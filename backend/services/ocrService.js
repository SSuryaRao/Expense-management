const { createWorker } = require('tesseract.js');
const PDFParser = require('pdf2json');
const fs = require('fs');
const path = require('path');

/**
 * Perform OCR on an uploaded file (image or PDF)
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} Extracted data
 */
async function performOCR(filePath, mimeType) {
    try {
        let text = '';

        if (mimeType === 'application/pdf') {
            // Handle PDF files
            text = await extractTextFromPDF(filePath);
        } else {
            // Handle image files (JPEG, PNG, etc.)
            text = await extractTextFromImage(filePath);
        }

        console.log('OCR Extracted Text:', text);

        // Parse the extracted text
        const parsed = parseReceiptText(text);

        return parsed;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to perform OCR: ' + error.message);
    }
}

/**
 * Extract text from PDF using pdf2json
 */
async function extractTextFromPDF(filePath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', errData => {
            reject(new Error(errData.parserError));
        });

        pdfParser.on('pdfParser_dataReady', pdfData => {
            try {
                // Extract text from all pages
                let text = '';
                if (pdfData.Pages) {
                    pdfData.Pages.forEach(page => {
                        if (page.Texts) {
                            page.Texts.forEach(textItem => {
                                if (textItem.R) {
                                    textItem.R.forEach(textRun => {
                                        text += decodeURIComponent(textRun.T) + ' ';
                                    });
                                }
                            });
                            text += '\n';
                        }
                    });
                }
                resolve(text.trim());
            } catch (error) {
                reject(error);
            }
        });

        pdfParser.loadPDF(filePath);
    });
}

/**
 * Extract text from image using Tesseract.js
 */
async function extractTextFromImage(filePath) {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
}

/**
 * Parse receipt text to extract structured data
 */
function parseReceiptText(text) {
    // Extract amount - look for patterns like $12.34, 12.34, €12.34
    const amountPattern = /(?:[$€£¥]?\s*)?(\d+[.,]\d{2})/g;
    const amounts = text.match(amountPattern);
    let amount = 0;
    if (amounts && amounts.length > 0) {
        // Take the largest amount (usually the total)
        amount = Math.max(...amounts.map(a => parseFloat(a.replace(/[$€£¥,]/g, ''))));
    }

    // Extract date - look for patterns like 01/02/2024, 2024-01-02
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
    const dateMatch = text.match(datePattern);
    let date = new Date().toISOString().split('T')[0];
    if (dateMatch) {
        try {
            const parsedDate = new Date(dateMatch[0]);
            if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString().split('T')[0];
            }
        } catch (e) {
            // Keep default date
        }
    }

    // Detect currency based on symbols or text
    let currency = 'USD';
    if (text.includes('€') || text.toLowerCase().includes('eur')) currency = 'EUR';
    else if (text.includes('£') || text.toLowerCase().includes('gbp')) currency = 'GBP';
    else if (text.includes('¥') || text.toLowerCase().includes('jpy')) currency = 'JPY';
    else if (text.includes('₹') || text.toLowerCase().includes('inr')) currency = 'INR';

    // Detect category based on keywords
    let category = 'Other';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('restaurant') || lowerText.includes('cafe') || lowerText.includes('food')) {
        category = 'Food';
    } else if (lowerText.includes('hotel') || lowerText.includes('flight') || lowerText.includes('taxi') || lowerText.includes('uber')) {
        category = 'Travel';
    } else if (lowerText.includes('office') || lowerText.includes('supplies') || lowerText.includes('stationery')) {
        category = 'Supplies';
    } else if (lowerText.includes('entertainment') || lowerText.includes('movie') || lowerText.includes('theatre')) {
        category = 'Entertainment';
    }

    // Extract merchant name (usually first few words at the top)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const merchant = lines[0]?.trim() || 'Unknown Merchant';

    return {
        amount: amount || 0,
        currency,
        category,
        description: merchant ? `Receipt from ${merchant}` : '',
        date,
        merchant,
    };
}

module.exports = { performOCR };
