const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { protect, admin } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }, // 10MB default
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|ai|psd|svg|doc|docx/i;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and documents are allowed.'));
        }
    }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, upload.array('files', 10), async (req, res) => {
    try {
        const { items, subtotal, shippingFee, total, address, phone, deliveryMethod, paymentMethod, paymentType } = req.body;

        // Parse items if it's a string, or default to empty array
        let parsedItems = [];
        if (typeof items === 'string') {
            try {
                parsedItems = JSON.parse(items);
            } catch (e) {
                console.error('Failed to parse items:', e);
                parsedItems = [];
            }
        } else if (Array.isArray(items)) {
            parsedItems = items;
        }

        // Validate quantity limits - max 999 per item
        const MAX_QUANTITY = 999;
        for (const item of parsedItems) {
            const qty = parseInt(item.quantity) || 1;
            if (qty > MAX_QUANTITY) {
                return res.status(400).json({
                    message: `Quantity for "${item.name || 'item'}" exceeds maximum limit of ${MAX_QUANTITY}`
                });
            }
        }

        // Add file paths to items
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                if (parsedItems[index]) {
                    parsedItems[index].filePath = file.path;
                    parsedItems[index].fileUrl = `/uploads/${file.filename}`;
                }
            });
        }

        // Validate prices - calculate expected total server-side
        const shippingFeeValue = parseFloat(shippingFee) || 20;
        const calculatedSubtotal = parsedItems.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 1;
            return sum + (price * qty);
        }, 0);
        const calculatedTotal = calculatedSubtotal + shippingFeeValue;
        const submittedTotal = parseFloat(total);

        // Allow small floating point differences, but reject significant mismatches
        if (Math.abs(calculatedTotal - submittedTotal) > 1) {
            return res.status(400).json({
                message: 'Invalid order total. Prices may have been tampered with.',
                expected: calculatedTotal.toFixed(2),
                received: submittedTotal.toFixed(2)
            });
        }

        const totalAmount = submittedTotal;
        const downpaymentAmount = (paymentType === 'downpayment') ? totalAmount * 0.5 : 0;

        const order = await Order.create({
            user: req.user._id,
            customer: req.user.name,
            email: req.user.email,
            phone: phone || req.user.phone,
            address: address,
            deliveryMethod: deliveryMethod || 'delivery',
            paymentMethod: paymentMethod || 'gcash',
            paymentType: paymentType || 'full',
            downpaymentAmount: downpaymentAmount,
            items: parsedItems,
            subtotal: calculatedSubtotal,
            shippingFee: shippingFeeValue,
            total: totalAmount
        });

        res.status(201).json(order);

        // Fire-and-forget: create admin notification
        Notification.create({
            type: 'new_order',
            title: 'New Order',
            message: `Order #${order.referenceId} from ${order.customer} — ₱${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            referenceId: order._id.toString()
        }).catch(err => console.error('Notification create error:', err));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id, deletedAt: null }).sort({ date: -1 });

        // Check if each order has been reviewed
        const ordersWithReviews = await Promise.all(orders.map(async (order) => {
            const review = await Review.findOne({ order: order._id });
            return {
                ...order.toObject(),
                id: order._id, // Ensure frontend sees 'id'
                isReviewed: !!review
            };
        }));

        res.json(ordersWithReviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ====== ADMIN ROUTES (must be before /:id to avoid route conflict) ======

// @route   GET /api/orders/admin/all
// @desc    Get all orders (admin, excluding deleted)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({ deletedAt: null }).sort({ date: -1 }).populate('user', 'name email');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/orders/admin/:id/status
// @desc    Update order status (admin)
// @access  Private/Admin
router.put('/admin/:id/status', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Validate status against allowed enum values
        const allowedStatuses = ['Pending', 'Processing', 'In Production', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'];
        if (!allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
        }

        order.status = req.body.status;
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/orders/admin/:id/priority
// @desc    Update order priority (admin)
// @access  Private/Admin
router.put('/admin/:id/priority', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.priority = req.body.priority || 0;
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/orders/admin/:id/proof
// @desc    Upload proof of delivery/payment (admin)
// @access  Private/Admin
router.put('/admin/:id/proof', protect, admin, (req, res, next) => {
    upload.single('proof')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: err.message || 'File upload failed' });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('Proof upload endpoint called');
        console.log('Order ID:', req.params.id);
        console.log('File:', req.file);

        const order = await Order.findById(req.params.id);

        if (!order) {
            console.log('Order not found:', req.params.id);
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        order.proof = `/uploads/${req.file.filename}`;
        await order.save();
        console.log('Proof saved:', order.proof);

        res.json({ message: 'Proof uploaded successfully', proof: order.proof });
    } catch (error) {
        console.error('Proof upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/orders/admin/:id
// @desc    Soft delete order (move to trash)
// @access  Private/Admin
router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.deletedAt = new Date();
        await order.save();
        res.json({ message: 'Order moved to trash' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/orders/admin/trash
// @desc    Get deleted orders (trash)
// @access  Private/Admin
router.get('/admin/trash', protect, admin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await Order.find({
            deletedAt: { $ne: null },
            deletedAt: { $gte: thirtyDaysAgo }
        }).sort({ deletedAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/orders/admin/:id/restore
// @desc    Restore order from trash
// @access  Private/Admin
router.put('/admin/:id/restore', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.deletedAt = null;
        await order.save();
        res.json({ message: 'Order restored' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/orders/admin/:id/permanent
// @desc    Permanently delete order
// @access  Private/Admin
router.delete('/admin/:id/permanent', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.deleteOne();
        res.json({ message: 'Order permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ====== TRACK ROUTE (must be before /:id to avoid route conflict) ======

// @route   GET /api/orders/track/:referenceId
// @desc    Track order by reference ID
// @access  Public
router.get('/track/:referenceId', async (req, res) => {
    try {
        const order = await Order.findOne({ referenceId: req.params.referenceId })
            .select('referenceId status items date deliveryMethod paymentMethod paymentType total subtotal shippingFee proof');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ====== SINGLE ORDER ROUTES (/:id must be LAST to avoid catching /admin, /track) ======

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Make sure user owns this order
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Make sure user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Only allow cancel if pending
        if (order.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot cancel order with status: ' + order.status });
        }

        order.status = 'Cancelled';
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/orders/:id/confirm
// @desc    Confirm order received
// @access  Private
router.put('/:id/confirm', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Make sure user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Only allow confirm if Ready for Pickup or Out for Delivery
        if (order.status !== 'Ready for Pickup' && order.status !== 'Out for Delivery') {
            return res.status(400).json({ message: 'Cannot confirm order with status: ' + order.status });
        }

        order.status = 'Completed';
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
