const Expense = require('../models/Expense');
const Company = require('../models/Company');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const axios = require('axios');

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
        // Note: In a real app, this logic would be more complex, perhaps based on
        // the expense amount, category, or user's department.
        const workflow = await ApprovalWorkflow.findOne({ companyId: req.user.companyId });
        if (!workflow) {
            return res.status(400).json({ message: 'No approval workflow found for your company. Please contact your admin.' });
        }
        
        // 4. Create and save the new expense
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
            receiptUrl: `/uploads/${req.file.filename}`, // URL to access the file
            approvalWorkflowId: workflow._id,
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
        const expenses = await Expense.find({ submittedBy: req.user._id }).sort({ submissionDate: -1 });
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
        }).populate('submittedBy', 'name email').populate('approvalWorkflowId');

        const userTasks = [];

        for (const expense of pendingExpenses) {
            const workflow = expense.approvalWorkflowId;
            const currentStepIndex = expense.currentApproverIndex;

            if (currentStepIndex >= workflow.steps.length) continue; // Should not happen

            const currentStep = workflow.steps[currentStepIndex];

            // Check if the current user is the designated approver for this step
            if (currentStep.approverType === 'Manager') {
                const submitter = await User.findById(expense.submittedBy);
                if (submitter.managerId && submitter.managerId.toString() === req.user._id.toString()) {
                    userTasks.push(expense);
                }
            } else if (currentStep.approverType === 'Specific') {
                if (currentStep.specificApproverId.toString() === req.user._id.toString()) {
                    userTasks.push(expense);
                }
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
        const expense = await Expense.findById(req.params.id).populate('approvalWorkflowId');

        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        if (expense.status !== 'Pending') return res.status(400).json({ message: 'This expense is not pending approval' });

        // ** Authorization Check: Verify if the current user is the correct approver **
        // (This logic is similar to getPendingApprovals and should be implemented here for security)
        
        // 1. Add action to history
        expense.approvalHistory.push({
            approverId: req.user._id,
            approverName: req.user.name,
            action: action,
            comment: comment || ''
        });

        // 2. Process the action
        if (action === 'Rejected') {
            expense.status = 'Rejected';
        } else if (action === 'Approved') {
            const workflow = expense.approvalWorkflowId;
            const nextApproverIndex = expense.currentApproverIndex + 1;

            // Check if this was the final approval step
            if (nextApproverIndex >= workflow.steps.length) {
                expense.status = 'Approved';
            } else {
                // Move to the next approver in the sequence
                expense.currentApproverIndex = nextApproverIndex;
            }
        } else {
            return res.status(400).json({ message: 'Invalid action specified.' });
        }

        const updatedExpense = await expense.save();
        res.status(200).json(updatedExpense);

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

