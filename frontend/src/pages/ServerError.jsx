/**
 * ServerError Page (500) with AKIG Logo
 * 
 * Displays when server encounters an error
 * Includes logo branding and recovery options
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';
import './ErrorPages.css';

const ServerError = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="error-page-container error-page-server">
      <div className="error-page-content">
        {/* Logo Section */}
        <div className="error-page-logo-section">
          <img 
            src="/assets/logos/logo.png" 
            alt="Logo AKIG" 
            className="error-page-logo"
          />
          <h1 className="error-page-code error-page-code-danger">500</h1>
        </div>

        {/* Alert Section */}
        <div className="error-page-alert">
          <AlertCircle size={24} />
          <span>Something went wrong on our end</span>
        </div>

        {/* Message Section */}
        <div className="error-page-message-section">
          <h2 className="error-page-title">Server Error</h2>
          <p className="error-page-description">
            We're experiencing temporary issues. Our team has been notified and is
            working on a fix. Please try again in a few moments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="error-page-actions">
          <button 
            onClick={handleReload} 
            className="error-page-btn error-page-btn-primary"
          >
            <RefreshCw size={18} />
            Refresh Page
          </button>
          <Link to="/" className="error-page-btn error-page-btn-secondary">
            <Home size={18} />
            Go to Dashboard
          </Link>
        </div>

        {/* Footer Link */}
        <div className="error-page-footer">
          <p>Error persists? <Link to="/support">Report Issue</Link></p>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="error-page-decoration error-page-decoration-error"></div>
    </div>
  );
};

export default ServerError;
