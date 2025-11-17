// ============================================================
// 🔐 Register Page - Inscription Nouvel Utilisateur
// JWT Authentication flow
// ============================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader, User, Phone } from 'lucide-react';
import { Button, Card, Alert } from '../components';

const Register = ({ onRegister }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) {
            setError('Le prénom est requis');
            return false;
        }
        if (!formData.lastName.trim()) {
            setError('Le nom est requis');
            return false;
        }
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Email invalide');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }
        if (!formData.agreeTerms) {
            setError('Vous devez accepter les conditions d\'utilisation');
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Simuler requête API
            setTimeout(() => {
                // Créer token JWT simplifié
                const token = btoa(JSON.stringify({ email: formData.email, exp: Date.now() + 86400000 }));
                const user = {
                    email: formData.email,
                    name: `${formData.firstName} ${formData.lastName}`,
                    role: 'user'
                };

                // Sauvegarder token et user
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Appeler callback parent
                onRegister(token, user);

                // Rediriger
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Erreur lors de l\'inscription');
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
                            alt="Logo AKIG" 
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer un Compte</h2>
                        <p className="text-gray-600 mb-6">Rejoignez AKIG dès aujourd'hui</p>

                        {error && (
                            <Alert variant="error" className="mb-6">
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Nom et Prénom */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prénom
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="Jean"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Dupont"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adresse Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="vous@exemple.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Téléphone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone (Optionnel)
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="+224 6XX XXX XXX"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mot de Passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmer le Mot de Passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Conditions d'utilisation */}
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="agreeTerms"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                                    J'accepte les <Link to="/terms" className="text-blue-600 hover:underline">conditions d'utilisation</Link> et la <Link to="/privacy" className="text-blue-600 hover:underline">politique de confidentialité</Link>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        Inscription en cours...
                                    </>
                                ) : (
                                    'Créer mon Compte'
                                )}
                            </Button>
                        </form>

                        {/* Connexion existante */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Vous avez déjà un compte?{' '}
                                <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Footer */}
                <p className="text-center text-blue-100 text-xs mt-6">
                    © 2025 AKIG - Gestion Immobilière. Tous droits réservés.
                </p>
            </div>
        </div>
    );
};

export default Register;
