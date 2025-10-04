const express = require('express');
const router = express.Router();
const {
    createExpense,
    getMyExpenses,
    getPendingApprovals,
    processApprovalAction,
    getAllExpenses
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect); // Protect all routes in this file

// Employee routes
router.route('/my').get(getMyExpenses);
router.route('/').post(upload, createExpense);

// Manager/Admin routes
router.route('/pending').get(authorize('Admin', 'Manager'), getPendingApprovals);
router.route('/:id/action').put(authorize('Admin', 'Manager'), processApprovalAction);

// Admin only routes
router.route('/all').get(authorize('Admin'), getAllExpenses);

module.exports = router;