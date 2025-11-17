/**
 * Candidatures.jsx
 * Phase 8: Page principale gestion des candidatures
 * Liste, filtres, pagination, quick actions
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, Download, Filter } from 'lucide-react';
import axios from 'axios';

export default function Candidatures() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    statut: '',
    search: '',
    local_id: '',
    proprietaire_id: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [stats, setStats] = useState(null);

  const API_BASE = 'http://localhost:4000/api';
  const token = localStorage.getItem('token');

  // Fetch candidatures
  const fetchCandidatures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(filters.statut && { statut: filters.statut }),
        ...(filters.search && { search: filters.search }),
        ...(filters.local_id && { local_id: filters.local_id }),
        ...(filters.proprietaire_id && { proprietaire_id: filters.proprietaire_id })
      });

      const res = await axios.get(`${API_BASE}/candidatures?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCandidatures(res.data.data);
      setTotalPages(Math.ceil(res.data.pagination.total / 20));
    } catch (error) {
      console.error('Error fetching candidatures:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/candidatures/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchCandidatures();
    fetchStats();
  }, [page, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression?')) return;
    try {
      await axios.delete(`${API_BASE}/candidatures/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCandidatures();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`${API_BASE}/candidatures/${id}`, { statut: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCandidatures();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadgeClass = (statut) => {
    const colors = {
      nouvelle: 'bg-blue-100 text-blue-800',
      acceptee: 'bg-green-100 text-green-800',
      rejetee: 'bg-red-100 text-red-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Candidatures</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Nouvelle Candidature
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Nouvelles</div>
            <div className="text-2xl font-bold text-blue-600">{stats.nouvelles}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Acceptées</div>
            <div className="text-2xl font-bold text-green-600">{stats.acceptees}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Rejetées</div>
            <div className="text-2xl font-bold text-red-600">{stats.rejetees}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Dossierfacile</div>
            <div className="text-2xl font-bold">{stats.dossierfacile_count}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              className="flex-1 outline-none"
            />
          </div>
          <select
            value={filters.statut}
            onChange={(e) => { setFilters({ ...filters, statut: e.target.value }); setPage(1); }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="nouvelle">Nouvelle</option>
            <option value="acceptee">Acceptée</option>
            <option value="rejetee">Rejetée</option>
          </select>
          <input
            type="number"
            placeholder="Local ID"
            value={filters.local_id}
            onChange={(e) => { setFilters({ ...filters, local_id: e.target.value }); setPage(1); }}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={() => setFilters({ statut: '', search: '', local_id: '', proprietaire_id: '' })}
            className="border rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter size={18} /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : candidatures.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune candidature trouvée</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Local</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Locataires</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Dossierfacile</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidatures.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">#{c.id}</td>
                    <td className="px-6 py-4 text-sm">{c.local_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {c.nb_locataires} locataire(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={c.statut}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(c.statut)}`}
                      >
                        <option value="nouvelle">Nouvelle</option>
                        <option value="acceptee">Acceptée</option>
                        <option value="rejetee">Rejetée</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {c.dossierfacile_integration ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Intégré</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Non</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => setSelectedCandidature(c)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900" title="Éditer">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div>Page {page} sur {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border rounded disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 border rounded disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
