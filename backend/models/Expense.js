const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema({
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approverName: { type: String, required: true },
    action: { type: String, enum: ['Approved', 'Rejected'], required: true },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now }
});

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
    currentApproverIndex: { type: Number, default: 0 },
    approvalHistory: [approvalHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);