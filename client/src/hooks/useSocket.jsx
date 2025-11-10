import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = (serverUrl) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token, user } = useAuth();
    const socketRef = useRef();

    useEffect(() => {
        if (!token || !user) {
            // Close existing socket if no token/user
            if (socketRef.current) {
                socketRef.current.close();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        console.log('🔗 Connecting to socket with token...');
        
        socketRef.current = io(serverUrl, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected with authentication');
            setIsConnected(true);
        });

        socketRef.current.on('reconnect', () => {
            console.log('🔄 Socket reconnected');
            setIsConnected(true);
        });

        socketRef.current.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 Reconnection attempt ${attempt}`);
        });

        socketRef.current.on('reconnect_error', (error) => {
            console.error('🚨 Reconnection error:', error.message);
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('🚨 Reconnection failed');
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('🚨 Socket connection error:', error.message);
            setIsConnected(false);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);
        });

        socketRef.current.on('error', (error) => {
            console.error('🚨 Socket error:', error);
        });

        setSocket(socketRef.current);

        return () => {
            if (socketRef.current) {
                console.log('🧹 Cleaning up socket connection');
                socketRef.current.close();
            }
        };
    }, [serverUrl, token, user]);

    return { socket, isConnected };
};
export default useSocket;