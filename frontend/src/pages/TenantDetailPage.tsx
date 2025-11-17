import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FR, formatDate, formatGNF, formatPaymentMode } from '../i18n/fr';
import { StatusBadge, StatusBadgeDetailed } from '../components/StatusBadge';
import { QuickActions, QuickActionsCompact } from '../components/QuickActions';
import { DataGrid, GridColumn } from '../components/DataGrid';
import { PaymentsChart, PaymentStats } from '../components/PaymentsChart';

/**
 * Interface pour les données du locataire
 */
interface TenantData {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  owner?: string;
  site?: string;
  address?: string;
  monthly_rent: number;
  arrears_amount: number;
  arrears_months: number;
  status: 'active' | 'terminated' | 'overdue';
  contract_id?: string;
}

/**
 * Interface pour les paiements
 */
interface Payment {
  id: string;
  paid_at: string;
  amount: number;
  mode: string;
  note?: string;
}

/**
 * Interface pour les notes
 */
interface OperationalNote {
  id: string;
  note: string;
  created_at: string;
  created_by?: string;
}

/**
 * Page TenantDetail
 * Affiche les détails complets d'un locataire avec :
 * - Informations personnelles
 * - Statut de paiement
 * - Historique des paiements
 * - Graphique des paiements
 * - Notes opérationnelles
 * - Actions rapides
 *
 * Exemple :
 * <TenantDetail />  (ID depuis URL param)
 */
export default function TenantDetail(): React.ReactElement {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats[]>([]);
  const [notes, setNotes] = useState<OperationalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);

  /**
   * Charger les données du locataire
   */
  useEffect(() => {
    if (!tenantId) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Charger les infos du locataire
        const tenantResponse = await fetch(`/api/tenants/${tenantId}`);
        if (!tenantResponse.ok) throw new Error('Locataire introuvable');
        const tenantData = await tenantResponse.json();
        setTenant(tenantData);

        // Charger les paiements de l'année
        const paymentsResponse = await fetch(
          `/api/contracts/${tenantData.contract_id}/payments?year=${year}`
        );
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          const paymentsList = paymentsData.items || [];
          setPayments(paymentsList);

          // Générer les stats mensuelles
          generateMonthlyStats(paymentsList, year, tenantData.monthly_rent);
        }

        // Charger les notes
        const notesResponse = await fetch(`/api/tenants/${tenantId}/notes`);
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tenantId, year]);

  /**
   * Générer les statistiques mensuelles pour le graphique
   */
  function generateMonthlyStats(
    paymentList: Payment[],
    selectedYear: number,
    monthlyRent: number
  ) {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
    ];

    const stats: PaymentStats[] = months.map((month, idx) => {
      const paid = paymentList
        .filter((p) => {
          const date = new Date(p.paid_at);
          return date.getFullYear() === selectedYear && date.getMonth() === idx;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      return {
        month,
        paid,
        due: monthlyRent,
      };
    });

    setPaymentStats(stats);
  }

  /**
   * Ajouter une note
   */
  async function handleAddNote() {
    if (!newNote.trim() || !tenantId) return;

    setAddingNote(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        const newNoteData = await response.json();
        setNotes([newNoteData, ...notes]);
        setNewNote('');
      }
    } catch (err) {
      console.error('Erreur ajout note:', err);
    } finally {
      setAddingNote(false);
    }
  }

  /**
   * Colonnes pour le tableau des paiements
   */
  const paymentColumns: GridColumn[] = [
    {
      key: 'paid_at',
      header: 'Date',
      sortable: true,
      render: (row: Payment) => formatDate(row.paid_at),
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (row: Payment) => formatPaymentMode(row.mode),
    },
    {
      key: 'amount',
      header: 'Montant',
      sortable: true,
      render: (row: Payment) => (
        <span className="font-semibold text-green-600">{formatGNF(row.amount)}</span>
      ),
    },
    {
      key: 'note',
      header: 'Note',
      render: (row: Payment) => <span className="text-gray-600 text-xs">{row.note || '—'}</span>,
    },
  ];

  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="text-gray-600">{FR.common.loading}</div>
        </div>
      </div>
    );
  }

  // Erreur
  if (error || !tenant) {
    return (
      <div className="card bg-red-50 border border-red-300 p-6">
        <div className="flex items-start gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <div className="font-semibold text-red-700">{FR.common.error}</div>
            <div className="text-sm text-red-600 mt-1">{error || 'Locataire introuvable'}</div>
            <button
              onClick={() => navigate('/tenants')}
              className="btn btn-primary mt-3"
            >
              ← {FR.common.cancel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calcul des statistiques
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const averagePaid = payments.length > 0 ? totalPaid / payments.length : 0;

  return (
    <div className="space-y-4">
      {/* En-tête avec infos principales */}
      <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.full_name}</h1>
            <div className="text-gray-600 mt-2 space-y-1">
              {tenant.phone && (
                <div>
                  📱 {tenant.phone}
                  {tenant.email && ` • ${tenant.email}`}
                </div>
              )}
              {(tenant.owner || tenant.site) && (
                <div>
                  🏢 {tenant.owner || '—'} • {tenant.site || '—'}
                </div>
              )}
              {tenant.address && <div>📍 {tenant.address}</div>}
            </div>
          </div>

          <div className="text-right">
            <StatusBadgeDetailed
              arrears_amount={tenant.arrears_amount}
              arrears_months={tenant.arrears_months}
            />
            <div className="text-2xl font-bold text-blue-600 mt-3">
              {formatGNF(tenant.monthly_rent)}
              <div className="text-xs text-gray-600 font-normal">loyer mensuel</div>
            </div>
          </div>
        </div>

        {/* Actions rapides compactes */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <QuickActionsCompact
            tenant={tenant}
            onGenerateContract={() => console.log('Generate contract')}
            onSendWhatsApp={() => console.log('Send WhatsApp')}
            onExportPdf={() => console.log('Export PDF')}
          />
        </div>
      </div>

      {/* Sélecteur d'année */}
      <div className="card p-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📅 {FR.common.year}
        </label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: new Date().getFullYear() - 2015 + 1 }, (_, i) => 2015 + i).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
        </select>
      </div>

      {/* Statistiques résumées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="card p-3">
          <div className="text-xs text-gray-600">{FR.tenantDetail.totalPaid}</div>
          <div className="text-lg font-bold text-green-600 mt-1">{formatGNF(totalPaid)}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-600">{FR.tenantDetail.totalOverdue}</div>
          <div className="text-lg font-bold text-red-600 mt-1">
            {formatGNF(tenant.arrears_amount)}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-600">{FR.tenantDetail.averagePayment}</div>
          <div className="text-lg font-bold text-blue-600 mt-1">{formatGNF(averagePaid)}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-600">{FR.tenantDetail.numberOfPayments}</div>
          <div className="text-lg font-bold text-purple-600 mt-1">{payments.length}</div>
        </div>
      </div>

      {/* Graphique des paiements */}
      {paymentStats.length > 0 && (
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">{FR.dashboard.paymentsVsDue}</h2>
          <PaymentsChart stats={paymentStats} height={300} />
        </div>
      )}

      {/* Section des paiements */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-3">
          {FR.dashboard.paymentsVsDue} {year}
        </h2>
        {payments.length > 0 ? (
          <DataGrid
            data={payments}
            columns={paymentColumns}
            compact={false}
            striped={true}
            emptyMessage={FR.tenantDetail.noPayments}
          />
        ) : (
          <div className="text-center py-6 text-gray-500">
            <div className="text-2xl mb-2">📋</div>
            <div>{FR.tenantDetail.noPayments}</div>
          </div>
        )}
      </div>

      {/* Section des notes opérationnelles */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-3">{FR.tenantDetail.notesSection}</h2>

        {/* Formulaire ajout note */}
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder={FR.tenantDetail.addNote}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
              className="btn btn-primary disabled:opacity-50"
            >
              {addingNote ? '⏳' : '➕'}
            </button>
          </div>
        </div>

        {/* Liste des notes */}
        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm text-gray-800">{note.note}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(note.created_at)}
                  {note.created_by && ` • ${note.created_by}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {FR.tenantDetail.noNotes}
          </div>
        )}
      </div>

      {/* Actions principales */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-3">{FR.common.actions}</h2>
        <QuickActions
          tenant={tenant}
          onGenerateContract={() => console.log('Generate contract')}
          onSendWhatsApp={() => console.log('Send WhatsApp')}
          onExportPdf={() => console.log('Export PDF')}
        />
      </div>

      {/* Bouton retour */}
      <div className="flex justify-center pb-6">
        <button
          onClick={() => navigate('/tenants')}
          className="btn flex items-center gap-2"
        >
          ← {FR.common.cancel}
        </button>
      </div>
    </div>
  );
}
