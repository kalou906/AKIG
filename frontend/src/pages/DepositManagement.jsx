/**
 * 💰 Deposit Management Page
 * Gestion des dépôts de garantie
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, ArrowDown, Home, User, Calendar } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import Table from '../../components/Table';
import Modal from '../../components/Modal';

const DepositManagement = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  
  const [formData, setFormData] = useState({
    contract_id: '',
    property_id: '',
    tenant_id: '',
    deposit_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: ''
  });

  // Charger les dépôts au montage
  useEffect(() => {
    loadDeposits();
  }, [filterStatus]);

  const loadDeposits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/deposits', {
        params: { status: filterStatus }
      });
      setDeposits(response.data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement dépôts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.contract_id || !formData.deposit_amount) {
        setError('Contrat et montant requis');
        return;
      }

      await api.post('/deposits/manage', {
        ...formData,
        deposit_amount: parseFloat(formData.deposit_amount)
      });

      setShowModal(false);
      setFormData({
        contract_id: '',
        property_id: '',
        tenant_id: '',
        deposit_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: ''
      });
      
      loadDeposits();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReturnDeposit = async (depositId) => {
    if (window.confirm('Êtes-vous sûr de vouloir rembourser ce dépôt?')) {
      try {
        await api.post(`/deposits/${depositId}/return`, {
          return_date: new Date().toISOString().split('T')[0],
          deductions: [],
          method: 'bank_transfer'
        });
        loadDeposits();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDelete = async (depositId) => {
    if (window.confirm('Êtes-vous sûr de vouloir archiver ce dépôt?')) {
      try {
        await api.delete(`/deposits/${depositId}`);
        loadDeposits();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const columns = [
    {
      key: 'contract_number',
      label: 'Contrat',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-blue-600" />
          {row.contract_number || '-'}
        </div>
      )
    },
    {
      key: 'property_name',
      label: 'Propriété',
      render: (row) => row.property_name || '-'
    },
    {
      key: 'tenant_name',
      label: 'Locataire',
      render: (row) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          {row.tenant_name || '-'}
        </div>
      )
    },
    {
      key: 'deposit_amount',
      label: 'Montant',
      render: (row) => `${parseFloat(row.deposit_amount).toFixed(2)}€`
    },
    {
      key: 'current_balance',
      label: 'Solde',
      render: (row) => (
        <span className={parseFloat(row.current_balance) > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
          {parseFloat(row.current_balance).toFixed(2)}€
        </span>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'returned' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status === 'active' ? 'Actif' : 
           row.status === 'returned' ? 'Remboursé' : 
           'Archivé'}
        </span>
      )
    },
    {
      key: 'payment_date',
      label: 'Date de paiement',
      render: (row) => row.payment_date ? new Date(row.payment_date).toLocaleDateString('fr-FR') : '-'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleReturnDeposit(row.id)}
            disabled={row.status !== 'active'}
            className="p-1 hover:bg-blue-100 rounded text-blue-600 disabled:opacity-50"
            title="Rembourser"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Dépôts de Garantie</h1>
        <Button onClick={() => setShowModal(true)} icon={Plus}>
          Nouveau Dépôt
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="status"
            value="active"
            checked={filterStatus === 'active'}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-4 h-4"
          />
          <span>Actifs</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="status"
            value="returned"
            checked={filterStatus === 'returned'}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-4 h-4"
          />
          <span>Remboursés</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="status"
            value="archived"
            checked={filterStatus === 'archived'}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-4 h-4"
          />
          <span>Archivés</span>
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <Table
          columns={columns}
          data={deposits}
          keyField="id"
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Modifier Dépôt' : 'Nouveau Dépôt de Garantie'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Contrat*"
            name="contract_id"
            type="number"
            value={formData.contract_id}
            onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
            required
          />

          <FormField
            label="Montant*"
            name="deposit_amount"
            type="number"
            step="0.01"
            value={formData.deposit_amount}
            onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
            required
          />

          <FormField
            label="Date de Paiement"
            name="payment_date"
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
          />

          <FormField
            label="Statut"
            name="status"
            type="select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'held', label: 'Gelé' },
              { value: 'returned', label: 'Remboursé' }
            ]}
          />

          <FormField
            label="Notes"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex gap-4 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepositManagement;
