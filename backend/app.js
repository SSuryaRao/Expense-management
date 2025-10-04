const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/workflows', require('./routes/workflowRoutes'));
app.use('/api/ocr', require('./routes/ocrRoutes'));

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

module.exports = app;