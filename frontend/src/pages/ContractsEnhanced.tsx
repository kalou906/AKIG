/**
 * 📄 Contracts Page - Affichage avancé avec DataTable, actions, filtres
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';

interface Contract {
  id: string;
  tenantName: string;
  property: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: 'active' | 'pending' | 'expired';
}

export default function ContractsPage() {
  const navigate = useNavigate();
  const [contracts] = useState<Contract[]>([
    { id: '1', tenantName: 'Dupont Jean', property: 'Apt 201 - Rue A', startDate: '2023-01-15', endDate: '2025-01-14', amount: '850K GNF', status: 'active' },
    { id: '2', tenantName: 'Martin Sophie', property: 'Apt 305 - Rue B', startDate: '2023-06-01', endDate: '2025-05-31', amount: '920K GNF', status: 'active' },
    { id: '3', tenantName: 'Leblanc Pierre', property: 'Villa - Rue C', startDate: '2022-03-01', endDate: '2024-02-29', amount: '1.2M GNF', status: 'expired' },
    { id: '4', tenantName: 'Garcia Maria', property: 'Apt 102 - Rue D', startDate: '2024-01-01', endDate: '2024-12-31', amount: '780K GNF', status: 'pending' },
    { id: '5', tenantName: 'Ahmed Ali', property: 'Studio - Rue E', startDate: '2023-09-15', endDate: '2025-09-14', amount: '650K GNF', status: 'active' },
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      expired: 'bg-red-100 text-red-800 border border-red-300',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const columns = [
    {
      key: 'tenantName' as const,
      label: 'Locataire',
      sortable: true,
      width: '200px',
    },
    {
      key: 'property' as const,
      label: 'Propriété',
      sortable: true,
      width: '250px',
    },
    {
      key: 'startDate' as const,
      label: 'Date Début',
      sortable: true,
      width: '150px',
    },
    {
      key: 'endDate' as const,
      label: 'Date Fin',
      sortable: true,
      width: '150px',
    },
    {
      key: 'amount' as const,
      label: 'Montant',
      sortable: true,
      width: '130px',
      render: (value: string) => <span className="font-semibold text-blue-600">{value}</span>,
    },
    {
      key: 'status' as const,
      label: 'Statut',
      sortable: true,
      width: '120px',
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(value)}`}>
          {value === 'active' ? '✓ Actif' : value === 'pending' ? '⏳ En attente' : '⚠️ Expiré'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestion des Contrats</h1>
            <p className="text-gray-600 mt-2">Affichage et gestion complète de tous les contrats de location</p>
          </div>
          <button
            onClick={() => navigate('/contracts/new')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-lg transform hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Nouveau Contrat
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Contrats Actifs</p>
            <p className="text-2xl font-bold text-green-600">3</p>
          </div>
          <div className="bg-white border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">En Attente</p>
            <p className="text-2xl font-bold text-yellow-600">1</p>
          </div>
          <div className="bg-white border-2 border-red-200 rounded-lg p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Expirés</p>
            <p className="text-2xl font-bold text-red-600">1</p>
          </div>
          <div className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">5</p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
          <Filter size={18} />
          Filtrer
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
          <Download size={18} />
          Exporter
        </button>
        <div className="flex-1"></div>
        <span className="text-sm text-gray-600">5 contrats trouvés</span>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <DataTable
          data={contracts}
          columns={columns}
          itemsPerPage={10}
          searchable={true}
          striped={true}
          onRowClick={(contract) => console.log('Selected:', contract)}
        />
      </div>
    </div>
  );
}
