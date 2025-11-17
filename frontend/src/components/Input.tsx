/**
 * 📝 Input Component - Premium input with animations and variants
 */

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

interface InputProps {
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label,
  error,
  success,
  disabled = false,
  icon,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full ${sizes[size]} rounded-lg
            border-2 transition-all duration-300
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : success
              ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${animated && isFocused ? 'shadow-lg' : 'shadow-sm'}
            focus:outline-none
            ${className}
          `}
        />

        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}

        {/* Success icon */}
        {success && !error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <Check size={20} />
          </div>
        )}

        {/* Error icon */}
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle size={20} />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className={`text-sm text-red-600 mt-1 ${animated ? 'animate-slideInUp' : ''}`}>
          {error}
        </p>
      )}

      {/* Success message */}
      {success && !error && (
        <p className={`text-sm text-green-600 mt-1 ${animated ? 'animate-slideInUp' : ''}`}>
          ✓ Looks good!
        </p>
      )}
    </div>
  );
};

export default Input;
