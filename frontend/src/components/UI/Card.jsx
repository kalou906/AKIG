/**
 * Card.jsx - Composant Card réutilisable
 * Affiche contenu avec titre et style cohérent
 */

import React from 'react';
import './Card.css';

export default function Card({ title, subtitle, children, className = '', icon = null, footer = null }) {
    return (
        <div className={`card ${className}`}>
            {(title || icon) && (
                <div className="card-header">
                    {icon && <span className="card-icon">{icon}</span>}
                    <div>
                        {title && <h3 className="card-title">{title}</h3>}
                        {subtitle && <p className="card-subtitle">{subtitle}</p>}
                    </div>
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
}
