/**
 * Header.jsx - En-tête remarquable avec thème Guinéen
 * Logo, titre, indicateurs, notifications
 * Phases 8-10 intégrées
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  Settings,
  User,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import './Header.css';

export default function Header({ userName, userRole }) {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    candidatures: 12,
    files: 24,
    reports: 5,
    alerts: 3
  });

  // Page titles mapping
  const pageTitles = {
    '/dashboard': 'Tableau de Bord Principal',
    '/properties': 'Gestion des Propriétés',
    '/proprietaires': 'Propriétaires',
    '/locataires': 'Locataires',
    '/contracts': 'Contrats de Location',
    '/payments': 'Gestion des Paiements',
    '/candidatures': 'Candidatures de Location',
    '/reports': 'Rapports & Analyses',
    '/settings': 'Paramètres Système'
  };

  const pageTitle = pageTitles[location.pathname] || 'AKIG - Système de Gestion Immobilière';

  useEffect(() => {
    // Load sample notifications
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const sampleNotifications = [
      { id: 1, type: 'success', title: 'Candidature approuvée', message: 'Jean Dupont - 3 chambres', time: '2 min' },
      { id: 2, type: 'alert', title: 'Paiement en retard', message: 'Loc. Conakry apt 42', time: '15 min' },
      { id: 3, type: 'info', title: 'Nouveau rapport généré', message: 'Rapport fiscal Q4', time: '1 h' },
      { id: 4, type: 'warning', title: 'Pièce jointe manquante', message: 'Contrat - Local 22', time: '3 h' },
      { id: 5, type: 'success', title: 'Fichier téléchargé', message: 'Candidature_2025.pdf', time: '5 h' }
    ];
    setNotifications(sampleNotifications);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="notification-icon success" />;
      case 'alert':
        return <AlertCircle className="notification-icon alert" />;
      case 'warning':
        return <Clock className="notification-icon warning" />;
      default:
        return <TrendingUp className="notification-icon info" />;
    }
  };

  return (
    <header className="akig-header guinean-header">
      {/* Logo & Title Section */}
      <div className="header-logo-section">
        <div className="logo-container">
          <div className="logo-svg">
            {/* Guinean Flag Colors */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              {/* House icon with Guinean flag */}
              <rect width="40" height="40" rx="8" fill="url(#gradientLogo)" />
              <path
                d="M20 8L30 16H28V28H12V16H10L20 8Z"
                fill="white"
                opacity="0.9"
              />
              <rect x="14" y="18" width="4" height="4" fill="#004E89" />
              <rect x="22" y="18" width="4" height="4" fill="#004E89" />
              <rect x="18" y="22" width="4" height="4" fill="#CE1126" />
              <defs>
                <linearGradient
                  id="gradientLogo"
                  x1="0"
                  y1="0"
                  x2="40"
                  y2="40"
                >
                  <stop offset="0%" stopColor="#004E89" />
                  <stop offset="50%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#CE1126" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="title-section">
          <h1 className="header-title">AKIG</h1>
          <p className="header-subtitle">Agence Immobilière Guinéenne</p>
        </div>
      </div>

      {/* Page Title */}
      <div className="page-title-section">
        <h2 className="page-title">{pageTitle}</h2>
      </div>

      {/* Stats Bar */}
      <div className="header-stats">
        <div className="stat-item">
          <div className="stat-icon candidatures">
            <BarChart3 size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Candidatures</span>
            <span className="stat-value">{stats.candidatures}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon files">
            <span>📎</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Fichiers</span>
            <span className="stat-value">{stats.files}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon reports">
            <TrendingUp size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Rapports</span>
            <span className="stat-value">{stats.reports}</span>
          </div>
        </div>
        <div className="stat-item alert">
          <div className="stat-icon alerts">
            <AlertCircle size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Alertes</span>
            <span className="stat-value">{stats.alerts}</span>
          </div>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="header-actions">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher (Ctrl + K)"
            className="search-input"
          />
        </div>

        {/* Notifications */}
        <div className="notification-container">
          <button
            className="notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            <span className="notification-badge">{notifications.length}</span>
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="close-btn">×</button>
              </div>
              <div className="notifications-list">
                {notifications.map(notif => (
                  <div key={notif.id} className={`notification-item ${notif.type}`}>
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">{notif.title}</p>
                      <p className="notification-message">{notif.message}</p>
                      <span className="notification-time">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <button className="view-all-btn">Voir toutes les notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button className="header-action-btn settings-btn" title="Paramètres">
          <Settings size={20} />
        </button>

        {/* User Profile */}
        <div className="user-profile-section">
          <div className="user-avatar-small">
            {userName?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info-small">
            <p className="user-name-small">{userName}</p>
            <p className="user-role-small">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
