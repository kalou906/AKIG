import React, { useEffect, useState } from 'react';
import { DataGrid } from '../components/DataGrid';
import { api } from '../api/client';

/**
 * Page TenantDetail - Détails complets d'un locataire
 *
 * Affiche :
 * - Informations principales (nom, téléphone, site, propriétaire)
 * - Liste des paiements pour l'année en cours
 * - Notes opérationnelles
 * - Statut des impayés
 *
 * Props:
 * - tenantId: ID du locataire
 */
export default function TenantDetail({ tenantId }: { tenantId: number }) {
  const [tenant, setTenant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year] = useState(new Date().getFullYear());

  /**
   * Charger les données du locataire
   */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Charger les infos du locataire
        const tenantData = await api.tenants.get(tenantId);
        setTenant(tenantData);

        // Charger les paiements de l'année
        const paymentsData = await api.reports.getContractPayments(
          tenantData.contract_id,
          year
        );
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);

        // Charger les notes opérationnelles
        try {
          const notesData = await fetch(`/api/tenants/${tenantId}/notes`).then(
            (r) => r.json()
          );
          setNotes(Array.isArray(notesData) ? notesData : []);
        } catch {
          // Les notes peuvent ne pas être disponibles
          setNotes([]);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    if (tenantId) {
      loadData();
    }
  }, [tenantId, year]);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="card">
        <div className="text-red-600 font-medium">
          ✗ {error || 'Locataire non trouvé'}
        </div>
      </div>
    );
  }

  // Calculer les statistiques
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paymentsCount = payments.length;

  return (
    <div className="space-y-6">
      {/* En-tête avec infos principales */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{tenant.full_name}</h1>
            <div className="text-gray-600 mt-1">
              <div>📞 {tenant.phone || '—'}</div>
              <div>📍 {tenant.site || '—'} • {tenant.owner || '—'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Loyer mensuel</div>
            <div className="text-2xl font-bold text-blue-600">
              {tenant.monthly_rent
                ? Intl.NumberFormat('fr-GN').format(Number(tenant.monthly_rent))
                : '—'}
            </div>
            <div className="text-xs text-gray-600 mt-1">GNF</div>
          </div>
        </div>

        {/* Statut des impayés */}
        {tenant.arrears_amount > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="font-semibold text-red-700">
              ⚠️ Impayés: {Intl.NumberFormat('fr-GN').format(Number(tenant.arrears_amount))} GNF
            </div>
            <div className="text-sm text-red-600">
              Arrières de {tenant.arrears_months} mois
            </div>
          </div>
        )}
      </div>

      {/* Paiements de l'année */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          📊 Paiements {year} ({paymentsCount})
        </h2>

        {paymentsCount > 0 ? (
          <>
            <DataGrid
              data={payments}
              columns={[
                {
                  header: 'Date',
                  key: 'paid_at',
                  render: (row: any) =>
                    new Date(row.paid_at).toLocaleDateString('fr-GN'),
                  className: 'w-24',
                },
                {
                  header: 'Mode de paiement',
                  key: 'mode',
                  render: (row: any) => {
                    const modeIcons: Record<string, string> = {
                      cash: '💵',
                      orange_money: '📱',
                      marchand: '🏪',
                      virement: '🏦',
                    };
                    return `${modeIcons[row.mode] || '📝'} ${row.mode || '—'}`;
                  },
                  className: 'w-32',
                },
                {
                  header: 'Allocation',
                  key: 'allocation',
                  render: (row: any) => row.allocation || '—',
                },
                {
                  header: 'Montant',
                  key: 'amount',
                  render: (row: any) =>
                    `${Intl.NumberFormat('fr-GN').format(Number(row.amount))} GNF`,
                  className: 'text-right font-medium',
                },
              ]}
              striped={true}
              hoverable={true}
            />

            {/* Résumé des paiements */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-600">Nombre de paiements</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {paymentsCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Total payé</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {Intl.NumberFormat('fr-GN').format(totalPaid)} GNF
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Moyenne par paiement</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {Intl.NumberFormat('fr-GN').format(
                      Math.round(totalPaid / paymentsCount)
                    )}{' '}
                    GNF
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucun paiement enregistré pour {year}
          </div>
        )}
      </div>

      {/* Notes opérationnelles */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">📌 Notes opérationnelles</h2>

        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note: any, idx: number) => (
              <div
                key={idx}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="text-sm">{note.note || note.content || '—'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {note.created_at
                    ? new Date(note.created_at).toLocaleDateString('fr-GN')
                    : '—'}
                  {note.created_by && ` • Par ${note.created_by}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune note opérationnelle
          </div>
        )}

        {/* Formulaire d'ajout de note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <textarea
            className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ajouter une note..."
            rows={2}
          />
          <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded transition">
            ➕ Ajouter note
          </button>
        </div>
      </div>

      {/* Historique des contrats */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">📋 Contrats</h2>
        <div className="text-sm text-gray-600">
          <div>
            <strong>ID Contrat:</strong> {tenant.contract_id || '—'}
          </div>
          <div>
            <strong>Statut:</strong> {tenant.status || '—'}
          </div>
          <div>
            <strong>Périodicité:</strong> {tenant.periodicity || '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
