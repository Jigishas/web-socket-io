require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db');
const authRoutes = require('../routes/auth');
const messageRoutes = require('../routes/messages');
const SocketHandler = require('../socket/socketHandler');

// Validate environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

const configureServer = () => {
    // Initialize Express app
    const app = express();
    const httpServer = createServer(app);

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);

    // Stricter rate limiting for auth routes
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 auth requests per windowMs
        message: 'Too many authentication attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/auth/', authLimiter);

    // Configure Socket.io with security
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        // Security options
        allowEIO3: false, // Disable Engine.IO v3 support
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Connect to MongoDB
    connectDB();

    // Middleware
    app.use(cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        optionsSuccessStatus: 200
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
        next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/messages', messageRoutes);

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        console.error('Global error handler:', err);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
        });
    });

    // Initialize Socket Handler
    new SocketHandler(io);

    return httpServer;
};

module.exports = configureServer;
