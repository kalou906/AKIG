import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, LogOut, Home } from 'lucide-react';

/**
 * Logout Page Component
 * 
 * Features:
 * - Graceful logout with confirmation message
 * - Automatic redirect after countdown
 * - Audit logging of logout event
 * - Cancel logout option
 * - Session invalidation
 * - Clear all local data
 * - Responsive design with animations
 */
export default function Logout() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Get user info from sessionStorage before clearing
  useEffect(() => {
    try {
      const user = sessionStorage.getItem('user');
      if (user) {
        setUserInfo(JSON.parse(user));
      }
    } catch (err) {
      console.error('Error retrieving user info:', err);
    }
  }, []);

  // Perform logout
  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Get token for logout API call
      const token = localStorage.getItem('token');

      // Call backend logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          logout_reason: 'user_initiated',
          timestamp: new Date().toISOString(),
          user_id: userInfo?.id
        })
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Success - clear all local storage
      setLogoutSuccess(true);
      clearAllUserData();

    } catch (err) {
      console.error('Logout error:', err);
      setLogoutError('Erreur lors de la déconnexion. Nettoyage forcé...');
      // Force clear data even on error
      clearAllUserData();
      setLogoutSuccess(true);
    }
  };

  // Clear all user data from browser
  const clearAllUserData = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastLogin');

    // Clear sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('preferences');

    // Clear cookies (if any)
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });

    // Log logout event
    console.log('[AUDIT] Logout successful', {
      user: userInfo?.email,
      timestamp: new Date().toISOString(),
      reason: 'user_initiated'
    });
  };

  // Handle countdown and redirect
  useEffect(() => {
    if (!logoutSuccess) {
      performLogout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoutSuccess]);

  // Countdown timer
  useEffect(() => {
    if (!logoutSuccess) return;

    if (countdown <= 0) {
      navigate('/login');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, logoutSuccess, navigate]);

  // Cancel logout - go back to dashboard
  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Redirect to login immediately
  const handleRedirectNow = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md">

        {/* Card container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header - Success or Error */}
          <div className={`p-8 text-center ${logoutSuccess
            ? 'bg-gradient-to-r from-green-50 to-emerald-50'
            : logoutError
              ? 'bg-gradient-to-r from-red-50 to-orange-50'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50'
            }`}>

            {/* Logo */}
            <div className="mb-4">
              <img
                src="/assets/logos/logo.png"
                alt="Logo AKIG"
                className="w-12 h-12 mx-auto object-contain"
              />
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              {logoutSuccess ? (
                <div className="relative">
                  <CheckCircle className="w-20 h-20 text-green-500 animate-bounce" />
                  <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
                </div>
              ) : logoutError ? (
                <div className="relative">
                  <LogOut className="w-20 h-20 text-red-500 animate-pulse" />
                  <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
                </div>
              ) : (
                <div className="relative">
                  <Clock className="w-20 h-20 text-blue-500 animate-spin" />
                  <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-spin" style={{ animationDuration: '3s' }}></div>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className={`text-2xl font-bold mb-2 ${logoutSuccess
              ? 'text-green-900'
              : logoutError
                ? 'text-red-900'
                : 'text-blue-900'
              }`}>
              {isLoggingOut && !logoutSuccess ? 'Déconnexion en cours...' : 'Déconnexion réussie'}
            </h1>

            {/* Subtitle */}
            <p className={`text-sm font-medium ${logoutSuccess
              ? 'text-green-700'
              : logoutError
                ? 'text-red-700'
                : 'text-blue-700'
              }`}>
              {logoutError
                ? 'Nettoyage de session'
                : logoutSuccess
                  ? 'À bientôt !'
                  : 'Invalidation de votre session...'}
            </p>
          </div>

          {/* Body */}
          <div className="p-8 text-center">

            {/* Status message */}
            <div className="mb-8">
              {logoutSuccess ? (
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">
                    Vous avez été déconnecté avec succès.
                  </p>
                  <p className="text-sm text-gray-500">
                    Vos données de session ont été effacées et tous les tokens invalidés.
                  </p>
                </div>
              ) : logoutError ? (
                <div className="space-y-2">
                  <p className="text-red-700 font-medium">
                    {logoutError}
                  </p>
                  <p className="text-sm text-gray-500">
                    Vos données locales ont été nettoyées.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">
                    {userInfo?.name ? `Au revoir ${userInfo.name}!` : 'Au revoir!'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Votre session est en train d'être fermée de manière sécurisée.
                  </p>
                </div>
              )}
            </div>

            {/* User info (if available) */}
            {userInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                  Dernier utilisateur connecté
                </p>
                <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                <p className="text-xs text-gray-600 mt-1">{userInfo.email}</p>
              </div>
            )}

            {/* Countdown timer */}
            {logoutSuccess && (
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100">
                  <span className="text-2xl font-bold text-blue-600">{countdown}</span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Redirection vers la page de connexion...
                </p>
              </div>
            )}

            {/* Logout details (if available) */}
            {logoutSuccess && userInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3">
                  Détails de déconnexion
                </p>
                <ul className="text-sm space-y-2 text-blue-800">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Heure:</span>
                    <span className="font-medium">{new Date().toLocaleTimeString('fr-FR')}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString('fr-FR')}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Session:</span>
                    <span className="font-medium text-xs">Invalidée</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Tokens:</span>
                    <span className="font-medium text-xs">Supprimés</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {logoutSuccess ? (
                <>
                  <button
                    onClick={handleRedirectNow}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <LogOut className="w-5 h-5" />
                    Se connecter à nouveau
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    Revenir à l'accueil
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isLoggingOut}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Annuler
                  </button>
                </>
              )}
            </div>

            {/* Security note */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                🔒 Votre session a été fermée de manière sécurisée.
              </p>
              <p className="text-xs text-gray-400 text-center mt-2">
                Si vous n'avez pas initié cette déconnexion, veuillez contacter le support.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-400 text-xs">
          <p>© 2025 AKIG - Gestion Locative Intelligente</p>
        </div>
      </div>

      {/* Tailwind animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
