/**
 * 👥 Page: Gestion des Clients
 */
import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle } from 'lucide-react';

export const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const url = `/api/clients?search=${search}&${filter !== 'all' ? `type=${filter}` : ''}`;
    fetch(url).then(r => r.json()).then(d => setClients(d.data || d || []));
  }, [search, filter]);

  const getRiskColor = (rating) => {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Clients</h1>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-semibold flex items-center gap-2">
            <Plus size={20} /> Nouveau Client
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Tous</option>
            <option value="tenant">Locataires</option>
            <option value="owner">Propriétaires</option>
            <option value="investor">Investisseurs</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Téléphone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vérification</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fiabilité</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-800">{client.full_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {client.type === 'tenant' ? 'Locataire' : client.type === 'owner' ? 'Propriétaire' : 'Investisseur'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.phone}</td>
                  <td className="px-6 py-4">
                    {client.verified ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={20} className="text-yellow-500" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(client.reliability_rating)}`}>
                      {client.payment_reliability}/5
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-500 hover:text-blue-700 font-semibold">Voir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
