const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Normalize phone number - keep only digits but preserve leading + if present
const normalizePhone = (phone) => {
    if (!phone) return '';
    // Keep the + prefix if present, then remove all non-digits from the rest
    const hasPlus = phone.startsWith('+');
    const digits = phone.replace(/\D/g, '');
    return hasPlus ? '+' + digits : digits;
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user with normalized phone
        const user = await User.create({
            name,
            email,
            password,
            phone: normalizePhone(phone)
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                addresses: user.addresses,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Login with optional username or email
        const identifier = email || username;

        if (!identifier) {
            return res.status(400).json({ message: 'Please provide email or username' });
        }

        // Normalize identifier if it looks like a phone number (only digits)
        const normalizedIdentifier = normalizePhone(identifier);
        const isPhoneNumber = normalizedIdentifier.length > 0 && /^\d+$/.test(identifier);

        // Find user by email OR username OR phone (with phone normalization)
        const query = {
            $or: [
                { email: identifier },
                { username: identifier },
                ...(isPhoneNumber ? [{ phone: normalizedIdentifier }] : [])
            ]
        };

        const user = await User.findOne(query).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                addresses: user.addresses,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            addresses: user.addresses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
