/**
 * 🏷️ Badge Component - Modern badge with variants and animations
 */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'light';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  animated?: boolean;
  pulse?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = true,
  animated = true,
  pulse = false,
  className = '',
}) => {
  const variants = {
    primary: 'bg-blue-100 text-blue-800 border border-blue-300',
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    danger: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
    secondary: 'bg-gray-200 text-gray-800 border border-gray-300',
    light: 'bg-gray-50 text-gray-700 border border-gray-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-3 py-1 text-sm font-medium',
    lg: 'px-4 py-1.5 text-base font-medium',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';
  const pulseClass = pulse ? 'animate-pulse' : '';

  return (
    <span
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${roundedClass}
        inline-flex items-center gap-1.5 transition-all duration-300
        ${animated ? 'hover:shadow-md hover:scale-105' : ''}
        ${pulseClass}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
