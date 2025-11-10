const Message = require('../models/Message');

// Get all messages
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ timestamp: 1 })
            .limit(100); // Limit to last 100 messages for performance
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Save a new message
const saveMessage = async (message) => {
    try {
        const newMessage = new Message(message);
        await newMessage.save();
        return newMessage;
    } catch (error) {
        console.error('Save message error:', error);
        return null;
    }
};

module.exports = {
    getMessages,
    saveMessage
};