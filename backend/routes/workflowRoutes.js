const express = require('express');
const router = express.Router();
const { createWorkflow, getWorkflows } = require('../controllers/workflowController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and for Admins only
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .post(createWorkflow)
    .get(getWorkflows);

module.exports = router;