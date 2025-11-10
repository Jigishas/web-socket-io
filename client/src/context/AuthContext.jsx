import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if token exists and is valid
        if (token) {
            validateToken();
        } else {
            setLoading(false);
        }
    }, [token]);

    const validateToken = async () => {
        try {
            // You could make an API call to validate the token
            // For now, we'll just decode it (note: this doesn't verify signature)
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            if (payload.exp * 1000 > Date.now()) {
                setUser({ username: payload.username, userId: payload.userId });
            } else {
                logout();
            }
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (username, password) => {
        try {
            const response = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};