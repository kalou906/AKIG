/**
 * ⚠️ Alert Component - Simple alert with animations
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { AlertCircle, Check, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  children: ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  closeable?: boolean;
  autoClose?: boolean;
  autoCloseDuration?: number;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  children,
  type = 'info',
  title,
  closeable = false,
  autoClose = false,
  autoCloseDuration = 4000,
  onClose,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, isVisible, onClose]);

  if (!isVisible) return null;

  const types: Record<string, { bg: string; border: string; title: string; text: string; icon: string; Icon: any }> = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-900',
      text: 'text-blue-700',
      icon: 'text-blue-400',
      Icon: Info
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-900',
      text: 'text-green-700',
      icon: 'text-green-400',
      Icon: Check
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'text-yellow-900',
      text: 'text-yellow-700',
      icon: 'text-yellow-400',
      Icon: AlertTriangle
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-900',
      text: 'text-red-700',
      icon: 'text-red-400',
      Icon: AlertCircle
    }
  };

  const config = types[type];
  const { Icon } = config;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div
      className={`border rounded-lg p-4 ${config.bg} ${config.border} flex gap-4 animate-slideInUp ${className}`}
      role="alert"
    >
      <div className="flex-shrink-0 pt-0.5">
        <Icon className={`w-5 h-5 ${config.icon}`} />
      </div>

      <div className="flex-1">
        {title && (
          <h3 className={`font-semibold ${config.title}`}>
            {title}
          </h3>
        )}
        <div className={`${config.text} ${title ? 'mt-1' : ''}`}>
          {children}
        </div>
      </div>

      {closeable && (
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ${config.icon} hover:opacity-75 transition-opacity`}
          aria-label="Close alert"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default Alert;
