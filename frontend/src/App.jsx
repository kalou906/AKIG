// ============================================================
// 🎯 App.jsx - Application principale avec Router intégré
// ============================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// ============================================================
// 📦 Pages Import - ESSENTIAL ONLY
// ============================================================
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Settings from './pages/Settings';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import TenantPortal from './pages/TenantPortal';

// ============================================================
// 🧩 Layout Components
// ============================================================
import MainLayout from './components/layout/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UIConfigProvider } from './context/UIConfigContext';

// ============================================================
// 🔒 Protected Route
// ============================================================
const ProtectedRoute = ({ children, isAuthenticated, onLogout }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <MainLayout onLogout={onLogout}>{children}</MainLayout>;
};

// ============================================================
// 🚀 Main App Component
// ============================================================
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Vérifier authentification au chargement
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleLogin = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                    <p className="text-white text-lg font-semibold">Chargement AKIG...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <UIConfigProvider>
                <Router>
                    <Routes>
                        {/* Login */}
                        <Route
                            path="/login"
                            element={
                                isAuthenticated ? (
                                    <Navigate to="/dashboard" />
                                ) : (
                                    <Login onLogin={handleLogin} />
                                )
                            }
                        />

                        {/* Logout */}
                        <Route path="/logout" element={<Logout />} />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/properties"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Properties />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/contracts"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Contracts />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payments"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Payments />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tenants"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Tenants />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/clients"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Clients />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/projects"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Projects />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <Settings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tenant-portal"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <TenantPortal />
                                </ProtectedRoute>
                            }
                        />

                        {/* Redirects */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

                        {/* 404 */}
                        <Route
                            path="*"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated} onLogout={handleLogout}>
                                    <div className="text-center py-20">
                                        <h1 className="text-4xl font-bold text-gray-900">404 - Page non trouvée</h1>
                                    </div>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
            </UIConfigProvider>
        </ErrorBoundary>
    );
}

export default App;
