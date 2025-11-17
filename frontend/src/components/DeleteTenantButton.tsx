import React, { useState } from 'react';
import { uiLog } from '../lib/uilog';

interface DeleteTenantButtonProps {
  tenantId: number;
  tenantName: string;
  onConfirm: (id: number) => Promise<void>;
  onCancel?: () => void;
}

/**
 * DeleteTenantButton component with confirmation
 * Logs all user interactions for audit trail
 */
export function DeleteTenantButton({
  tenantId,
  tenantName,
  onConfirm,
  onCancel,
}: DeleteTenantButtonProps): React.ReactElement {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (): void => {
    uiLog('tenant_delete_click', { id: tenantId, name: tenantName });
    setIsConfirming(true);
  };

  const handleConfirm = async (): Promise<void> => {
    uiLog('tenant_delete_confirm', { id: tenantId, name: tenantName });
    setIsDeleting(true);

    try {
      await onConfirm(tenantId);
      uiLog('tenant_delete_success', { id: tenantId, name: tenantName });
      setIsConfirming(false);
    } catch (error) {
      uiLog('tenant_delete_error', {
        id: tenantId,
        name: tenantName,
        error: String(error),
      });
      setIsDeleting(false);
    }
  };

  const handleCancel = (): void => {
    uiLog('tenant_delete_cancel', { id: tenantId, name: tenantName });
    setIsConfirming(false);
    onCancel?.();
  };

  if (isConfirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={isDeleting}
          className="btn bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-400"
          aria-label="Confirmer la suppression"
        >
          {isDeleting ? '⟳ Suppression...' : '✓ Confirmer'}
        </button>

        <button
          onClick={handleCancel}
          disabled={isDeleting}
          className="btn bg-gray-400 hover:bg-gray-500 text-white disabled:bg-gray-300"
          aria-label="Annuler la suppression"
        >
          ✕ Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDeleteClick}
      className="btn bg-red-500 hover:bg-red-600 text-white"
      aria-label="Supprimer le locataire"
      title={`Supprimer ${tenantName}`}
    >
      🗑️ Supprimer
    </button>
  );
}
