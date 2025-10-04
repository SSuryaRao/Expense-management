const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Get model from environment variable or use default
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Test connection on startup
async function testGeminiConnection() {
    try {
        const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10
        });
        console.log(`✅ OpenAI API connected successfully (using ${OPENAI_MODEL})`);
        return true;
    } catch (error) {
        console.error('❌ OpenAI API connection failed:', error.message);
        return false;
    }
}

/**
 * Process OCR extracted text using Gemini AI to extract structured expense data
 * @param {string} extractedText - The raw text extracted from OCR
 * @returns {Promise<Object>} Structured expense data with enhanced details
 */
async function processWithGemini(extractedText) {
    try {
        // Create a detailed prompt for Gemini
        const prompt = `You are an expert at analyzing receipt and invoice text. Extract the following information from this receipt text and return it as a JSON object:

Receipt Text:
${extractedText}

Please extract and return ONLY a valid JSON object with these exact fields:
{
  "amount": <number - the total amount/grand total (just the number, no currency symbols)>,
  "currency": "<string - currency code like USD, EUR, GBP, INR, etc.>",
  "category": "<string - one of: Travel, Food, Supplies, Entertainment, Other>",
  "description": "<string - a brief description of the purchase>",
  "date": "<string - date in YYYY-MM-DD format>",
  "merchant": "<string - merchant/vendor name>",
  "items": [<array of items purchased with name and price if available>],
  "paymentMethod": "<string - payment method if mentioned (cash, card, etc.)>",
  "taxAmount": <number - tax amount if mentioned, otherwise 0>,
  "location": "<string - store location/address if mentioned>"
}

Rules:
1. Return ONLY valid JSON, no additional text or markdown
2. For amount, extract the final total/grand total (highest amount is usually the total)
3. For category, choose the most appropriate from: Travel, Food, Supplies, Entertainment, Other
4. For date, convert any date format to YYYY-MM-DD. If no date is found, use today's date
5. For currency, detect from symbols ($=USD, €=EUR, £=GBP, ₹=INR) or text
6. Keep description concise but informative
7. If any field cannot be determined, use reasonable defaults
8. For items array, extract individual line items if visible`;

        console.log(`📡 Calling OpenAI API (${OPENAI_MODEL})...`);
        const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert at analyzing receipts and extracting structured data. Always return valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });
        let text = completion.choices[0].message.content;
        console.log('✅ OpenAI API response received');

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        // Parse the JSON response
        const parsedData = JSON.parse(text);

        // Validate and set defaults for required fields
        const processedData = {
            amount: parsedData.amount || 0,
            currency: parsedData.currency || 'USD',
            category: parsedData.category || 'Other',
            description: parsedData.description || 'Expense from receipt',
            date: parsedData.date || new Date().toISOString().split('T')[0],
            merchant: parsedData.merchant || 'Unknown Merchant',
            items: parsedData.items || [],
            paymentMethod: parsedData.paymentMethod || '',
            taxAmount: parsedData.taxAmount || 0,
            location: parsedData.location || '',
            processedByAI: true
        };

        console.log('✅ Data processed by OpenAI successfully');
        return processedData;
    } catch (error) {
        console.error('❌ OpenAI API Error:', error);
        throw new Error('Failed to process text with OpenAI: ' + error.message);
    }
}

module.exports = { processWithGemini, testGeminiConnection };
