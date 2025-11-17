// ============================================================
// 🔐 Login Page - Authentification Utilisateur
// JWT Authentication flow
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { Button, Card, Alert } from '../components';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: 'demo@akig.com',
        password: 'demo1234',
        rememberMe: true
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Simuler requête API
            setTimeout(() => {
                // Créer token JWT simplifié
                const token = btoa(JSON.stringify({ email: formData.email, exp: Date.now() + 86400000 }));
                const user = {
                    email: formData.email,
                    name: formData.email === 'demo@akig.com' ? 'Démo User' : 'User',
                    role: formData.email === 'demo@akig.com' ? 'admin' : 'user'
                };

                // Sauvegarder token et user
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                if (formData.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('rememberedEmail', formData.email);
                }

                // Appeler callback parent
                onLogin(token, user);

                // Rediriger
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Erreur de connexion');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center p-4">
            {/* Décoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            </div>

            {/* Container */}
            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img
                            src="/assets/logos/logo.png"
                            alt="Logo"
                            className="w-14 h-14 object-contain drop-shadow-lg rounded-xl"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-white">AKIG</h1>
                            <p className="text-blue-100 text-sm">Gestion Immobilière Premium</p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="bg-white/95 backdrop-blur shadow-2xl">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
                        <p className="text-gray-600 mb-6">Accédez à votre tableau de bord</p>

                        {error && (
                            <Alert variant="error" className="mb-6">
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adresse Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="votre@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mot de Passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                                    Se souvenir de moi
                                </label>
                            </div>

                            {/* Login Button */}
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-2.5 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading && <Loader size={18} className="animate-spin" />}
                                {loading ? 'Connexion en cours...' : 'Se Connecter'}
                            </Button>

                            {/* Forgot Password */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => console.log('Forgot password clicked')}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium bg-transparent border-none cursor-pointer"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-xs text-gray-600 text-center mb-3">Demo Credentials:</p>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs text-gray-700"><strong>Email:</strong> demo@akig.com</p>
                                <p className="text-xs text-gray-700"><strong>Password:</strong> demo1234</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-white/80">
                    <p className="text-sm">© 2024 AKIG - Tous droits réservés</p>
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <button type="button" onClick={() => console.log('Conditions')} className="text-sm hover:text-white transition-colors bg-transparent border-none cursor-pointer">Conditions</button>
                        <span>•</span>
                        <button type="button" onClick={() => console.log('Confidentialité')} className="text-sm hover:text-white transition-colors bg-transparent border-none cursor-pointer">Confidentialité</button>
                        <span>•</span>
                        <button type="button" onClick={() => console.log('Contact')} className="text-sm hover:text-white transition-colors bg-transparent border-none cursor-pointer">Contact</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
