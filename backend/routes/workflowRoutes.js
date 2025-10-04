const express = require('express');
const router = express.Router();
const {
    createWorkflow,
    getWorkflows,
    getWorkflowById,
    updateWorkflow,
    deleteWorkflow,
    getCompanyUsers
} = require('../controllers/workflowController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and for Admins only
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .post(createWorkflow)
    .get(getWorkflows);

router.route('/users/all')
    .get(getCompanyUsers);

router.route('/:id')
    .get(getWorkflowById)
    .put(updateWorkflow)
    .delete(deleteWorkflow);

module.exports = router;