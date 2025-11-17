/**
 * 🎨 Button Component - Simple, clean, animated
 */

import React, { MouseEvent, ReactNode } from 'react';
import { Loader } from 'lucide-react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ComponentType<any>;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon: Icon,
    onClick,
    className = '',
    type = 'button',
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden';

    const variants: Record<string, string> = {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm',
        danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg',
        success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg',
        warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800 shadow-md hover:shadow-lg',
        ghost: 'bg-transparent text-blue-600 hover:bg-blue-50',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
        premium: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white hover:shadow-xl shadow-lg',
    };

    const sizes: Record<string, string> = {
        sm: 'px-3 py-1.5 text-sm gap-2',
        md: 'px-4 py-2 text-base gap-2',
        lg: 'px-6 py-3 text-lg gap-3',
        xl: 'px-8 py-4 text-xl gap-3'
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        >
            {loading && <Loader className="animate-spin mr-2" size={18} />}
            {Icon && !loading && <Icon size={18} className="mr-1" />}
            {children}
        </button>
    );
};

export default Button;
