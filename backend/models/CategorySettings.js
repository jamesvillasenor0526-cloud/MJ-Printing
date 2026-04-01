const mongoose = require('mongoose');

/**
 * CategorySettings Schema
 * Stores sample/display images for each product category
 * Used for homepage category hover gallery
 */
const CategorySettingsSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        unique: true,
        enum: ['Large Format', 'Document Printing', 'Merchandise', 'Photo Lab', 'Events'],
        index: true
    },
    // Sample product images to display in category hover gallery
    sampleImages: [{
        type: String  // URLs or paths to images
    }],
    // Optional: Featured products for this category
    featuredProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Pre-save middleware to update timestamp
CategorySettingsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('CategorySettings', CategorySettingsSchema);
