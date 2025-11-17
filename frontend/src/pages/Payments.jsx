/**
 * 💳 Page: Gestion des Paiements & Génération Reçus PDF
 */
import React, { useState, useCallback } from 'react';
import { Plus, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '../hooks/useQuery';
import { Payments } from '../api/client';
import { ensureItems, ensureNumber } from '../utils/shape';
import { mapPayments } from '../mappers/payments';
import { ErrorBanner, SkeletonCard } from '../components/design-system/Feedback';

export const PaymentsPage = () => {
  const [filter, setFilter] = useState('all');
  const fetchPayments = useCallback(() => Payments.list(), [filter]);
  const { data: rawPayments, loading, error } = useQuery(fetchPayments, { retry: 2, deps: [filter] });
  const { data: rawStats } = useQuery(() => fetch('/api/payments/stats').then(r => r.json()), { retry: 1 });

  const paymentsData = mapPayments(ensureItems(rawPayments).items);
  const stats = {
    total_amount_collected: ensureNumber(rawStats?.total_amount_collected),
    completed_payments: ensureNumber(rawStats?.completed_payments),
    pending_payments: ensureNumber(rawStats?.pending_payments),
    pending_amount: ensureNumber(rawStats?.pending_amount),
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={18} className="text-green-500" />;
      case 'pending': return <Clock size={18} className="text-yellow-500" />;
      case 'failed': return <AlertCircle size={18} className="text-red-500" />;
      default: return null;
    }
  };

  const generateReceipt = async (paymentId) => {
    try {
      const response = await fetch(`/api/exports/payments/pdf?paymentId=${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur génération reçu');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/assets/logos/logo.png"
              alt="Logo AKIG"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-3xl font-bold text-gray-800">Gestion des Paiements</h1>
          </div>
          <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 font-semibold flex items-center gap-2">
            <Plus size={20} /> Enregistrer Paiement
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card"><p className="subtle mb-1">Total Collecté</p><p className="stat text-green-600">{stats.total_amount_collected.toLocaleString('fr-FR')} GNF</p></div>
          <div className="card"><p className="subtle mb-1">Paiements Complétés</p><p className="stat text-blue-600">{stats.completed_payments}</p></div>
          <div className="card"><p className="subtle mb-1">En Attente</p><p className="stat text-yellow-600">{stats.pending_payments}</p></div>
          <div className="card"><p className="subtle mb-1">Montant en Attente</p><p className="stat text-red-600">{stats.pending_amount.toLocaleString('fr-FR')} GNF</p></div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 flex border-b">
          {['all', 'completed', 'pending', 'failed'].map(status => (
            <button key={status} onClick={() => setFilter(status)} className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${filter === status ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>
              {status === 'all' ? 'Tous' : status === 'completed' ? 'Complétés' : status === 'pending' ? 'En Attente' : 'Échoués'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-x-auto">
          {loading && <SkeletonCard />}
          {error && <ErrorBanner message={error} />}
          {!loading && !error && paymentsData.length === 0 && <div className="p-4 text-sm text-gray-500">Aucun paiement disponible</div>}
          {!loading && !error && paymentsData.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Référence</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contrat</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Locataire</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Montant</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Méthode</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentsData.map((payment, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{payment.reference}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{payment.contract_reference}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{payment.tenant_name}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">{payment.amount_actual?.toLocaleString('fr-FR')} GNF</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(payment.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-sm">{payment.payment_method}</td>
                    <td className="px-6 py-4 flex items-center gap-2">{getStatusIcon(payment.status)} <span className="text-sm font-semibold">{payment.status}</span></td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700"><Eye size={16} /></button>
                      <button onClick={() => generateReceipt(payment.id)} className="text-purple-500 hover:text-purple-700"><Download size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
