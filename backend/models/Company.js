const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    defaultCurrency: { type: String, required: true, uppercase: true, length: 3 },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);