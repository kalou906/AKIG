import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="akig-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img 
            src="/assets/logos/logo.png" 
            alt="Logo AKIG" 
            className="footer-logo"
            title="AKIG - Gestion Immobilière"
          />
          <span className="footer-title">AKIG</span>
        </div>
        
        <div className="footer-content">
          <div className="footer-copyright">
            © {new Date().getFullYear()} AKIG - Gestion Immobilière Premium
          </div>
          <div className="footer-links">
            <Link to="/terms" className="link">Mentions légales</Link>
            <span className="separator">·</span>
            <Link to="/privacy" className="link">Confidentialité</Link>
            <span className="separator">·</span>
            <Link to="/contact" className="link">Contact</Link>
          </div>
        </div>

        <div className="footer-social">
          <span className="social-text">Suivez-nous</span>
          <div className="social-links">
            <a href="#" title="Facebook" aria-label="Facebook">f</a>
            <a href="#" title="Twitter" aria-label="Twitter">𝕏</a>
            <a href="#" title="LinkedIn" aria-label="LinkedIn">in</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
