// ============================================================
// 🔐 Forgot Password Page
// Password recovery flow
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Veuillez entrer une adresse email valide');
            setLoading(false);
            return;
        }

        try {
            // Simuler requête API
            setTimeout(() => {
                setSuccessMessage(`Un lien de réinitialisation a été envoyé à ${email}`);
                setSubmitted(true);
                setLoading(false);

                // Rediriger après 3 secondes
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Erreur lors de la demande');
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

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Envoyé</h2>
                        <p className="text-gray-600 mb-6">
                            Nous avons envoyé un lien de réinitialisation de mot de passe à:
                        </p>
                        <p className="text-blue-600 font-semibold mb-6">{email}</p>

                        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-left">
                            <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes:</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>✓ Vérifiez votre email (dossier spam aussi)</li>
                                <li>✓ Cliquez sur le lien fourni</li>
                                <li>✓ Créez un nouveau mot de passe sécurisé</li>
                            </ul>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            Redirection vers la connexion dans 3 secondes...
                        </p>

                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                        >
                            <ArrowLeft size={18} />
                            Retour à la Connexion
                        </button>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Réinitialiser le Mot de Passe</h2>
                    <p className="text-gray-600 mb-6">
                        Entrez votre adresse email et nous vous enverrons un lien de réinitialisation
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="vous@exemple.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
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
                                    Envoi en cours...
                                </>
                            ) : (
                                'Envoyer le Lien de Réinitialisation'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">ou</span>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-3 text-center">
                        <p className="text-gray-600">
                            Vous vous souvenez de votre mot de passe?{' '}
                            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                                Se connecter
                            </Link>
                        </p>
                        <p className="text-gray-600">
                            Pas encore de compte?{' '}
                            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                                Créer un compte
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

export default ForgotPassword;
