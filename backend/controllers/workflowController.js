const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const User = require('../models/User');

// @desc    Admin creates a new approval workflow
// @route   POST /api/workflows
// @access  Private/Admin
exports.createWorkflow = async (req, res) => {
    const { name, description, requireManagerApproval, steps } = req.body;

    // Workflow is associated with the Admin's company
    const companyId = req.user.companyId;

    try {
        // Basic validation for steps
        if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({ message: 'Workflow name and at least one step are required.' });
        }

        // Validate each step
        for (const step of steps) {
            if (!step.level || !step.approverType) {
                return res.status(400).json({ message: 'Each step must have a level and approverType.' });
            }

            if (step.approverType === 'Specific' && (!step.specificApproverIds || step.specificApproverIds.length === 0)) {
                return res.status(400).json({ message: 'Specific approver type requires at least one approver.' });
            }

            if (step.approverType === 'Role' && !step.approverRole) {
                return res.status(400).json({ message: 'Role approver type requires an approverRole.' });
            }

            // Validate conditional rules
            if (step.approvalRequirement === 'conditional') {
                if (!step.conditionalRule || !step.conditionalRule.ruleType) {
                    return res.status(400).json({ message: 'Conditional approval requirement needs a valid conditionalRule.' });
                }

                const rule = step.conditionalRule;

                if (rule.ruleType === 'percentage' && (!rule.percentageRequired || rule.percentageRequired < 1 || rule.percentageRequired > 100)) {
                    return res.status(400).json({ message: 'Percentage rule requires a percentageRequired between 1-100.' });
                }

                if (rule.ruleType === 'specific_approver' && !rule.specificApproverId) {
                    return res.status(400).json({ message: 'Specific approver rule requires a specificApproverId.' });
                }

                if (rule.ruleType === 'hybrid') {
                    if (!rule.hybridPercentage || rule.hybridPercentage < 1 || rule.hybridPercentage > 100) {
                        return res.status(400).json({ message: 'Hybrid rule requires hybridPercentage between 1-100.' });
                    }
                    if (!rule.hybridSpecificApproverId) {
                        return res.status(400).json({ message: 'Hybrid rule requires hybridSpecificApproverId.' });
                    }
                }
            }
        }

        const newWorkflow = await ApprovalWorkflow.create({
            name,
            description: description || '',
            companyId,
            requireManagerApproval: requireManagerApproval || false,
            steps,
            isActive: true
        });

        await newWorkflow.populate('steps.specificApproverIds', 'name email role');
        await newWorkflow.populate('steps.conditionalRule.specificApproverId', 'name email role');
        await newWorkflow.populate('steps.conditionalRule.hybridSpecificApproverId', 'name email role');

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
        const workflows = await ApprovalWorkflow.find({ companyId: req.user.companyId })
            .populate('steps.specificApproverIds', 'name email role')
            .populate('steps.conditionalRule.specificApproverId', 'name email role')
            .populate('steps.conditionalRule.hybridSpecificApproverId', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json(workflows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin gets a single workflow by ID
// @route   GET /api/workflows/:id
// @access  Private/Admin
exports.getWorkflowById = async (req, res) => {
    try {
        const workflow = await ApprovalWorkflow.findById(req.params.id)
            .populate('steps.specificApproverIds', 'name email role')
            .populate('steps.conditionalRule.specificApproverId', 'name email role')
            .populate('steps.conditionalRule.hybridSpecificApproverId', 'name email role');

        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }

        if (workflow.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(workflow);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin updates a workflow
// @route   PUT /api/workflows/:id
// @access  Private/Admin
exports.updateWorkflow = async (req, res) => {
    const { name, description, requireManagerApproval, steps, isActive } = req.body;

    try {
        const workflow = await ApprovalWorkflow.findById(req.params.id);

        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }

        if (workflow.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Validate steps if provided
        if (steps) {
            if (!Array.isArray(steps) || steps.length === 0) {
                return res.status(400).json({ message: 'Steps must be a non-empty array.' });
            }

            for (const step of steps) {
                if (!step.level || !step.approverType) {
                    return res.status(400).json({ message: 'Each step must have a level and approverType.' });
                }

                if (step.approverType === 'Specific' && (!step.specificApproverIds || step.specificApproverIds.length === 0)) {
                    return res.status(400).json({ message: 'Specific approver type requires at least one approver.' });
                }

                if (step.approverType === 'Role' && !step.approverRole) {
                    return res.status(400).json({ message: 'Role approver type requires an approverRole.' });
                }

                if (step.approvalRequirement === 'conditional') {
                    if (!step.conditionalRule || !step.conditionalRule.ruleType) {
                        return res.status(400).json({ message: 'Conditional approval requirement needs a valid conditionalRule.' });
                    }

                    const rule = step.conditionalRule;

                    if (rule.ruleType === 'percentage' && (!rule.percentageRequired || rule.percentageRequired < 1 || rule.percentageRequired > 100)) {
                        return res.status(400).json({ message: 'Percentage rule requires a percentageRequired between 1-100.' });
                    }

                    if (rule.ruleType === 'specific_approver' && !rule.specificApproverId) {
                        return res.status(400).json({ message: 'Specific approver rule requires a specificApproverId.' });
                    }

                    if (rule.ruleType === 'hybrid') {
                        if (!rule.hybridPercentage || rule.hybridPercentage < 1 || rule.hybridPercentage > 100) {
                            return res.status(400).json({ message: 'Hybrid rule requires hybridPercentage between 1-100.' });
                        }
                        if (!rule.hybridSpecificApproverId) {
                            return res.status(400).json({ message: 'Hybrid rule requires hybridSpecificApproverId.' });
                        }
                    }
                }
            }
        }

        // Update fields
        if (name) workflow.name = name;
        if (description !== undefined) workflow.description = description;
        if (requireManagerApproval !== undefined) workflow.requireManagerApproval = requireManagerApproval;
        if (steps) workflow.steps = steps;
        if (isActive !== undefined) workflow.isActive = isActive;

        const updatedWorkflow = await workflow.save();

        await updatedWorkflow.populate('steps.specificApproverIds', 'name email role');
        await updatedWorkflow.populate('steps.conditionalRule.specificApproverId', 'name email role');
        await updatedWorkflow.populate('steps.conditionalRule.hybridSpecificApproverId', 'name email role');

        res.status(200).json(updatedWorkflow);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin deletes a workflow
// @route   DELETE /api/workflows/:id
// @access  Private/Admin
exports.deleteWorkflow = async (req, res) => {
    try {
        const workflow = await ApprovalWorkflow.findById(req.params.id);

        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }

        if (workflow.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await ApprovalWorkflow.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Workflow deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users in company (for workflow configuration)
// @route   GET /api/workflows/users/all
// @access  Private/Admin
exports.getCompanyUsers = async (req, res) => {
    try {
        const users = await User.find({ companyId: req.user.companyId })
            .select('name email role jobTitle')
            .sort({ name: 1 });

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
