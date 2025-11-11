const Message = require('../models/Message');

// Input validation for messages
const validateMessage = (text) => {
    if (!text || typeof text !== 'string') {
        return 'Message text is required';
    }
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
        return 'Message cannot be empty';
    }
    if (trimmedText.length > 1000) {
        return 'Message cannot exceed 1000 characters';
    }
    // Basic XSS prevention - remove potentially dangerous tags
    const sanitizedText = trimmedText.replace(/<[^>]*>/g, '');
    return { sanitizedText };
};

// Get all messages
const getMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages per request
        const skip = (page - 1) * limit;

        const messages = await Message.find()
            .sort({ timestamp: -1 }) // Most recent first
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username')
            .lean();

        // Reverse to show chronological order
        messages.reverse();

        const totalMessages = await Message.countDocuments();
        const totalPages = Math.ceil(totalMessages / limit);

        res.json({
            messages,
            pagination: {
                currentPage: page,
                totalPages,
                totalMessages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Save a new message
const saveMessage = async (messageData) => {
    try {
        const validation = validateMessage(messageData.text);
        if (typeof validation === 'string') {
            throw new Error(validation);
        }

        const newMessage = new Message({
            ...messageData,
            text: validation.sanitizedText
        });

        await newMessage.save();
        return await Message.findById(newMessage._id).populate('userId', 'username');
    } catch (error) {
        console.error('Save message error:', error);
        throw error;
    }
};

// Delete a message (for moderation)
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        if (!messageId) {
            return res.status(400).json({ error: 'Message ID is required' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if user owns the message or is admin
        if (message.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        await Message.findByIdAndDelete(messageId);
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getMessages,
    saveMessage,
    deleteMessage
};
