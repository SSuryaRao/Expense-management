// server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // We'll create this next

dotenv.config();
connectDB();

const app = require('./app'); // We will move the app logic to app.js for testing

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));