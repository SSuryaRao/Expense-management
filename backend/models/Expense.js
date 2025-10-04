const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema({
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approverName: { type: String, required: true },
    action: { type: String, enum: ['Approved', 'Rejected'], required: true },
    comment: { type: String },
    stepLevel: { type: Number }, // Which step level this approval was for
    isManagerApproval: { type: Boolean, default: false }, // Was this the manager pre-approval?
    timestamp: { type: Date, default: Date.now }
});

// Track approvals for each step (for parallel approvals)
const stepApprovalSchema = new mongoose.Schema({
    stepLevel: { type: Number, required: true },
    approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who approved this step
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who rejected (if any)
    isComplete: { type: Boolean, default: false }, // Has this step completed?
    completedAt: { type: Date }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    submissionDate: { type: Date, default: Date.now },
    originalAmount: { type: mongoose.Types.Decimal128, required: true },
    originalCurrency: { type: String, required: true, uppercase: true },
    convertedAmount: { type: mongoose.Types.Decimal128, required: true },
    companyCurrency: { type: String, required: true, uppercase: true },
    exchangeRate: { type: mongoose.Types.Decimal128 },
    receiptUrl: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    approvalWorkflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalWorkflow' },

    // Manager pre-approval tracking
    requiresManagerApproval: { type: Boolean, default: false },
    managerApprovalComplete: { type: Boolean, default: false },

    // Current step in workflow (0-based index)
    currentApproverIndex: { type: Number, default: 0 },

    // Approval tracking for each step (supports parallel approvals)
    stepApprovals: [stepApprovalSchema],

    // Historical record of all approval actions
    approvalHistory: [approvalHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);