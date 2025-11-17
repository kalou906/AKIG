// ============================================================
// 🪟 Modal Component - Reusable Modal Dialog with Animations
// Premium version with smooth transitions and micro-interactions
// ============================================================

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import Button from './ButtonSimple';

const Modal = ({
    isOpen,
    title,
    children,
    onClose,
    onConfirm,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    confirmVariant = 'primary',
    size = 'md',
    footer = true,
    closeButton = true,
    backdrop = true,
    className = '',
    animated = true,
}) => {
    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        'full': 'max-w-full mx-4'
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${backdrop ? 'bg-black/40 backdrop-blur-sm' : ''}`}>
            {/* Backdrop with animation */}
            {backdrop && (
                <div
                    className={`absolute inset-0 ${animated ? 'animate-fadeInScale' : ''}`}
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Modal with animation */}
            <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]} ${animated ? 'animate-slideInUp' : ''} ${className}`}>
                {/* Header with gradient bottom border */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    {closeButton && (
                        <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex gap-3 p-6 border-t border-gray-200 justify-end bg-gray-50 rounded-b-xl">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            size="md"
                        >
                            {cancelText}
                        </Button>
                        {onConfirm && (
                            <Button
                                variant={confirmVariant}
                                onClick={onConfirm}
                                size="md"
                            >
                                {confirmText}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    confirmVariant: PropTypes.string,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']),
    footer: PropTypes.bool,
    closeButton: PropTypes.bool,
    backdrop: PropTypes.bool,
    className: PropTypes.string,
    animated: PropTypes.bool
};

export default Modal;
