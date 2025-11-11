const express = require('express');
const router = express.Router();
const { getMessages, deleteMessage } = require('../controllers/messages');
const { authMiddleware } = require('../middleware/auth');

// Protected route to get messages
router.get('/', authMiddleware, getMessages);

// Protected route to delete a message
router.delete('/:messageId', authMiddleware, deleteMessage);

module.exports = router;
