const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Large Format', 'Document Printing', 'Merchandise', 'Photo Lab', 'Events', 'Other'],
        index: true
    },
    description: {
        type: String
    },
    basePrice: {
        type: Number,
        default: 0
    },
    // For products with simple variant pricing (e.g. T-Shirt sizes)
    variants: [{
        name: String, // e.g., "Small", "A4", "3x5 ft"
        price: Number,
        sku: String
    }],
    // Flexible options configuration
    options: {
        sizes: [String],        // e.g. ["A4", "Letter"]
        materials: [String],    // e.g. ["Glossy", "Matte"]
        finishes: [String],     // e.g. ["Eyelets", "Framed"]
        colors: [String],       // e.g. ["White", "Black"]
        layoutStyles: [String]  // e.g. ["Borderless"]
    },
    // For calculating price based on options if not using simple variants
    priceRates: {
        type: mongoose.Schema.Types.Mixed
    },
    image: {
        type: String // URL or path
    },
    portfolioImages: [{
        type: String // URLs or paths to showcase/sample work images
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
