// ============================================================
// 🎯 App.jsx - TEST SIMPLE - Version de diagnostic
// ============================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import simple pages
import Login from './pages/Login';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleLogin = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={<Login onLogin={handleLogin} />}
                />
                <Route 
                    path="/" 
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
                />
            </Routes>
        </Router>
    );
}

export default App;
