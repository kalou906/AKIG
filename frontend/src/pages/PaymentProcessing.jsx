/**
 * 💳 Payment Processing Page
 * Location: frontend/src/pages/PaymentProcessing.jsx
 */

import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Send, Check, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Modal from '../components/Modal';

const PaymentProcessing = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', from_date: '', to_date: '' });
  const [formData, setFormData] = useState({
    contract_id: '',
    tenant_id: '',
    amount_paid: '',
    payment_method: 'bank_transfer',
    reference_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch payments
  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.from_date) queryParams.append('from_date', filters.from_date);
      if (filters.to_date) queryParams.append('to_date', filters.to_date);

      const response = await fetch(`/api/phase2/payments?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const result = await response.json();
      if (result.success) {
        setPayments(result.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = () => {
    setFormData({
      contract_id: '',
      tenant_id: '',
      amount_paid: '',
      payment_method: 'bank_transfer',
      reference_number: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.contract_id) newErrors.contract_id = 'Contrat requis';
    if (!formData.tenant_id) newErrors.tenant_id = 'Locataire requis';
    if (!formData.amount_paid) newErrors.amount_paid = 'Montant requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/phase2/payments/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        fetchPayments();
        alert('Paiement enregistré avec succès');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async (payment) => {
    if (!window.confirm('Concilier ce paiement ?')) return;

    try {
      const response = await fetch(`/api/phase2/payments/${payment.id}/reconcile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchPayments();
        alert('Paiement concilié');
      }
    } catch (error) {
      console.error('Error reconciling payment:', error);
    }
  };

  const handleGenerateReceipt = async (payment) => {
    try {
      const response = await fetch(`/api/phase2/payments/${payment.id}/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      const result = await response.json();
      if (result.success) {
        alert(`Reçu généré: ${result.data.receipt_number}`);
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💳 Gestion Paiements</h1>
          <p className="text-gray-600 mt-1">Enregistrement et réconciliation des paiements</p>
        </div>
        <Button onClick={handleAddPayment} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Paiement
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex items-end space-x-4">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="completed">Complété</option>
            <option value="failed">Échoué</option>
          </select>
        </div>

        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <Button variant="secondary" className="flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Filtrer
        </Button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locataire</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  Aucun paiement trouvé
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {payment.contract_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.tenant_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                    {formatCurrency(payment.amount_paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.payment_method === 'bank_transfer' ? '🏦 Virement' :
                     payment.payment_method === 'check' ? '🪙 Chèque' :
                     payment.payment_method === 'cash' ? '💵 Espèces' : payment.payment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.reference_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status === 'pending' ? '⏳ En attente' :
                       payment.status === 'completed' ? '✅ Complété' : payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handleReconcile(payment)}
                          className="p-1 hover:bg-green-50 rounded transition"
                          title="Concilier"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleGenerateReceipt(payment)}
                        className="p-1 hover:bg-blue-50 rounded transition"
                        title="Générer reçu"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Payment Modal */}
      <Modal
        title="Enregistrer Paiement"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Contrat ID"
              type="number"
              value={formData.contract_id}
              onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
              error={errors.contract_id}
              required
            />
            <FormField
              label="Locataire ID"
              type="number"
              value={formData.tenant_id}
              onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
              error={errors.tenant_id}
              required
            />
          </div>

          <FormField
            label="Montant"
            type="number"
            step="0.01"
            value={formData.amount_paid}
            onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
            error={errors.amount_paid}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="bank_transfer">Virement bancaire</option>
                <option value="check">Chèque</option>
                <option value="cash">Espèces</option>
              </select>
            </div>
            <FormField
              label="Référence"
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </div>

          <FormField
            label="Date Paiement"
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            required
          />

          <FormField
            label="Notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentProcessing;
