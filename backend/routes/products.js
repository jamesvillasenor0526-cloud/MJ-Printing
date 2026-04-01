const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Configure multer for image uploads
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only!'));
        }
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = { isActive: true, deletedAt: null };

        // Admin can see inactive products if they want (optional, but keep simple for now)
        // For admin dashboard we might want a different endpoint or query param

        if (category) {
            query.category = category;
        }

        const products = await Product.find(query).sort({ category: 1, name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get categories list
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category', { isActive: true });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADMIN ROUTES

// @route   GET /api/products/admin/all
// @desc    Get all products (including inactive)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product (must be after admin routes and /categories)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/products/admin
// @desc    Create a product
// @access  Private/Admin
router.post('/admin', protect, admin, upload.single('image'), async (req, res) => {
    try {
        console.log('Body:', req.body);
        console.log('File:', req.file);

        let productData = req.body;

        // Handle image upload
        if (req.file) {
            productData.image = `/uploads/${req.file.filename}`;
        }

        // Parse JSON fields if they come as strings (Multipart form data quirks)
        if (typeof productData.options === 'string') {
            try { productData.options = JSON.parse(productData.options); } catch (e) { }
        }
        if (typeof productData.priceRates === 'string') {
            try { productData.priceRates = JSON.parse(productData.priceRates); } catch (e) { }
        }
        // Ensure standard fields
        productData.isActive = productData.isActive === 'true' || productData.isActive === true;

        const product = await Product.create(productData);
        res.status(201).json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT /api/products/admin/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/admin/:id', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        let updates = req.body;

        if (req.file) {
            updates.image = `/uploads/${req.file.filename}`;
        }

        // Parse JSON fields
        if (typeof updates.options === 'string') {
            try { updates.options = JSON.parse(updates.options); } catch (e) { }
        }
        if (typeof updates.priceRates === 'string') {
            try { updates.priceRates = JSON.parse(updates.priceRates); } catch (e) { }
        }

        // Handle boolean
        if (updates.isActive !== undefined) {
            updates.isActive = updates.isActive === 'true' || updates.isActive === true;
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   DELETE /api/products/admin/:id
// @desc    Soft delete product (move to trash)
// @access  Private/Admin
router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.deletedAt = new Date();
        await product.save();
        res.json({ message: 'Product moved to trash' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/products/admin/trash
// @desc    Get deleted products (trash)
// @access  Private/Admin
router.get('/admin/trash', protect, admin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const products = await Product.find({
            deletedAt: { $ne: null },
            deletedAt: { $gte: thirtyDaysAgo }
        }).sort({ deletedAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT /api/products/admin/:id/restore
// @desc    Restore product from trash
// @access  Private/Admin
router.put('/admin/:id/restore', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.deletedAt = null;
        await product.save();
        res.json({ message: 'Product restored' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   DELETE /api/products/admin/:id/permanent
// @desc    Permanently delete product
// @access  Private/Admin
router.delete('/admin/:id/permanent', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.deleteOne();
        res.json({ message: 'Product permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/products/admin/:id/portfolio
// @desc    Upload portfolio/showcase images for a product
// @access  Private/Admin
router.post('/admin/:id/portfolio', protect, admin, upload.array('images', 5), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        const newImages = req.files.map(f => `/uploads/${f.filename}`);
        product.portfolioImages = [...(product.portfolioImages || []), ...newImages];
        await product.save();

        res.json({ portfolioImages: product.portfolioImages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT /api/products/admin/:id/portfolio/remove
// @desc    Remove a portfolio image from a product
// @access  Private/Admin
router.put('/admin/:id/portfolio/remove', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ message: 'imageUrl required' });

        product.portfolioImages = (product.portfolioImages || []).filter(img => img !== imageUrl);
        await product.save();

        res.json({ portfolioImages: product.portfolioImages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
