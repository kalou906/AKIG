/**
 * ============================================================
 * pages/Preavis.jsx - Gestion des préavis avec alertes IA
 * ============================================================
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Plus, Filter } from 'lucide-react';
import { apiClient } from '../api/apiClient';

export default function Preavis() {
  const [preavis, setPreavis] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('EN_COURS');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    contrat_id: '',
    locataire_id: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_effet: '',
    motif: '',
    type: 'DEPART',
  });

  // Charger les préavis et alertes
  useEffect(() => {
    loadPreavis();
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Refresh alerts every minute
    return () => clearInterval(interval);
  }, []);

  const loadPreavis = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/preavis');
      setPreavis(data.data || []);
      setError(null);
    } catch (err) {
      console.error('[Preavis] Load error:', err);
      setError(err.message || 'Erreur chargement préavis');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await apiClient.get('/preavis/status/dashboard');
      const allAlerts = data.all_alerts || [];
      setAlerts(allAlerts);
    } catch (err) {
      console.error('[Alerts] Load error:', err);
    }
  };

  const handleCreatePreavis = async (e) => {
    e.preventDefault();
    if (!formData.contrat_id || !formData.locataire_id || !formData.date_effet) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      await apiClient.post('/preavis', formData);
      setFormData({
        contrat_id: '',
        locataire_id: '',
        date_emission: new Date().toISOString().split('T')[0],
        date_effet: '',
        motif: '',
        type: 'DEPART',
      });
      setShowForm(false);
      await loadPreavis();
      await loadAlerts();
      setError(null);
    } catch (err) {
      setError('Erreur création préavis: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiClient.put(`/preavis/${id}`, { statut: newStatus });
      await loadPreavis();
      await loadAlerts();
    } catch (err) {
      setError('Erreur mise à jour: ' + err.message);
    }
  };

  const filteredPreavis = filter === 'ALL' 
    ? preavis 
    : preavis.filter(p => p.statut === filter);

  const getStatusBadge = (statut) => {
    const styles = {
      EN_COURS: 'bg-blue-100 text-blue-800',
      ENVOYE: 'bg-yellow-100 text-yellow-800',
      ACCEPTE: 'bg-green-100 text-green-800',
      CONTESTE: 'bg-red-100 text-red-800',
      ARCHIVE: 'bg-gray-100 text-gray-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getAlertIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="text-red-600" size={20} />;
      case 'high':
        return <AlertCircle className="text-orange-600" size={20} />;
      case 'medium':
        return <Clock className="text-yellow-600" size={20} />;
      default:
        return <CheckCircle className="text-blue-600" size={20} />;
    }
  };

  const criticalAlerts = alerts.filter(a => a.priority === 'critical');
  const highAlerts = alerts.filter(a => a.priority === 'high');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Préavis</h1>
        <p className="text-gray-600">Gestion des préavis de départ et notifications</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} />
            🚨 {criticalAlerts.length} Alerte(s) Critique(s)
          </h3>
          <ul className="space-y-2">
            {criticalAlerts.map((alert) => (
              <li key={alert.preavis_id} className="text-sm text-red-700 bg-white p-2 rounded">
                {alert.message} - <strong>{alert.action}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* High Alerts */}
      {highAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
          <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
            <AlertCircle size={20} />
            ⚠️ {highAlerts.length} Alerte(s) Urgente(s)
          </h3>
          <ul className="space-y-2">
            {highAlerts.map((alert) => (
              <li key={alert.preavis_id} className="text-sm text-orange-700 bg-white p-2 rounded">
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 flex gap-4 items-center">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau Préavis
        </button>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="EN_COURS">En cours</option>
          <option value="ENVOYE">Envoyés</option>
          <option value="ACCEPTE">Acceptés</option>
          <option value="CONTESTE">Contestés</option>
          <option value="ARCHIVE">Archivés</option>
        </select>
      </div>

      {/* Création Préavis Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Créer un nouveau préavis</h2>
          <form onSubmit={handleCreatePreavis} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contrat ID *
                </label>
                <input
                  type="number"
                  required
                  value={formData.contrat_id}
                  onChange={(e) => setFormData({ ...formData, contrat_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ID du contrat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locataire ID *
                </label>
                <input
                  type="number"
                  required
                  value={formData.locataire_id}
                  onChange={(e) => setFormData({ ...formData, locataire_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ID du locataire"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'émission
                </label>
                <input
                  type="date"
                  value={formData.date_emission}
                  onChange={(e) => setFormData({ ...formData, date_emission: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'effet (fin de bail) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_effet}
                  onChange={(e) => setFormData({ ...formData, date_effet: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="DEPART">Départ</option>
                  <option value="RESILIATION">Résiliation</option>
                  <option value="RENOUVELLEMENT">Renouvellement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
              <textarea
                value={formData.motif}
                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Motif du préavis (optionnel)"
                rows="3"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Créer Préavis
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Préavis Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            Préavis ({filteredPreavis.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Chargement...
          </div>
        ) : filteredPreavis.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun préavis
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Contrat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Locataire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Émission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Effet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPreavis.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{p.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{p.contrat_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {p.locataire_nom || p.locataire_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(p.date_emission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(p.date_effet).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(p.statut)}`}>
                        {p.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={p.statut}
                        onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="EN_COURS">En cours</option>
                        <option value="ENVOYE">Envoyé</option>
                        <option value="ACCEPTE">Accepté</option>
                        <option value="CONTESTE">Contesté</option>
                        <option value="ARCHIVE">Archivé</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Summary */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Préavis</div>
          <div className="text-2xl font-bold text-gray-900">{preavis.length}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-sm text-blue-600">En Cours</div>
          <div className="text-2xl font-bold text-blue-900">
            {preavis.filter(p => p.statut === 'EN_COURS').length}
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow">
          <div className="text-sm text-orange-600">Alertes Urgentes</div>
          <div className="text-2xl font-bold text-orange-900">{highAlerts.length}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-600">Alertes Critiques</div>
          <div className="text-2xl font-bold text-red-900">{criticalAlerts.length}</div>
        </div>
      </div>
    </div>
  );
}
