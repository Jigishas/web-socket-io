// Enhanced React component with logging
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const DebugChatComponent = () => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');

    useEffect(() => {
        const newSocket = io('http://localhost:3000', {
            // Enable debug mode
            debug: true
        });

        // Log all events
        newSocket.onAny((eventName, ...args) => {
            console.log('📡 INCOMING EVENT:', eventName, args);
        });

        newSocket.on('connect', () => {
            console.log('✅ CONNECTED - Socket ID:', newSocket.id);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ DISCONNECTED - Reason:', reason);
        });

        newSocket.on('chat message', (data) => {
            console.log('💬 MESSAGE RECEIVED:', data);
            setMessages(prev => [...prev, data]);
        });

        newSocket.on('user joined', (data) => {
            console.log('👤 USER JOINED:', data);
        });

        newSocket.on('user left', (data) => {
            console.log('👤 USER LEFT:', data);
        });

        // Log connection details
        console.log('🔗 Socket instance:', newSocket);
        console.log('🔄 Transport:', newSocket.io.engine.transport.name);

        setSocket(newSocket);

        return () => {
            console.log('🧹 Cleaning up socket connection');
            newSocket.close();
        };
    }, []);

    const sendMessage = (e) => {
        e.preventDefault();
        
        if (messageInput.trim() && socket) {
            const messageData = {
                id: Date.now(),
                username: 'User',
                text: messageInput,
                timestamp: new Date().toLocaleTimeString(),
                socketId: socket.id
            };

            console.log('📤 SENDING MESSAGE:', messageData);
            
            socket.emit('chat message', messageData);
            setMessageInput('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Debug Chat</h2>
            <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Socket Status:</span>
                    <span className={`px-2 py-1 rounded text-sm ${socket?.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {socket?.connected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Socket ID:</span>
                    <span className="text-gray-600">{socket?.id}</span>
                </div>
            </div>

            <div className="border border-gray-300 rounded-lg h-64 overflow-y-auto p-3 mb-4 bg-gray-50">
                {messages.map((msg, index) => (
                    <div key={index} className="mb-2 p-2 bg-white rounded border">
                        <strong className="text-gray-800">{msg.username}:</strong> {msg.text}
                        <small className="text-gray-500 ml-2">({msg.timestamp})</small>
                    </div>
                ))}
            </div>

            <form onSubmit={sendMessage} className="flex gap-3 mb-4">
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Send
                </button>
            </form>

            <button
                onClick={() => console.log('🔍 Current messages:', messages)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
                Log Messages to Console
            </button>
        </div>
    );
};
export default DebugChatComponent;