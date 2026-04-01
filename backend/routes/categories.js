const express = require('express');
const router = express.Router();
const CategorySettings = require('../models/CategorySettings');
const { protect, admin } = require('../middleware/auth');

/**
 * GET /api/categories/settings
 * Get all category settings with sample images
 * Public endpoint - used by homepage
 */
router.get('/settings', async (req, res) => {
    try {
        const settings = await CategorySettings.find({ isActive: true })
            .select('category sampleImages')
            .lean();

        // Return as object keyed by category name for easy lookup
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.category] = s.sampleImages || [];
        });

        res.json(settingsMap);
    } catch (error) {
        console.error('Error fetching category settings:', error);
        res.status(500).json({ message: 'Server error fetching category settings' });
    }
});

/**
 * GET /api/categories/settings/:category
 * Get settings for a specific category
 */
router.get('/settings/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const settings = await CategorySettings.findOne({
            category,
            isActive: true
        }).lean();

        if (!settings) {
            return res.status(404).json({ message: 'Category settings not found' });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching category settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/categories/settings/:category
 * Update category sample images
 * Admin only
 */
router.put('/settings/:category', protect, admin, async (req, res) => {
    try {
        const { category } = req.params;
        const { sampleImages, featuredProducts } = req.body;

        // Validate category
        const validCategories = ['Large Format', 'Document Printing', 'Merchandise', 'Photo Lab', 'Events'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Find or create settings
        let settings = await CategorySettings.findOne({ category });

        if (!settings) {
            settings = new CategorySettings({ category });
        }

        // Update fields
        if (sampleImages) {
            settings.sampleImages = sampleImages;
        }
        if (featuredProducts) {
            settings.featuredProducts = featuredProducts;
        }

        settings.updatedBy = req.user.id;

        await settings.save();

        res.json({
            message: 'Category settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating category settings:', error);
        res.status(500).json({ message: 'Server error updating category settings' });
    }
});

/**
 * GET /api/categories
 * Get all categories (for dropdown selection in admin)
 */
router.get('/', async (req, res) => {
    try {
        const categories = ['Large Format', 'Document Printing', 'Merchandise', 'Photo Lab', 'Events'];
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/categories/settings
 * Create new category settings
 * Admin only
 */
router.post('/settings', protect, admin, async (req, res) => {
    try {
        const { category, sampleImages, featuredProducts } = req.body;

        // Check if already exists
        const existing = await CategorySettings.findOne({ category });
        if (existing) {
            return res.status(400).json({ message: 'Category settings already exist. Use PUT to update.' });
        }

        const settings = new CategorySettings({
            category,
            sampleImages: sampleImages || [],
            featuredProducts: featuredProducts || [],
            updatedBy: req.user.id
        });

        await settings.save();

        res.status(201).json({
            message: 'Category settings created successfully',
            settings
        });
    } catch (error) {
        console.error('Error creating category settings:', error);
        res.status(500).json({ message: 'Server error creating category settings' });
    }
});

module.exports = router;
