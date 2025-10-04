const ApprovalWorkflow = require('../models/ApprovalWorkflow');

// @desc    Admin creates a new approval workflow
// @route   POST /api/workflows
// @access  Private/Admin
exports.createWorkflow = async (req, res) => {
    const { name, steps } = req.body;
    
    // Workflow is associated with the Admin's company
    const companyId = req.user.companyId;

    try {
        // Basic validation for steps
        if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({ message: 'Workflow name and at least one step are required.' });
        }

        const newWorkflow = await ApprovalWorkflow.create({
            name,
            companyId,
            steps
        });

        res.status(201).json(newWorkflow);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin gets all workflows for their company
// @route   GET /api/workflows
// @access  Private/Admin
exports.getWorkflows = async (req, res) => {
    try {
        const workflows = await ApprovalWorkflow.find({ companyId: req.user.companyId });
        res.status(200).json(workflows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};