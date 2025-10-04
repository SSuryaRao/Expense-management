const mongoose = require('mongoose');

// Conditional approval rules schema
const conditionalRuleSchema = new mongoose.Schema({
    // Rule type: 'percentage', 'specific_approver', 'hybrid'
    ruleType: { type: String, enum: ['percentage', 'specific_approver', 'hybrid'], required: true },
    // For percentage rule: e.g., 60 means 60% of approvers must approve
    percentageRequired: { type: Number, min: 1, max: 100 },
    // For specific_approver rule: if this user approves, auto-approve
    specificApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // For hybrid: both conditions apply (percentage OR specific approver)
    hybridPercentage: { type: Number, min: 1, max: 100 },
    hybridSpecificApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const workflowStepSchema = new mongoose.Schema({
    level: { type: Number, required: true },
    // Step name for better identification
    stepName: { type: String, default: '' },
    // Defines who needs to approve
    // 'Manager' = submitter's direct manager
    // 'Specific' = specific user(s)
    // 'Role' = any user with a specific role
    approverType: { type: String, enum: ['Manager', 'Specific', 'Role'], required: true },
    // Only used if approverType is 'Specific' - can have multiple approvers
    specificApproverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Only used if approverType is 'Role'
    approverRole: { type: String, enum: ['Manager', 'Admin'] },
    // If true, multiple approvers can approve in parallel
    allowParallelApproval: { type: Boolean, default: false },
    // If parallel approval is enabled, this defines how many approvals are needed
    // 'all' = all approvers must approve
    // 'any' = any one approver is sufficient
    // 'conditional' = use conditional rule
    approvalRequirement: { type: String, enum: ['all', 'any', 'conditional'], default: 'all' },
    // Conditional approval rules (only used if approvalRequirement is 'conditional')
    conditionalRule: conditionalRuleSchema
});

const approvalWorkflowSchema = new mongoose.Schema({
    name: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    // If true, manager must approve first before workflow steps
    requireManagerApproval: { type: Boolean, default: false },
    // An ordered array defining the approval chain
    steps: [workflowStepSchema],
    // Workflow description
    description: { type: String, default: '' },
    // Active/inactive status
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);