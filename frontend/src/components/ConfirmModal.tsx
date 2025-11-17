/**
 * ConfirmModal Component with AKIG Logo
 * 
 * Displays a confirmation dialog with logo branding
 * Used for critical user actions (delete, confirm, etc.)
 */

import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Logo Header */}
        <div className="confirm-modal-header">
          <img 
            src="/assets/logos/logo.png" 
            alt="Logo AKIG" 
            className="confirm-modal-logo"
          />
          <h2 className="confirm-modal-title">{title}</h2>
        </div>

        {/* Message */}
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="confirm-modal-footer">
          <button 
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-modal-btn confirm-modal-btn-confirm ${
              isDangerous ? 'confirm-modal-btn-danger' : ''
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
