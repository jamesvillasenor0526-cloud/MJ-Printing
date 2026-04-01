const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Order = require('../models/Order');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/profiles');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/profile/picture
// @desc    Update user profile picture
// @access  Private
router.put('/profile/picture', protect, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate image URL
        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        
        user.profilePicture = imageUrl;
        await user.save();

        res.json({ profilePicture: imageUrl, message: 'Profile picture updated successfully' });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ message: error.message || 'Server error during upload' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const oldEmail = user.email;

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;

            // Handle email change
            if (req.body.email && req.body.email !== oldEmail) {
                // Check if new email already exists
                const emailExists = await User.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
                user.email = req.body.email;

                // Update orders with new email
                await Order.updateMany(
                    { email: oldEmail },
                    {
                        $set: {
                            email: req.body.email,
                            customer: req.body.name || user.name
                        }
                    }
                );

                // Update chats with new email
                await Chat.updateMany(
                    { customerEmail: oldEmail },
                    {
                        $set: {
                            customerEmail: req.body.email,
                            customerName: req.body.name || user.name
                        }
                    }
                );
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                profilePicture: updatedUser.profilePicture,
                role: updatedUser.role,
                addresses: updatedUser.addresses,
                notifications: updatedUser.notifications
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+password');
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        // Check current password
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/addresses
// @desc    Add address
// @access  Private
router.post('/addresses', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { label, street, apartment, barangay, city, province, zip, default: isDefault } = req.body;

        const newAddress = {
            id: Date.now(),
            label,
            street,
            apartment,
            barangay,
            city,
            province,
            zip,
            default: isDefault || false
        };

        // If this is set as default, unset others
        if (isDefault) {
            user.addresses.forEach(addr => addr.default = false);
        }

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/addresses/:id
// @desc    Update address
// @access  Private
router.put('/addresses/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const addressId = parseInt(req.params.id);
        const address = user.addresses.find(a => a.id === addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        address.label = req.body.label || address.label;
        address.street = req.body.street || address.street;
        address.apartment = req.body.apartment !== undefined ? req.body.apartment : address.apartment;
        address.barangay = req.body.barangay || address.barangay;
        address.city = req.body.city || address.city;
        address.province = req.body.province || address.province;
        address.zip = req.body.zip || address.zip;
        address.default = req.body.default !== undefined ? req.body.default : address.default;

        // If this is set as default, unset others
        if (address.default) {
            user.addresses.forEach(addr => {
                if (addr.id !== addressId) addr.default = false;
            });
        }

        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/users/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/addresses/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const addressId = parseInt(req.params.id);

        user.addresses = user.addresses.filter(a => a.id !== addressId);
        await user.save();

        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/notifications
// @desc    Update notification settings
// @access  Private
router.put('/notifications', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        user.notifications = {
            orderUpdates: req.body.orderUpdates !== undefined ? req.body.orderUpdates : user.notifications.orderUpdates,
            paymentUpdates: req.body.paymentUpdates !== undefined ? req.body.paymentUpdates : user.notifications.paymentUpdates
        };

        await user.save();
        res.json(user.notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Removed /cart endpoint since cart state is now 100% locally isolated in localStorage

module.exports = router;
