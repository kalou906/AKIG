import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="akig-header">
      <div className="container header-inner">
        <Link to="/dashboard" className="brand-link">
          <div className="brand">
            <img 
              src="/assets/logos/logo.png" 
              alt="Logo AKIG" 
              className="brand-logo"
              title="Retour au tableau de bord"
            />
            <div className="brand-text">
              <h1>AKIG</h1>
              <span className="tag">Gestion Immobilière</span>
            </div>
          </div>
        </Link>

        <div className="header-actions">
          <div className="search">
            <input placeholder="Rechercher..." />
          </div>
          <div className="user">
            <img src="/avatar.png" alt="avatar" />
            <div className="user-info">
              <div className="user-name">Nom Utilisateur</div>
              <div className="user-role">Admin</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
