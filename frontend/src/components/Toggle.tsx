/**
 * 🔘 Toggle Component - Modern switch/toggle with smooth animations
 */

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'purple';
  animated?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
  color = 'blue',
  animated = true,
}) => {
  const sizes = {
    sm: { outer: 'w-8 h-4', inner: 'w-3 h-3' },
    md: { outer: 'w-12 h-6', inner: 'w-5 h-5' },
    lg: { outer: 'w-16 h-8', inner: 'w-6 h-6' },
  };

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
  };

  const { outer, inner } = sizes[size];
  const colorClass = colors[color];

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative ${outer} rounded-full transition-all duration-300
          ${checked ? colorClass : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
          ${animated ? 'transform hover:scale-105' : ''}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500
        `}
      >
        <div
          className={`
            absolute top-1/2 transform -translate-y-1/2 ${inner}
            bg-white rounded-full shadow-md transition-all duration-300
            ${checked ? `translate-x-full` : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <label className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
    </div>
  );
};

export default Toggle;
