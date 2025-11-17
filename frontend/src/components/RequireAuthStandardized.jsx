/**
 * ============================================================
 * RequireAuth.jsx - Protection des routes nécessitant authentification
 * Vérifie akig_token, redirige vers /login si absent
 * ============================================================
 */

import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Vérifier token au chargement du composant
    const token = localStorage.getItem('akig_token') || localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.log('[RequireAuth] Vérification token:', {
      hasToken: !!token,
      hasUser: !!user,
      path: location.pathname,
    });

    if (token && user) {
      setIsAuthenticated(true);
    } else {
      console.warn('[RequireAuth] Pas de token - redirection vers /login');
      setIsAuthenticated(false);
    }
  }, [location.pathname]);

  // Pendant la vérification, afficher loading
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification authentification...</p>
        </div>
      </div>
    );
  }

  // Si authentifié, afficher la page enfant
  if (isAuthenticated) {
    return <Outlet />;
  }

  // Sinon, rediriger vers login (en gardant la page demandée en référence)
  return <Navigate to="/login" state={{ from: location }} replace />;
}
