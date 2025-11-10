const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messages');
const { authMiddleware } = require('../middleware/auth');

// Protected route to get messages
router.get('/', authMiddleware, getMessages);

module.exports = router;