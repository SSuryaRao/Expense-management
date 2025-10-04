// server.js
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const connectDB = require('./config/db'); // We'll create this next
const { testGeminiConnection } = require('./services/geminiService');

connectDB();

// Test OpenAI API connection
testGeminiConnection();

const app = require('./app'); // We will move the app logic to app.js for testing

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));