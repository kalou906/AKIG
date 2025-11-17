/**
 * 📋 Page: Contrats de Location
 */
import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Download, Eye } from 'lucide-react';
import { exportContract } from '../utils/exportUtils';
import { SkeletonCard, ErrorBanner } from '../components/design-system/Feedback';

export const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = filter === 'all' ? '/api/contracts' : `/api/contracts?status=${filter}`;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Erreur chargement contrats');
        return r.json();
      })
      .then(d => setContracts(d.data || d || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Actif' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon' },
      terminated: { bg: 'bg-red-100', text: 'text-red-800', label: 'Résilié' },
    };
    return badges[status] || badges.draft;
  };

  const handleDownload = async (contractId) => {
    try {
      setExporting(contractId);
      const result = await exportContract(contractId, 'pdf');
      if (!result.success) {
        alert('❌ Erreur: ' + result.error);
      }
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    } finally {
      setExporting(null);
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
            <h1 className="text-3xl font-bold text-gray-800">Contrats de Location</h1>
          </div>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-semibold">+ Nouveau Contrat</button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 flex border-b">
          {['all', 'active', 'draft', 'terminated'].map(status => (
            <button key={status} onClick={() => setFilter(status)} className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${filter === status ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>
              {status === 'all' ? 'Tous' : status === 'active' ? 'Actifs' : status === 'draft' ? 'Brouillons' : 'Résiliés'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32"><SkeletonCard height={32} /></div>
          ) : error ? (
            <ErrorBanner message={error} />
          ) : contracts.length === 0 ? (
            <ErrorBanner message="Aucun contrat trouvé" />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Référence</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Locataire</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Propriété</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loyer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Durée</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, i) => {
                  const badge = getStatusBadge(contract.status);
                  const start = new Date(contract.start_date).toLocaleDateString('fr-FR');
                  const end = new Date(contract.end_date).toLocaleDateString('fr-FR');
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{contract.reference}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{contract.tenant_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{contract.property_title}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">{contract.monthly_rent?.toLocaleString('fr-FR')} GNF</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{start} → {end}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>{badge.label}</span></td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button className="text-blue-500 hover:text-blue-700"><Eye size={16} /></button>
                          <button
                            onClick={() => handleDownload(contract.id)}
                            disabled={exporting === contract.id}
                            className="text-purple-500 hover:text-purple-700 disabled:opacity-50"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <Clock size={20} className="text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800">Contrats expirant</h3>
              <p className="text-sm text-yellow-700">5 contrats arrivent à expiration dans 30 jours</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-800">Arriérés de paiement</h3>
              <p className="text-sm text-red-700">3 contrats avec des paiements en retard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
