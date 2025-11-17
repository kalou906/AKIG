/**
 * 🎴 Card Component - Simple card with smooth animations
 */

import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  header?: string | ReactNode;
  footer?: string | ReactNode;
  variant?: 'default' | 'premium' | 'subtle';
  className?: string;
  elevated?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'default',
  className = '',
  elevated = false,
  hoverable = false,
  onClick,
}) => {
  const variants: Record<string, string> = {
    default: 'bg-white border border-gray-200',
    premium: 'bg-gradient-to-br from-white to-gray-50 border border-gray-100',
    subtle: 'bg-gray-50 border border-gray-100',
  };

  return (
    <div
      className={`
        rounded-lg overflow-hidden transition-all duration-300 animate-fadeInScale
        ${variants[variant]}
        ${elevated ? 'shadow-xl' : 'shadow-md'}
        ${hoverable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-200">
          {typeof header === 'string' ? (
            <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}

      <div className="px-6 py-4">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {typeof footer === 'string' ? (
            <p className="text-sm text-gray-600">{footer}</p>
          ) : (
            footer
          )}
        </div>
      )}
    </div>
  );
};

export default Card;
