const User = require('../models/User');
const Company = require('../models/Company');

// @desc    Get current logged in user with company info
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        const company = await Company.findById(user.companyId);

        res.status(200).json({
            user,
            company
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure users can only access their own data or users in their company
        if (user.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this user' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin creates a new user (Employee or Manager)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    const { name, email, password, role, jobTitle, managerId } = req.body;

    // The new user will belong to the same company as the admin creating them.
    const companyId = req.user.companyId;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'Employee', // Default to Employee if not specified
            jobTitle: jobTitle || '', // Job title like 'CFO', 'Director', etc.
            companyId,
            managerId: managerId || null, // Optional manager assignment
        });

        // We don't send the password back
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            jobTitle: user.jobTitle,
            managerId: user.managerId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Admin gets all users in their company
// @route   GET /api/users
// @access  Private/Admin
exports.getUsersInCompany = async (req, res) => {
    try {
        // Find all users that match the admin's companyId
        const users = await User.find({ companyId: req.user.companyId }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Admin updates a user's role, job title, or manager
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    const { role, jobTitle, managerId } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Ensure the admin is not trying to modify a user from another company
            if (user.companyId.toString() !== req.user.companyId.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this user' });
            }

            user.role = role || user.role;
            user.jobTitle = jobTitle !== undefined ? jobTitle : user.jobTitle;
            user.managerId = managerId !== undefined ? managerId : user.managerId;

            const updatedUser = await user.save();

            res.status(200).json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                jobTitle: updatedUser.jobTitle,
                managerId: updatedUser.managerId,
            });

        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};