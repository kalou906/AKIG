/**
 * NotFound Page (404) with AKIG Logo
 * 
 * Displays when user navigates to non-existent route
 * Includes logo branding and navigation options
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import './ErrorPages.css';

const NotFound = () => {
  return (
    <div className="error-page-container">
      <div className="error-page-content">
        {/* Logo Section */}
        <div className="error-page-logo-section">
          <img 
            src="/assets/logos/logo.png" 
            alt="Logo AKIG" 
            className="error-page-logo"
          />
          <h1 className="error-page-code">404</h1>
        </div>

        {/* Message Section */}
        <div className="error-page-message-section">
          <h2 className="error-page-title">Page Not Found</h2>
          <p className="error-page-description">
            Oops! The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="error-page-actions">
          <Link to="/" className="error-page-btn error-page-btn-primary">
            <Home size={18} />
            Go to Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="error-page-btn error-page-btn-secondary"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Footer Link */}
        <div className="error-page-footer">
          <p>Need help? <Link to="/support">Contact Support</Link></p>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="error-page-decoration"></div>
    </div>
  );
};

export default NotFound;
