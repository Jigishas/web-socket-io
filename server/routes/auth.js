const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/auth');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authMiddleware, getCurrentUser);

module.exports = router;