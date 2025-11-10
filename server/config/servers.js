require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const SocketHandler = require('./socket/socketHandler');

const configureServer = () => {
    // Initialize Express app
    const app = express();
    const httpServer = createServer(app);

    // Configure Socket.io
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Connect to MongoDB
    connectDB();

    // Middleware
    app.use(cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true
    }));
    app.use(express.json());

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/messages', messageRoutes);

    // Initialize Socket Handler
    new SocketHandler(io);

    return httpServer;
};

module.exports = configureServer;