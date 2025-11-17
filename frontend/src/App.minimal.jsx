// ============================================================
// 🎯 App.minimal.jsx - MINIMAL TEST VERSION
// No context providers, just basic React
// ============================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function SimpleLogin() {
    const [email, setEmail] = useState('demo@akig.com');
    const [password, setPassword] = useState('demo1234');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        console.log('Login attempt:', email);
        // Just redirect after 1 second
        setTimeout(() => {
            localStorage.setItem('token', 'fake-token');
            window.location.href = '/dashboard';
        }, 1000);
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #004E89 0%, #CE1126 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Montserrat, sans-serif'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <h1 style={{ color: '#004E89', marginBottom: '30px', fontSize: '32px' }}>
                    AKIG
                </h1>
                <p style={{ color: '#666', marginBottom: '30px' }}>
                    Gestion immobilière fiable, adaptée à la Guinée
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Email
                        </label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Mot de passe
                        </label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #004E89 0%, #1E7BA9 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    padding: '16px',
                    background: '#D4EDDA',
                    borderLeft: '4px solid #004E89',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#333'
                }}>
                    <strong style={{ color: '#004E89' }}>✓ Système AKIG opérationnel!</strong>
                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#f7f7fb',
            fontFamily: 'Montserrat, sans-serif'
        }}>
            <nav style={{
                background: 'linear-gradient(90deg, #004E89 0%, #1E7BA9 100%)',
                color: 'white',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '24px', margin: 0 }}>🏠 AKIG Dashboard</h1>
                    <button 
                        onClick={handleLogout}
                        style={{
                            padding: '10px 20px',
                            background: '#CE1126',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Déconnexion
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <h2 style={{ color: '#004E89', marginBottom: '20px' }}>
                        Bienvenue sur AKIG! 🎉
                    </h2>
                    <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
                        Vous êtes maintenant connecté au système de gestion immobilière AKIG.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginTop: '30px'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #004E89 0%, #1E7BA9 100%)',
                            color: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>📊 Contrats</h3>
                            <p style={{ margin: 0 }}>Gérez vos contrats immobiliers</p>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #CE1126 0%, #A00E27 100%)',
                            color: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>💰 Paiements</h3>
                            <p style={{ margin: 0 }}>Suivi des paiements de loyers</p>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #1E7BA9 0%, #004E89 100%)',
                            color: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>🏘️ Propriétés</h3>
                            <p style={{ margin: 0 }}>Gestion de vos propriétés</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#f7f7fb'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #004E89',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#666' }}>Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={<SimpleLogin />}
                />
                <Route 
                    path="/dashboard" 
                    element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
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
