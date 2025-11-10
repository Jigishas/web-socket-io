import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { socket, isConnected } = useSocket('http://localhost:3000');
    const { user, token, logout } = useAuth();
    const messagesEndRef = useRef(null);

    // Fetch chat history
    const fetchMessages = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch messages when component mounts
    useEffect(() => {
        if (token) {
            fetchMessages();
        }
    }, [token]);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (data) => {
            setMessages(prev => [...prev, data]);
        };

        const handleOnlineUsers = (users) => {
            setOnlineUsers(users);
        };

        const handleUserJoined = (data) => {
            setMessages(prev => [...prev, {
                type: 'system',
                message: `${data.username} joined the chat`
            }]);
        };

        const handleUserLeft = (data) => {
            setMessages(prev => [...prev, {
                type: 'system',
                message: `${data.username} left the chat`
            }]);
        };

        const handleUserTyping = (data) => {
            setTypingUsers(prev => {
                const filtered = prev.filter(u => u.userId !== data.userId);
                return [...filtered, data];
            });
        };

        const handleUserStoppedTyping = (data) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        };

        socket.on('chat message', handleChatMessage);
        socket.on('online users', handleOnlineUsers);
        socket.on('user joined', handleUserJoined);
        socket.on('user left', handleUserLeft);
        socket.on('user typing', handleUserTyping);
        socket.on('user stopped typing', handleUserStoppedTyping);

        return () => {
            socket.off('chat message', handleChatMessage);
            socket.off('online users', handleOnlineUsers);
            socket.off('user joined', handleUserJoined);
            socket.off('user left', handleUserLeft);
            socket.off('user typing', handleUserTyping);
            socket.off('user stopped typing', handleUserStoppedTyping);
        };
    }, [socket]);

    const sendMessage = (e) => {
        e.preventDefault();
        
        if (messageInput.trim() && socket) {
            socket.emit('chat message', {
                text: messageInput
            });
            setMessageInput('');
            stopTyping();
        }
    };

    const startTyping = () => {
        if (socket) {
            socket.emit('typing start');
        }
    };

    const stopTyping = () => {
        if (socket) {
            socket.emit('typing stop');
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        startTyping();
    };

    if (!user) {
        return <div className="text-center text-gray-600">Please log in to chat</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Chat Room</h2>
                    <div className="text-gray-600">Welcome, <strong className="text-gray-800">{user.username}</strong>!</div>
                    <div className="text-sm text-gray-500">Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
                </div>
                <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                    Logout
                </button>
            </div>

            <div className="flex gap-6">
                {/* Online Users */}
                <div className="w-48">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Online Users ({onlineUsers.length})</h3>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-96 overflow-y-auto">
                        {onlineUsers.map(onlineUser => (
                            <div key={onlineUser.userId} className={`p-2 my-1 rounded ${onlineUser.userId === user.userId ? 'bg-blue-100' : ''}`}>
                                {onlineUser.username}
                                {onlineUser.userId === user.userId && ' (You)'}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1">
                    {/* Typing Indicators */}
                    {typingUsers.length > 0 && (
                        <div className="p-2 italic text-gray-600 mb-3">
                            {typingUsers.map(u => u.username).join(', ')}
                            {typingUsers.length === 1 ? ' is' : ' are'} typing...
                        </div>
                    )}

                    {/* Messages */}
                    <div className="h-96 border border-gray-300 rounded-lg p-3 overflow-y-auto mb-3 bg-white">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-gray-500">Loading messages...</div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-4">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div key={msg._id || index} className={`mb-3 p-3 rounded-lg ${
                                    msg.type === 'system'
                                        ? 'bg-yellow-50 border-l-4 border-yellow-400 text-center text-yellow-800'
                                        : msg.userId === user.userId
                                            ? 'bg-blue-50 border-l-4 border-blue-400'
                                            : 'bg-gray-50 border-l-4 border-gray-400'
                                }`}>
                                    {msg.type === 'system' ? (
                                        <div>{msg.message}</div>
                                    ) : (
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <strong className="text-gray-800">{msg.username}</strong>
                                                <small className="text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</small>
                                            </div>
                                            <div className="text-gray-700">{msg.text}</div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={messageInput}
                            onChange={handleInputChange}
                            onBlur={stopTyping}
                            placeholder="Type your message..."
                            disabled={!isConnected}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={!isConnected || !messageInput.trim()}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;