const { socketAuthMiddleware } = require('../middleware/auth');
const { saveMessage } = require('../controllers/messages');

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.users = new Map();
        this.typingUsers = new Map();

        // Apply authentication middleware
        this.io.use(socketAuthMiddleware);

        // Initialize socket event handlers
        this.init();
    }

    init() {
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.user.username} connected (${socket.id})`);

            // Add user to connected users
            this.users.set(socket.id, {
                id: socket.user._id,
                username: socket.user.username,
                socketId: socket.id
            });

            // Join user to their personal room for private messages
            socket.join(socket.user._id.toString());

            // Broadcast user joined
            socket.broadcast.emit('user joined', {
                username: socket.user.username,
                userId: socket.user._id,
                timestamp: new Date()
            });

            // Send online users list
            this.broadcastOnlineUsers();

            // Handle chat messages
            socket.on('chat message', async (data) => {
                try {
                    if (!data || typeof data !== 'object' || !data.text) {
                        socket.emit('error', { message: 'Invalid message data' });
                        return;
                    }

                    const messageData = {
                        username: socket.user.username,
                        userId: socket.user._id,
                        text: data.text,
                        timestamp: new Date()
                    };

                    // Save message to database
                    const savedMessage = await saveMessage(messageData);
                    if (savedMessage) {
                        this.io.emit('chat message', savedMessage);
                    } else {
                        socket.emit('error', { message: 'Failed to save message' });
                    }
                } catch (error) {
                    console.error('Chat message error:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Handle private messages
            socket.on('private message', async (data) => {
                try {
                    if (!data || !data.toUserId || !data.text) {
                        socket.emit('error', { message: 'Invalid private message data' });
                        return;
                    }

                    const targetUser = this.users.get(data.toUserId);
                    if (!targetUser) {
                        socket.emit('error', { message: 'User not found or offline' });
                        return;
                    }

                    const messageData = {
                        id: Date.now(),
                        from: socket.user.username,
                        fromUserId: socket.user._id,
                        toUserId: data.toUserId,
                        text: data.text,
                        timestamp: new Date().toISOString(),
                        isPrivate: true
                    };

                    // Send to target user
                    this.io.to(data.toUserId).emit('private message', messageData);

                    // Send back to sender
                    socket.emit('private message', { ...messageData, isOwnMessage: true });
                } catch (error) {
                    console.error('Private message error:', error);
                    socket.emit('error', { message: 'Failed to send private message' });
                }
            });

            // Handle typing indicators
            socket.on('typing start', () => {
                this.typingUsers.set(socket.id, socket.user.username);
                socket.broadcast.emit('user typing', {
                    username: socket.user.username,
                    userId: socket.user._id
                });
            });

            socket.on('typing stop', () => {
                this.typingUsers.delete(socket.id);
                socket.broadcast.emit('user stopped typing', {
                    username: socket.user.username,
                    userId: socket.user._id
                });
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`User ${socket.user.username} disconnected: ${reason}`);
                this.users.delete(socket.id);
                this.typingUsers.delete(socket.id);

                socket.broadcast.emit('user left', {
                    username: socket.user.username,
                    userId: socket.user._id,
                    timestamp: new Date()
                });

                this.broadcastOnlineUsers();
            });

            // Handle socket errors
            socket.on('error', (error) => {
                console.error(`Socket error for ${socket.user.username}:`, error);
            });
        });
    }

    broadcastOnlineUsers() {
        const onlineUsers = Array.from(this.users.values());
        this.io.emit('online users', onlineUsers);
    }

    // Method to get online users (for external use)
    getOnlineUsers() {
        return Array.from(this.users.values());
    }

    // Method to check if user is online
    isUserOnline(userId) {
        return Array.from(this.users.values()).some(user => user.id.toString() === userId.toString());
    }
}

module.exports = SocketHandler;
