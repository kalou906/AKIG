// ============================================================
// 🔐 Reset Password Page
// Password reset completion
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const token = searchParams.get('token');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return false;
        }
        if (!/(?=.*[a-z])/.test(formData.password)) {
            setError('Le mot de passe doit contenir au moins une lettre minuscule');
            return false;
        }
        if (!/(?=.*[A-Z])/.test(formData.password)) {
            setError('Le mot de passe doit contenir au moins une lettre majuscule');
            return false;
        }
        if (!/(?=.*\d)/.test(formData.password)) {
            setError('Le mot de passe doit contenir au moins un chiffre');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return false;
        }
        if (!token) {
            setError('Token invalide. Veuillez demander un nouveau lien.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Simuler requête API
            setTimeout(() => {
                setSuccessMessage('Mot de passe réinitialisé avec succès!');
                setSubmitted(true);
                setLoading(false);

                // Rediriger après 2 secondes
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Erreur lors de la réinitialisation');
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center p-4">
                {/* Décoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                </div>

                {/* Container */}
                <div className="w-full max-w-md relative z-10">
                    {/* Success Card */}
                    <div className="bg-white/95 backdrop-blur shadow-2xl rounded-lg p-8 text-center">
                        {/* Logo */}
                        <div className="mb-4">
                            <img 
                                src="/assets/logos/logo.png" 
                                alt="Logo AKIG" 
                                className="w-12 h-12 mx-auto object-contain"
                            />
                        </div>

                        {/* Success Icon */}
                        <div className="mb-6">
                            <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-bounce" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de Passe Réinitialisé</h2>
                        <p className="text-gray-600 mb-6">
                            Votre mot de passe a été réinitialisé avec succès!
                        </p>

                        <p className="text-sm text-gray-600 mb-6">
                            Vous allez être redirigé vers la page de connexion...
                        </p>

                        <Link
                            to="/login"
                            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                        >
                            Aller à la Connexion
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                <div className="bg-white/95 backdrop-blur shadow-2xl rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer un Nouveau Mot de Passe</h2>
                    <p className="text-gray-600 mb-6">
                        Entrez un nouveau mot de passe sécurisé pour votre compte
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nouveau Mot de Passe
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
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Min. 8 caractères avec majuscules, minuscules et chiffres
                            </p>
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
                                    required
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

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    Réinitialisation en cours...
                                </>
                            ) : (
                                'Réinitialiser le Mot de Passe'
                            )}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Vous avez un compte?{' '}
                            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-100 text-xs mt-6">
                    © 2025 AKIG - Gestion Immobilière. Tous droits réservés.
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
