const Expense = require('../models/Expense');
const Company = require('../models/Company');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const User = require('../models/User');
const axios = require('axios');

// Helper function to get all approvers for a step
const getApproversForStep = async (step, submitterId) => {
    const approvers = [];

    if (step.approverType === 'Manager') {
        const submitter = await User.findById(submitterId);
        if (submitter && submitter.managerId) {
            approvers.push(submitter.managerId);
        }
    } else if (step.approverType === 'Specific') {
        approvers.push(...step.specificApproverIds);
    } else if (step.approverType === 'Role') {
        const roleUsers = await User.find({
            companyId: submitter.companyId,
            role: step.approverRole
        });
        approvers.push(...roleUsers.map(u => u._id));
    }

    return approvers;
};

// Helper function to check if step approval is complete
const isStepApprovalComplete = (step, stepApproval, expense) => {
    if (!stepApproval) return false;

    const approvedCount = stepApproval.approvedBy.length;

    // If rejected, step is complete (but expense will be rejected)
    if (stepApproval.rejectedBy) return true;

    // For backward compatibility with old workflows
    const approverIds = step.specificApproverIds || (step.specificApproverId ? [step.specificApproverId] : []);
    const totalApprovers = approverIds.length || 1;

    // Check approval requirement
    if (step.approvalRequirement === 'any') {
        return approvedCount >= 1;
    } else if (step.approvalRequirement === 'all') {
        // Need all approvers to approve
        return approvedCount >= totalApprovers;
    } else if (step.approvalRequirement === 'conditional' && step.conditionalRule) {
        const rule = step.conditionalRule;

        if (rule.ruleType === 'percentage') {
            const percentageApproved = (approvedCount / totalApprovers) * 100;
            return percentageApproved >= rule.percentageRequired;
        } else if (rule.ruleType === 'specific_approver') {
            // Check if the specific approver has approved
            return stepApproval.approvedBy.some(
                id => id.toString() === rule.specificApproverId.toString()
            );
        } else if (rule.ruleType === 'hybrid') {
            // Either percentage OR specific approver
            const percentageApproved = (approvedCount / totalApprovers) * 100;
            const percentageMet = percentageApproved >= rule.hybridPercentage;
            const specificApproverApproved = stepApproval.approvedBy.some(
                id => id.toString() === rule.hybridSpecificApproverId.toString()
            );
            return percentageMet || specificApproverApproved;
        }
    }

    // Default: if no specific requirement, need all approvers
    return approvedCount >= totalApprovers;
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (Employee, Manager, Admin)
exports.createExpense = async (req, res) => {
    const { description, category, originalAmount, originalCurrency } = req.body;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Receipt file is required' });
        }

        // 1. Get company's default currency
        const company = await Company.findById(req.user.companyId);
        const companyCurrency = company.defaultCurrency;

        // 2. Perform currency conversion via external API
        const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${originalCurrency}`);

        if (data.result === 'error') {
            return res.status(400).json({ message: `Currency conversion failed: ${data['error-type']}` });
        }

        const exchangeRate = data.conversion_rates[companyCurrency];
        if (!exchangeRate) {
            return res.status(400).json({ message: `Invalid company currency or conversion not available for ${companyCurrency}` });
        }

        const convertedAmount = (originalAmount * exchangeRate).toFixed(2);

        // 3. Find the default approval workflow for the company
        const workflow = await ApprovalWorkflow.findOne({
            companyId: req.user.companyId,
            isActive: true
        });
        if (!workflow) {
            return res.status(400).json({ message: 'No active approval workflow found for your company. Please contact your admin.' });
        }

        // 4. Initialize step approvals
        const stepApprovals = workflow.steps.map(step => ({
            stepLevel: step.level,
            approvedBy: [],
            rejectedBy: null,
            isComplete: false
        }));

        // 5. Create and save the new expense
        const expense = await Expense.create({
            submittedBy: req.user._id,
            companyId: req.user.companyId,
            description,
            category,
            originalAmount,
            originalCurrency: originalCurrency.toUpperCase(),
            convertedAmount,
            companyCurrency,
            exchangeRate,
            receiptUrl: `/uploads/${req.file.filename}`,
            approvalWorkflowId: workflow._id,
            requiresManagerApproval: workflow.requireManagerApproval,
            managerApprovalComplete: !workflow.requireManagerApproval,
            stepApprovals
        });

        res.status(201).json(expense);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating expense' });
    }
};

// @desc    Get expenses submitted by the logged-in user
// @route   GET /api/expenses/my
// @access  Private
exports.getMyExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ submittedBy: req.user._id })
            .populate('approvalWorkflowId')
            .sort({ submissionDate: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get expenses pending the logged-in user's approval
// @route   GET /api/expenses/pending
// @access  Private (Manager, Admin)
exports.getPendingApprovals = async (req, res) => {
    try {
        // Find all expenses in the user's company that are 'Pending'
        const pendingExpenses = await Expense.find({
            companyId: req.user.companyId,
            status: 'Pending'
        }).populate('submittedBy', 'name email managerId')
          .populate('approvalWorkflowId');

        const userTasks = [];

        for (const expense of pendingExpenses) {
            const workflow = expense.approvalWorkflowId;
            if (!workflow) continue;

            // Check if manager approval is required and not yet complete
            if (expense.requiresManagerApproval && !expense.managerApprovalComplete) {
                const submitter = expense.submittedBy;
                if (submitter.managerId && submitter.managerId.toString() === req.user._id.toString()) {
                    userTasks.push({
                        ...expense.toObject(),
                        pendingStepType: 'manager_pre_approval',
                        pendingStepName: 'Manager Pre-Approval'
                    });
                    continue;
                }
            }

            // Check workflow steps
            const currentStepIndex = expense.currentApproverIndex;
            if (currentStepIndex >= workflow.steps.length) continue;

            const currentStep = workflow.steps[currentStepIndex];
            const currentStepApproval = expense.stepApprovals.find(s => s.stepLevel === currentStep.level);

            // Skip if step is already complete
            if (currentStepApproval && currentStepApproval.isComplete) continue;

            // Check if current user already approved this step
            if (currentStepApproval && currentStepApproval.approvedBy.some(id => id.toString() === req.user._id.toString())) {
                continue; // User already approved this step
            }

            // Check if the current user is an approver for this step
            let isApprover = false;

            if (currentStep.approverType === 'Manager') {
                const submitter = expense.submittedBy;
                if (submitter.managerId && submitter.managerId.toString() === req.user._id.toString()) {
                    isApprover = true;
                }
            } else if (currentStep.approverType === 'Specific') {
                // Handle both old (specificApproverId) and new (specificApproverIds) schemas
                const approverIds = currentStep.specificApproverIds || (currentStep.specificApproverId ? [currentStep.specificApproverId] : []);
                if (approverIds.some(id => id.toString() === req.user._id.toString())) {
                    isApprover = true;
                }
            } else if (currentStep.approverType === 'Role') {
                if (req.user.role === currentStep.approverRole) {
                    isApprover = true;
                }
            }

            if (isApprover) {
                userTasks.push({
                    ...expense.toObject(),
                    pendingStepType: 'workflow_step',
                    pendingStepName: currentStep.stepName || `Step ${currentStep.level}`,
                    pendingStepLevel: currentStep.level
                });
            }
        }

        res.status(200).json(userTasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve or reject an expense
// @route   PUT /api/expenses/:id/action
// @access  Private (Manager, Admin)
exports.processApprovalAction = async (req, res) => {
    const { action, comment } = req.body; // action: 'Approved' or 'Rejected'

    try {
        const expense = await Expense.findById(req.params.id)
            .populate('approvalWorkflowId')
            .populate('submittedBy', 'name email managerId');

        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        if (expense.status !== 'Pending') return res.status(400).json({ message: 'This expense is not pending approval' });

        const workflow = expense.approvalWorkflowId;

        if (!workflow) {
            return res.status(400).json({ message: 'No workflow found for this expense' });
        }

        // Initialize new fields for backward compatibility with old expenses
        if (expense.requiresManagerApproval === undefined) {
            expense.requiresManagerApproval = workflow.requireManagerApproval || false;
            expense.managerApprovalComplete = !workflow.requireManagerApproval;
        }

        if (!expense.stepApprovals || expense.stepApprovals.length === 0) {
            expense.stepApprovals = workflow.steps.map(step => ({
                stepLevel: step.level,
                approvedBy: [],
                rejectedBy: null,
                isComplete: false
            }));
        }

        // Determine if this is a manager pre-approval or workflow step approval
        let isManagerPreApproval = false;
        let currentStep = null;
        let stepApproval = null;

        if (expense.requiresManagerApproval && !expense.managerApprovalComplete) {
            // Check if user is the submitter's manager
            const submitter = expense.submittedBy;
            if (!submitter.managerId || submitter.managerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You are not authorized to approve this expense at this stage' });
            }
            isManagerPreApproval = true;
        } else {
            // Workflow step approval
            const currentStepIndex = expense.currentApproverIndex;
            if (currentStepIndex >= workflow.steps.length) {
                return res.status(400).json({ message: 'All approval steps have been completed' });
            }

            currentStep = workflow.steps[currentStepIndex];
            stepApproval = expense.stepApprovals.find(s => s.stepLevel === currentStep.level);

            // Verify authorization
            let isAuthorized = false;

            if (currentStep.approverType === 'Manager') {
                const submitter = expense.submittedBy;
                if (submitter.managerId && submitter.managerId.toString() === req.user._id.toString()) {
                    isAuthorized = true;
                }
            } else if (currentStep.approverType === 'Specific') {
                // Handle both old (specificApproverId) and new (specificApproverIds) schemas
                const approverIds = currentStep.specificApproverIds || (currentStep.specificApproverId ? [currentStep.specificApproverId] : []);
                if (approverIds.some(id => id.toString() === req.user._id.toString())) {
                    isAuthorized = true;
                }
            } else if (currentStep.approverType === 'Role') {
                if (req.user.role === currentStep.approverRole) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                return res.status(403).json({ message: 'You are not authorized to approve this expense at this stage' });
            }

            // Check if user already approved this step
            if (stepApproval.approvedBy.some(id => id.toString() === req.user._id.toString())) {
                return res.status(400).json({ message: 'You have already approved this step' });
            }
        }

        // Process the action
        if (action === 'Rejected') {
            expense.status = 'Rejected';

            if (isManagerPreApproval) {
                expense.approvalHistory.push({
                    approverId: req.user._id,
                    approverName: req.user.name,
                    action: 'Rejected',
                    comment: comment || '',
                    isManagerApproval: true
                });
            } else {
                stepApproval.rejectedBy = req.user._id;
                stepApproval.isComplete = true;
                stepApproval.completedAt = new Date();

                expense.approvalHistory.push({
                    approverId: req.user._id,
                    approverName: req.user.name,
                    action: 'Rejected',
                    comment: comment || '',
                    stepLevel: currentStep.level,
                    isManagerApproval: false
                });
            }
        } else if (action === 'Approved') {
            if (isManagerPreApproval) {
                expense.managerApprovalComplete = true;
                expense.approvalHistory.push({
                    approverId: req.user._id,
                    approverName: req.user.name,
                    action: 'Approved',
                    comment: comment || '',
                    isManagerApproval: true
                });
            } else {
                // Add approval to step
                stepApproval.approvedBy.push(req.user._id);

                expense.approvalHistory.push({
                    approverId: req.user._id,
                    approverName: req.user.name,
                    action: 'Approved',
                    comment: comment || '',
                    stepLevel: currentStep.level,
                    isManagerApproval: false
                });

                // Check if step is now complete
                if (isStepApprovalComplete(currentStep, stepApproval, expense)) {
                    stepApproval.isComplete = true;
                    stepApproval.completedAt = new Date();

                    // Move to next step
                    const nextApproverIndex = expense.currentApproverIndex + 1;

                    if (nextApproverIndex >= workflow.steps.length) {
                        // All steps complete - approve expense
                        expense.status = 'Approved';
                    } else {
                        expense.currentApproverIndex = nextApproverIndex;
                    }
                }
            }
        } else {
            return res.status(400).json({ message: 'Invalid action specified.' });
        }

        const updatedExpense = await expense.save();

        // Populate for response
        await updatedExpense.populate('approvalWorkflowId');
        await updatedExpense.populate('submittedBy', 'name email');

        res.status(200).json(updatedExpense);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all expenses for company (Admin only)
// @route   GET /api/expenses/all
// @access  Private/Admin
exports.getAllExpenses = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const expenses = await Expense.find({ companyId: req.user.companyId })
            .populate('submittedBy', 'name email')
            .populate('approvalWorkflowId')
            .sort({ submissionDate: -1 });

        res.status(200).json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
