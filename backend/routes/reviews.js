const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find({}).sort({ date: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/reviews
// @desc    Create new review
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { rating, text, orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify order belongs to user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to review this order' });
        }

        // Verify order is completed
        if (order.status !== 'Completed') {
            return res.status(400).json({ message: 'Can only review completed orders' });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({ order: orderId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this order' });
        }

        const review = await Review.create({
            user: req.user._id,
            order: orderId,
            products: order.items.map(item => ({ name: item.name })),
            name: req.user.name,
            rating,
            text
        });

        res.status(201).json(review);

        // Fire-and-forget: create admin notification
        Notification.create({
            type: 'new_review',
            title: 'New Review',
            message: `${req.user.name} left a ${rating}★ review`,
            referenceId: review._id.toString()
        }).catch(err => console.error('Notification create error:', err));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/reviews/:id/reply
// @desc    Add admin reply to review
// @access  Private/Admin
router.put('/:id/reply', protect, admin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.reply = req.body.reply;
        await review.save();

        res.json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await review.deleteOne();
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
