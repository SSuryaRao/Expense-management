const mongoose = require('mongoose');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const Company = require('../models/Company');
require('dotenv').config();

const createDefaultWorkflow = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Get all companies
        const companies = await Company.find();

        if (companies.length === 0) {
            console.log('No companies found. Please create a company first.');
            process.exit(1);
        }

        for (const company of companies) {
            // Check if workflow already exists
            const existingWorkflow = await ApprovalWorkflow.findOne({ companyId: company._id });

            if (existingWorkflow) {
                console.log(`Workflow already exists for company: ${company.name}`);
                continue;
            }

            // Create a simple one-step workflow: Manager approval
            const workflow = await ApprovalWorkflow.create({
                name: 'Default Approval Workflow',
                companyId: company._id,
                steps: [
                    {
                        level: 1,
                        approverType: 'Manager'
                    }
                ]
            });

            console.log(`Created default workflow for company: ${company.name}`);
            console.log(`Workflow ID: ${workflow._id}`);
        }

        console.log('\nDefault workflows created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createDefaultWorkflow();
