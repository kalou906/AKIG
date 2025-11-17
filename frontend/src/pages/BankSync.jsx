/**
 * 🏦 Page Synchronisation Bancaire - Frontend React Premium
 * Réconciliation automatique des paiements
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, TrendingUp, Upload, Search } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API from '../services/api';

export default function BankSyncPage() {
  const [reconciliationData, setReconciliationData] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReconciliationData();
    checkAnomalies();
  }, []);

  const loadReconciliationData = async () => {
    try {
      setLoading(true);
      const data = await API.get(`/bank/reconciliation-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setReconciliationData(data.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAnomalies = async () => {
    try {
      const data = await API.get('/bank/anomalies');
      setAnomalies(data.data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const autoReconcile = async () => {
    try {
      setSyncing(true);
      const result = await API.post('/bank/auto-reconcile');
      alert(`✅ ${result.data.matched} transactions rapprochées`);
      loadReconciliationData();
      checkAnomalies();
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const validateIntegrity = async () => {
    try {
      const result = await API.get('/bank/validate-integrity');
      if (result.data.isValid) {
        alert('✅ Intégrité des données confirmée');
      } else {
        alert(`⚠️ ${result.data.validationErrors.length} erreurs détectées`);
      }
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  // Données pour graphique
  const dailyData = reconciliationData?.dailyBreakdown || [];

  const ANOMALY_ICONS = {
    duplicate_payments: '⚠️',
    unverified_payments_old: '🔴',
    orphan_bank_transactions: '❓'
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏦 Synchronisation Bancaire</h1>
          <p className="text-gray-600">Réconciliation automatique des transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoReconcile}
            disabled={syncing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} /> Réconcilier
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Upload size={20} /> Importer
          </button>
        </div>
      </div>

      {/* Filtres dates */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold mb-1">Du</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Au</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={loadReconciliationData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Search size={20} /> Filtrer
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      {reconciliationData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-3xl font-bold text-blue-600">{reconciliationData.summary.totalTransactions}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Rapprochées</p>
            <p className="text-3xl font-bold text-green-600">{reconciliationData.summary.matchedCount}</p>
            <p className="text-xs text-gray-500 mt-1">{reconciliationData.summary.matchedAmount.toLocaleString()} GNF</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">En Attente</p>
            <p className="text-3xl font-bold text-orange-600">{reconciliationData.summary.unmatchedCount}</p>
            <p className="text-xs text-gray-500 mt-1">{reconciliationData.summary.unmatchedAmount.toLocaleString()} GNF</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Taux Réconciliation</p>
            <p className="text-3xl font-bold text-purple-600">{reconciliationData.summary.reconciliationRate}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Intégrité</p>
            <button
              onClick={validateIntegrity}
              className="text-red-600 hover:text-red-800 font-semibold text-sm mt-2 underline"
            >
              Valider →
            </button>
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies && anomalies.hasAnomalies && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle size={24} /> Anomalies Détectées
          </h3>
          <div className="space-y-2">
            {anomalies.anomalies.map((anom, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded border border-red-100">
                <span className="text-2xl">{ANOMALY_ICONS[anom.type] || '⚠️'}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{anom.type}</p>
                  <p className="text-sm text-gray-600">{anom.message}</p>
                  <p className="text-xs text-red-600 font-bold mt-1">{anom.count} occurrence(s)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique tendance */}
      {dailyData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">📊 Réconciliation Quotidienne</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey="transactions" fill="#3b82f6" name="Total Transactions" />
              <Bar dataKey="matched" fill="#10b981" name="Rapprochées" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bouton actions */}
      <div className="flex gap-3">
        <button
          onClick={validateIntegrity}
          className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 font-semibold"
        >
          🔍 Vérifier Intégrité
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-semibold"
        >
          📋 Importer Transactions
        </button>
      </div>

      {/* Dialog Import */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">📤 Importer Transactions Bancaires</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-2">Format CSV ou Excel</label>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-600">Format: transaction_id, date, amount, description, sender</p>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 bg-gray-300 text-black px-4 py-2 rounded-lg"
              >
                ❌ Annuler
              </button>
              <button
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                ✅ Importer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          💡 La réconciliation automatique apparie les transactions bancaires avec les paiements enregistrés.
          Utilisez le bouton "Rapprocher" pour lancer le processus ou "Importer" pour ajouter des transactions.
        </p>
      </div>
    </div>
  );
}
