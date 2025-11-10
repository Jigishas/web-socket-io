const { socketAuthMiddleware } = require('../middleware/auth');
const { saveMessage } = require('../controllers/messages');

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.users = new Map();
        
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
                }
            });

            // Handle typing indicators
            socket.on('typing start', () => {
                socket.broadcast.emit('user typing', {
                    username: socket.user.username,
                    userId: socket.user._id
                });
            });

            socket.on('typing stop', () => {
                socket.broadcast.emit('user stopped typing', {
                    username: socket.user.username,
                    userId: socket.user._id
                });
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`User ${socket.user.username} disconnected`);
                this.users.delete(socket.id);
                
                socket.broadcast.emit('user left', {
                    username: socket.user.username,
                    userId: socket.user._id,
                    timestamp: new Date()
                });

                this.broadcastOnlineUsers();
            });
        });
    }

    broadcastOnlineUsers() {
        const onlineUsers = Array.from(this.users.values());
        this.io.emit('online users', onlineUsers);
    }
}

module.exports = SocketHandler;