import React from 'react';

/**
 * Props pour QuickActions
 */
export interface QuickActionsProps {
  tenant: {
    id: string;
    full_name?: string;
    name?: string;
    contract_id?: string;
    phone?: string;
  };
  onGenerateContract?: () => void;
  onSendWhatsApp?: () => void;
  onExportPdf?: () => void;
}

/**
 * Composant QuickActions
 * Affiche des boutons d'actions rapides pour un locataire
 *
 * Actions disponibles :
 * - 📄 Générer contrat
 * - 📤 Relancer WhatsApp
 * - 💾 Export PDF
 *
 * Exemple d'utilisation :
 * <QuickActions
 *   tenant={tenant}
 *   onGenerateContract={() => openContractGenerator()}
 *   onSendWhatsApp={() => sendReminder()}
 *   onExportPdf={() => exportToPdf()}
 * />
 */
export function QuickActions({
  tenant,
  onGenerateContract,
  onSendWhatsApp,
  onExportPdf,
}: QuickActionsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button
        onClick={onGenerateContract}
        className="btn btn-primary flex items-center gap-2 hover:bg-blue-700 transition"
        title="Générer un nouveau contrat de location"
      >
        <span>📄</span>
        <span>Générer contrat</span>
      </button>

      <button
        onClick={onSendWhatsApp}
        disabled={!tenant.phone}
        className="btn flex items-center gap-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title={tenant.phone ? 'Envoyer un rappel via WhatsApp' : 'Aucun numéro téléphone'}
      >
        <span>📤</span>
        <span>Relancer WhatsApp</span>
      </button>

      <button
        onClick={onExportPdf}
        className="btn flex items-center gap-2 hover:bg-gray-100 transition"
        title="Exporter les informations en PDF"
      >
        <span>💾</span>
        <span>Export PDF</span>
      </button>
    </div>
  );
}

/**
 * Variante compacte (icônes uniquement)
 */
export function QuickActionsCompact({
  tenant,
  onGenerateContract,
  onSendWhatsApp,
  onExportPdf,
}: QuickActionsProps): React.ReactElement {
  return (
    <div className="flex gap-1">
      <button
        onClick={onGenerateContract}
        className="p-2 rounded hover:bg-blue-100 text-lg transition"
        title="Générer contrat"
      >
        📄
      </button>

      <button
        onClick={onSendWhatsApp}
        disabled={!tenant.phone}
        className="p-2 rounded hover:bg-green-100 text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        title={tenant.phone ? 'Relancer WhatsApp' : 'Pas de téléphone'}
      >
        📤
      </button>

      <button
        onClick={onExportPdf}
        className="p-2 rounded hover:bg-gray-100 text-lg transition"
        title="Export PDF"
      >
        💾
      </button>
    </div>
  );
}
