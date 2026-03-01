const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { protect, admin } = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   POST /api/chats
// @desc    Start or get chat
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const sessionId = `chat_${req.user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;

        let chat = await Chat.findOne({ sessionId });

        if (!chat) {
            chat = await Chat.create({
                sessionId,
                user: req.user._id,
                customerName: req.user.name,
                customerEmail: req.user.email,
                messages: []
            });
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ====== ADMIN ROUTES (must be before /:sessionId to avoid route conflict) ======

// @route   GET /api/chats/admin/all
// @desc    Get all chats (admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const chats = await Chat.find({}).sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/chats/admin/:sessionId/status
// @desc    Update chat status (admin)
// @access  Private/Admin
router.put('/admin/:sessionId/status', protect, admin, async (req, res) => {
    try {
        const chat = await Chat.findOne({ sessionId: req.params.sessionId });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        chat.status = req.body.status;
        await chat.save();

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/chats/admin/:sessionId
// @desc    Delete a chat session (admin)
// @access  Private/Admin
router.delete('/admin/:sessionId', protect, admin, async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({ sessionId: req.params.sessionId });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.json({ message: 'Chat removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ====== SESSION ROUTES (/:sessionId must be LAST to avoid catching /admin) ======

// @route   POST /api/chats/:sessionId/message
// @desc    Send message
// @access  Private
router.post('/:sessionId/message', protect, async (req, res) => {
    try {
        const chat = await Chat.findOne({ sessionId: req.params.sessionId });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const { text, isAutoReply } = req.body;
        let sender = req.user.role === 'admin' ? 'admin' : 'customer';

        // Allow auto-replies only from the chat owner (prevents spoofing)
        if (isAutoReply && chat.user.toString() === req.user._id.toString()) {
            sender = 'admin';
        }

        chat.messages.push({
            sender,
            text,
            timestamp: new Date()
        });

        await chat.save();

        // Fire-and-forget: create admin notification for customer messages only
        if (sender === 'customer') {
            Notification.create({
                type: 'new_chat',
                title: 'New Message',
                message: `${chat.customerName || 'Customer'} sent a message`,
                referenceId: chat.sessionId
            }).catch(err => console.error('Notification create error:', err));
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/chats/:sessionId
// @desc    Get chat history
// @access  Private
router.get('/:sessionId', protect, async (req, res) => {
    try {
        const chat = await Chat.findOne({ sessionId: req.params.sessionId });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Make sure user owns this chat or is admin
        if (chat.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
