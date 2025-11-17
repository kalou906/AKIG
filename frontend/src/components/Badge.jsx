// ============================================================
// 🏷️  Badge Component - Status & Tag Display
// ============================================================

import React from 'react';
import PropTypes from 'prop-types';

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    icon: Icon,
    ...props
}) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        secondary: 'bg-indigo-100 text-indigo-800',
        success: 'bg-green-100 text-green-800',
        danger: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-cyan-100 text-cyan-800',
        purple: 'bg-purple-100 text-purple-800',
        pink: 'bg-pink-100 text-pink-800',
        // Status badges
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        confirmed: 'bg-blue-100 text-blue-800',
        rented: 'bg-indigo-100 text-indigo-800',
        available: 'bg-green-100 text-green-800',
        terminated: 'bg-gray-100 text-gray-800',
        'paid_in_full': 'bg-green-100 text-green-800',
        'overdue': 'bg-red-100 text-red-800',
        // Seasonal statuses
        'checked_in': 'bg-blue-100 text-blue-800',
        // SCI roles
        'manager': 'bg-purple-100 text-purple-800',
        'investor': 'bg-indigo-100 text-indigo-800'
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs font-medium',
        md: 'px-3 py-1 text-sm font-medium',
        lg: 'px-4 py-2 text-base font-medium'
    };

    const baseStyles = 'inline-flex items-center gap-1 rounded-full whitespace-nowrap';

    return (
        <span
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />}
            {children}
        </span>
    );
};

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf([
        'default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'purple', 'pink',
        'active', 'inactive', 'pending', 'completed', 'failed', 'confirmed', 'rented', 'available',
        'terminated', 'paid_in_full', 'overdue', 'checked_in', 'manager', 'investor'
    ]),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    icon: PropTypes.elementType
};

export default Badge;
