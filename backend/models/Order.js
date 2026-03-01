const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    referenceId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    deliveryMethod: {
        type: String,
        enum: ['delivery', 'pickup'],
        default: 'delivery'
    },
    items: [{
        name: String,
        quantity: Number,
        price: Number,
        filePath: String,
        fileUrl: String
    }],
    subtotal: {
        type: Number,
        required: true
    },
    shippingFee: {
        type: Number,
        default: 20
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'In Production', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate reference ID before validation (with collision retry)
orderSchema.pre('validate', async function (next) {
    if (!this.referenceId) {
        const year = new Date().getFullYear();
        let attempts = 0;
        while (attempts < 5) {
            const random = Math.floor(100000 + Math.random() * 900000);
            const candidate = `MJ-${year}-${random}`;
            const existing = await mongoose.model('Order').findOne({ referenceId: candidate });
            if (!existing) {
                this.referenceId = candidate;
                break;
            }
            attempts++;
        }
        if (!this.referenceId) {
            return next(new Error('Failed to generate unique reference ID'));
        }
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
