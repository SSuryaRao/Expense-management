const User = require('../models/User');
const Company = require('../models/Company');
const generateToken = require('../utils/generateToken');
const axios = require('axios');

// @desc    Register a new user & company (Admin)
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
    const { name, email, password, companyName, country } = req.body;

    try {
        if (!name || !email || !password || !companyName || !country) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // 1. Get default currency from country name
        const currencyRes = await axios.get(`https://restcountries.com/v3.1/name/${country}?fields=currencies`);
        const currencyCode = Object.keys(currencyRes.data[0].currencies)[0];

        // 2. Create the company
        const company = await Company.create({ name: companyName, defaultCurrency: currencyCode });

        // 3. Create the admin user for this company
        const user = await User.create({
            name,
            email,
            password,
            role: 'Admin',
            companyId: company._id,
        });

        // 4. Send back user details and token
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};


// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};