const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());

// Secret key for JWT
const JWT_SECRET = 'your-secret-key-here';
const users = new Map(); // In production, use a database

// Authentication middleware for Socket.io
const authenticateToken = (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
        
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        next();
    });
};

// Apply authentication middleware
io.use(authenticateToken);

// REST API endpoints for login/register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (users.has(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Store user (in production, save to database)
        users.set(username, {
            username,
            password: hashedPassword,
            id: Date.now().toString()
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: users.get(username).id, username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { username, id: users.get(username).id } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = users.get(username);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { username, id: user.id } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Socket.io connection handling with authentication
io.on('connection', (socket) => {
    console.log(`✅ User ${socket.username} connected with ID: ${socket.userId}`);
    
    // Join user to their personal room
    socket.join(socket.userId);
    
    // Notify others that user joined
    socket.broadcast.emit('user joined', {
        username: socket.username,
        userId: socket.userId,
        timestamp: new Date()
    });

    // Send online users list
    const getOnlineUsers = () => {
        const sockets = Array.from(io.sockets.sockets.values());
        return sockets.map(s => ({
            username: s.username,
            userId: s.userId
        }));
    };

    socket.emit('online users', getOnlineUsers());

    // Handle chat messages
    socket.on('chat message', (data) => {
        console.log(`💬 Message from ${socket.username}:`, data.text);
        
        const messageData = {
            id: Date.now(),
            username: socket.username,
            userId: socket.userId,
            text: data.text,
            timestamp: new Date().toISOString()
        };

        // Broadcast to all connected clients
        io.emit('chat message', messageData);
    });

    // Handle private messages
    socket.on('private message', (data) => {
        const { toUserId, text } = data;
        
        const messageData = {
            id: Date.now(),
            from: socket.username,
            fromUserId: socket.userId,
            toUserId,
            text,
            timestamp: new Date().toISOString()
        };

        // Send to specific user
        io.to(toUserId).emit('private message', messageData);
        
        // Also send back to sender for their UI
        socket.emit('private message', {
            ...messageData,
            isOwnMessage: true
        });
    });

    // Handle typing indicators
    socket.on('typing start', () => {
        socket.broadcast.emit('user typing', {
            username: socket.username,
            userId: socket.userId
        });
    });

    socket.on('typing stop', () => {
        socket.broadcast.emit('user stopped typing', {
            username: socket.username,
            userId: socket.userId
        });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`❌ User ${socket.username} disconnected:`, reason);
        
        socket.broadcast.emit('user left', {
            username: socket.username,
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // Error handling
    socket.on('error', (error) => {
        console.error(`🚨 Socket error for ${socket.username}:`, error);
    });
});

// Protected route example
app.get('/api/protected', authenticateRest, (req, res) => {
    res.json({ message: 'This is protected data', user: req.user });
});

// REST API authentication middleware
function authenticateRest(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

server.listen(3001, () => {
    console.log('🚀 Server running on port 3001 with JWT authentication');
});