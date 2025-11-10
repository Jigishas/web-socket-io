import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatComponent = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [username, setUsername] = useState('');

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io('http://localhost:3000'); // Your server URL
        
        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from server');
        });

        // Listen for incoming messages
        newSocket.on('chat message', (data) => {
            setMessages(prev => [...prev, data]);
        });

        // Listen for user joined/left notifications
        newSocket.on('user joined', (data) => {
            setMessages(prev => [...prev, { 
                type: 'system', 
                message: data.message 
            }]);
        });

        newSocket.on('user left', (data) => {
            setMessages(prev => [...prev, { 
                type: 'system', 
                message: data.message 
            }]);
        });

        setSocket(newSocket);

        // Cleanup on component unmount
        return () => newSocket.close();
    }, []);

    // Send message function
    const sendMessage = (e) => {
        e.preventDefault();
        
        if (messageInput.trim() && socket) {
            const messageData = {
                id: Date.now(),
                username: username || 'Anonymous',
                text: messageInput,
                timestamp: new Date().toLocaleTimeString()
            };

            // Send message to server
            socket.emit('chat message', messageData);
            
            // Clear input
            setMessageInput('');
        }
    };

    // Join chat with username
    const joinChat = (e) => {
        e.preventDefault();
        if (username.trim() && socket) {
            socket.emit('user joined', { username });
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Chat Room</h2>
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
            </div>

            {/* Username Setup */}
            {!username && (
                <div className="username-setup">
                    <form onSubmit={joinChat}>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <button type="submit">Join Chat</button>
                    </form>
                </div>
            )}

            {/* Messages Display */}
            {username && (
                <>
                    <div className="messages-container">
                        {messages.map((msg, index) => (
                            <div key={msg.id || index} className={`message ${msg.type || 'user'}`}>
                                {msg.type === 'system' ? (
                                    <div className="system-message">{msg.message}</div>
                                ) : (
                                    <>
                                        <div className="message-header">
                                            <span className="username">{msg.username}</span>
                                            <span className="timestamp">{msg.timestamp}</span>
                                        </div>
                                        <div className="message-text">{msg.text}</div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="message-form">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            disabled={!isConnected}
                        />
                        <button type="submit" disabled={!isConnected || !messageInput.trim()}>
                            Send
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatComponent;