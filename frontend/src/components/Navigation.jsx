/**
 * Navigation.jsx - Menu de navigation avec thème guinéen
 * Toutes les fonctionnalités intégrées: Phases 8-10 inclus
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutGrid,
  Building2,
  Users,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
  BarChart3,
  Paperclip,
  TrendingUp,
  Home,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import './Navigation.css';

export default function Navigation({ onLogout, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const location = useLocation();

  const menuItems = [
    {
      label: 'Tableau de bord',
      icon: LayoutGrid,
      path: '/dashboard',
      color: 'primary'
    },
    {
      label: 'Propriétés',
      icon: Building2,
      path: '/properties',
      color: 'primary'
    },
    {
      label: 'Propriétaires',
      icon: Users,
      path: '/proprietaires',
      color: 'secondary'
    },
    {
      label: 'Locataires',
      icon: Users,
      path: '/locataires',
      color: 'secondary'
    },
    {
      label: 'Contrats',
      icon: FileText,
      path: '/contracts',
      color: 'primary'
    },
    {
      label: 'Paiements',
      icon: DollarSign,
      path: '/payments',
      color: 'accent'
    },

    // Phase 8-10 Menu Items (NEW)
    {
      label: 'Candidatures',
      icon: ClipboardList,
      path: '/candidatures',
      color: 'success',
      badge: 'Nouveau'
    },
    {
      label: 'Pièces Jointes',
      icon: Paperclip,
      path: '/attachments',
      color: 'info',
      badge: 'Nouveau'
    },
    {
      label: 'Rapports',
      icon: BarChart3,
      path: '/reports',
      color: 'warning',
      adminOnly: true,
      badge: 'Nouveau'
    },

    {
      label: 'Paramètres',
      icon: Settings,
      path: '/settings',
      color: 'text'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="akig-navigation guinean-nav">
      {/* Mobile Toggle */}
      <div className="nav-mobile-toggle">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="toggle-button"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <ul className={`nav-menu ${isOpen ? 'open' : ''}`}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={index} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''} color-${item.color}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            </li>
          );
        })}

        {/* Divider */}
        <li className="nav-divider"></li>

        {/* User Info */}
        <li className="nav-user-info">
          <div className="user-avatar">
            {userName?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name">{userName}</p>
            <p className="user-role">Administrateur</p>
          </div>
        </li>

        {/* Logout */}
        <li className="nav-item logout-item">
          <button
            onClick={onLogout}
            className="nav-link logout-link"
          >
            <LogOut size={20} className="nav-icon" />
            <span className="nav-label">Déconnexion</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
