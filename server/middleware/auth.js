const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Secret key for JWT - must be set in environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

// Rate limiting for auth attempts (simple in-memory store)
const authAttempts = new Map();
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_AUTH_ATTEMPTS = 5;

const checkAuthRateLimit = (identifier) => {
    const now = Date.now();
    const attempts = authAttempts.get(identifier) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < AUTH_WINDOW_MS);

    if (validAttempts.length >= MAX_AUTH_ATTEMPTS) {
        return false;
    }

    validAttempts.push(now);
    authAttempts.set(identifier, validAttempts);
    return true;
};

const resetAuthAttempts = (identifier) => {
    authAttempts.delete(identifier);
};

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const clientIP = req.ip || req.connection.remoteAddress;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Check for rate limiting on auth endpoints
        if (req.path.includes('/auth/') && !checkAuthRateLimit(clientIP)) {
            return res.status(429).json({
                error: 'Too many authentication attempts. Please try again later.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.userId) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }

        res.status(500).json({ error: 'Authentication error' });
    }
};

// Socket.io authentication middleware
const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        const clientIP = socket.handshake.address;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        // Check rate limiting for socket auth
        if (!checkAuthRateLimit(clientIP)) {
            return next(new Error('Too many authentication attempts'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.userId) {
            return next(new Error('Invalid token structure'));
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return next(new Error('User not found'));
        }

        if (!user.isActive) {
            return next(new Error('Account is deactivated'));
        }

        socket.user = user;
        resetAuthAttempts(clientIP); // Reset on successful auth
        next();
    } catch (error) {
        console.error('Socket auth error:', error);

        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Invalid token'));
        }

        if (error.name === 'TokenExpiredError') {
            return next(new Error('Token expired'));
        }

        next(new Error('Authentication failed'));
    }
};

module.exports = {
    authMiddleware,
    socketAuthMiddleware,
    JWT_SECRET
};
