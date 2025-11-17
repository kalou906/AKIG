import React from 'react';
import { formatGNF } from '../lib/format';

interface Tenant {
  id?: number;
  name: string;
  phone: string;
  email: string;
  status?: 'active' | 'inactive' | 'overdue' | string;
  rent?: number;
  agency?: string;
  rent_fmt?: string;
}

interface TenantItemProps {
  tenant: Tenant;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * TenantItem - Composant pour afficher une fiche de locataire
 * Mémorisé pour optimiser les re-renders
 */
export const TenantItem = React.memo(function TenantItem({
  tenant: t,
  onEdit,
  onDelete,
}: TenantItemProps) {
  // Formater le loyer
  const rentFormatted = t.rent_fmt || (t.rent ? formatGNF(t.rent) : '-');

  // Classe CSS du statut
  const statusClasses =
    t.status === 'overdue'
      ? 'bg-[var(--akigRed)] text-white'
      : t.status === 'inactive'
        ? 'bg-gray-300 text-gray-700'
        : 'bg-green-100 text-green-700';

  const statusLabel = t.status
    ? {
        active: 'Actif',
        inactive: 'Inactif',
        overdue: 'En retard',
      }[t.status] || t.status
    : 'Actif';

  return (
    <div className="rounded border bg-white p-3 transition hover:shadow-sm">
      {/* Header avec nom et statut */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{t.name}</h3>
          <p className="text-sm text-gray-600">
            {t.phone} • {t.email}
          </p>
        </div>
        <span
          className={`ml-2 whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Détails loyer et agence */}
      <div className="mt-2 text-sm text-gray-600">
        <span>Loyer: {rentFormatted}</span>
        {t.agency && <span> • Agence: {t.agency}</span>}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={onEdit}
          aria-label={`Modifier le locataire ${t.name}`}
        >
          ✏️ Modifier
        </button>
        <button
          type="button"
          className="btn btn-danger flex-1"
          onClick={onDelete}
          aria-label={`Supprimer le locataire ${t.name}`}
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
});

TenantItem.displayName = 'TenantItem';
