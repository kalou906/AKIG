import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FR } from '../i18n/fr';

/**
 * Composant Navbar
 * Barre de navigation supérieure
 */
export function Navbar(): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-blue-600">{FR.common.appName}</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded" title="Notifications">
            🔔
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="Paramètres">
            ⚙️
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="Profil">
            👤
          </button>
        </div>
      </div>
    </nav>
  );
}

/**
 * Composant Sidebar
 * Barre de navigation latérale
 */
export function Sidebar(): React.ReactElement {
  const location = useLocation();

  const links = [
    { path: '/dashboard', label: '📊 Tableau de bord', icon: '📊' },
    { path: '/tenants', label: '👥 Locataires', icon: '👥' },
    { path: '/import-csv', label: '📥 Import CSV', icon: '📥' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">🏢 AKIG</h1>
        <p className="text-xs text-gray-400 mt-1">Gestion Immobilière</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-4 py-3 rounded transition ${
              isActive(link.path)
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="mr-2">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <div>v1.0.0</div>
        <div className="mt-2">
          <a href="#" className="hover:text-white">
            Aide
          </a>
          {' • '}
          <a href="#" className="hover:text-white">
            Déconnexion
          </a>
        </div>
      </div>
    </aside>
  );
}
