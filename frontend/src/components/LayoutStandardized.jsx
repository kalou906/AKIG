/**
 * ============================================================
 * Layout.jsx - Navigation standardisée avec Outlet
 * Structure: Header (nav) → Outlet (pages enfant) → Footer
 * ============================================================
 */

import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Home, FileText, CreditCard, Building, Users, BarChart3, Bell, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Vérifier si utilisateur connecté
  const token = localStorage.getItem('akig_token') || localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('akig_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Déterminer si route active
  const isActive = (path) => location.pathname === path;
  const navClass = (path) =>
    `px-4 py-2 rounded-md transition ${
      isActive(path)
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  // Si pas connecté et pas sur /login, ne pas afficher nav
  if (!token && location.pathname !== '/login') {
    return <Outlet />;
  }

  // Si sur /login, pas de header/footer
  if (location.pathname === '/login') {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">AKIG</h1>
          <p className="text-xs text-gray-500">Gestion Immobilière</p>
        </div>

        <div className="px-4 py-2 space-y-2">
          <Link to="/" className={`flex items-center gap-2 ${navClass('/')}`}>
            <Home size={18} />
            Tableau de Bord
          </Link>

          <Link to="/contrats" className={`flex items-center gap-2 ${navClass('/contrats')}`}>
            <FileText size={18} />
            Contrats
          </Link>

          <Link to="/paiements" className={`flex items-center gap-2 ${navClass('/paiements')}`}>
            <CreditCard size={18} />
            Paiements
          </Link>

          <Link to="/proprietes" className={`flex items-center gap-2 ${navClass('/proprietes')}`}>
            <Building size={18} />
            Propriétés
          </Link>

          <Link to="/locataires" className={`flex items-center gap-2 ${navClass('/locataires')}`}>
            <Users size={18} />
            Locataires
          </Link>

          <Link to="/rapports" className={`flex items-center gap-2 ${navClass('/rapports')}`}>
            <BarChart3 size={18} />
            Rapports
          </Link>

          <Link to="/rappels" className={`flex items-center gap-2 ${navClass('/rappels')}`}>
            <Bell size={18} />
            Rappels
          </Link>

          <Link to="/preavis" className={`flex items-center gap-2 ${navClass('/preavis')}`}>
            <AlertTriangle size={18} />
            Préavis
          </Link>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
