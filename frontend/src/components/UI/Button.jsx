/**
 * Button.jsx - Composant Button réutilisable
 * Types: primary, secondary, danger, success, warning
 */

import React from 'react';
import './Button.css';

export default function Button({ type = 'primary', children, className = '', loading = false, disabled = false, ...props }) {
    const styles = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        success: 'btn-success',
        warning: 'btn-warning',
        ghost: 'btn-ghost',
    };

    return (
        <button
            className={`btn ${styles[type]} ${loading ? 'btn-loading' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <span className="spinner"></span> : null}
            {children}
        </button>
    );
}
