const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Resolved'],
        default: 'Active'
    },
    messages: [{
        sender: {
            type: String,
            enum: ['customer', 'admin'],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);
