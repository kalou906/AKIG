/**
 * 🏠 Dépôt Reusable Table Component
 * Location: frontend/src/components/DepositTable.jsx
 */

import React, { useState } from 'react';
import { Trash2, RefreshCw, ArrowDown, Eye } from 'lucide-react';
import Button from './ButtonSimple';

const DepositTable = ({ 
  deposits = [], 
  onReturn, 
  onDelete, 
  onView,
  isLoading = false 
}) => {
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'returned': 'bg-blue-100 text-blue-800',
      'archived': 'bg-gray-100 text-gray-800',
      'partial': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBalanceColor = (balance, total) => {
    const percentage = (balance / total) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrat</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bien</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locataire</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {isLoading ? (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                Chargement des dépôts...
              </td>
            </tr>
          ) : deposits.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                Aucun dépôt trouvé
              </td>
            </tr>
          ) : (
            deposits.map((deposit) => (
              <tr key={deposit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold text-gray-900">
                    {deposit.contract_number || `Contrat #${deposit.contract_id}`}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-gray-600">{deposit.property_name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-600">{deposit.tenant_name || 'N/A'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(deposit.deposit_amount)}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${getBalanceColor(deposit.current_balance, deposit.deposit_amount)}`}>
                  {formatCurrency(deposit.current_balance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deposit.status)}`}>
                    {deposit.status === 'active' ? '🟢 Actif' : 
                     deposit.status === 'returned' ? '🔵 Remboursé' :
                     deposit.status === 'partial' ? '🟡 Partiel' : '⚫ Archivé'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {deposit.payment_date 
                    ? new Date(deposit.payment_date).toLocaleDateString('fr-FR')
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onView && onView(deposit)}
                      className="p-1 hover:bg-blue-50 rounded transition"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </button>
                    
                    {deposit.status === 'active' && (
                      <button
                        onClick={() => onReturn && onReturn(deposit)}
                        className="p-1 hover:bg-green-50 rounded transition"
                        title="Rembourser"
                      >
                        <ArrowDown className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onDelete && onDelete(deposit.id)}
                      className="p-1 hover:bg-red-50 rounded transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DepositTable;
