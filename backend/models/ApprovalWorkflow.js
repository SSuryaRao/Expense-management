const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
    level: { type: Number, required: true },
    // Defines who needs to approve. 'Manager' means the submitter's direct manager.
    // 'Specific' could mean a role like 'Finance' or a specific person.
    approverType: { type: String, enum: ['Manager', 'Specific'], required: true },
    // Only used if approverType is 'Specific'
    specificApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const approvalWorkflowSchema = new mongoose.Schema({
    name: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    // An ordered array defining the approval chain
    steps: [workflowStepSchema]
}, { timestamps: true });

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);