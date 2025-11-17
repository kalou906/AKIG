/**
 * 📊 Annual Settlement Page
 * Gestion des règlements annuels de charges
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Download, Check, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import Table from '../../components/Table';
import Modal from '../../components/Modal';

const AnnualSettlement = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    contract_id: '',
    settlement_year: new Date().getFullYear(),
    settlement_date: new Date().toISOString().split('T')[0],
    charges: [],
    notes: ''
  });

  const [chargeLines, setChargeLines] = useState([
    { type: 'water', provisioning_paid: '', actual_cost: '' },
    { type: 'electricity', provisioning_paid: '', actual_cost: '' },
    { type: 'gas', provisioning_paid: '', actual_cost: '' },
    { type: 'coproperty', provisioning_paid: '', actual_cost: '' }
  ]);

  useEffect(() => {
    if (selectedContractId) {
      loadSettlements();
    }
  }, [selectedContractId, selectedYear]);

  const loadSettlements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/settlements/${selectedContractId}/list`, {
        params: { year: selectedYear }
      });
      setSettlements(response.data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement règlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.contract_id) {
        setError('Contrat requis');
        return;
      }

      // Nettoyer les lignes vides
      const validCharges = chargeLines.filter(
        c => c.provisioning_paid || c.actual_cost
      ).map(c => ({
        type: c.type,
        provisioning_paid: parseFloat(c.provisioning_paid) || 0,
        actual_cost: parseFloat(c.actual_cost) || 0
      }));

      if (validCharges.length === 0) {
        setError('Au moins une charge requise');
        return;
      }

      await api.post('/settlements/annual', {
        contract_id: parseInt(formData.contract_id),
        settlement_year: formData.settlement_year,
        settlement_date: formData.settlement_date,
        charges: validCharges,
        notes: formData.notes
      });

      setShowModal(false);
      setChargeLines([
        { type: 'water', provisioning_paid: '', actual_cost: '' },
        { type: 'electricity', provisioning_paid: '', actual_cost: '' },
        { type: 'gas', provisioning_paid: '', actual_cost: '' },
        { type: 'coproperty', provisioning_paid: '', actual_cost: '' }
      ]);

      loadSettlements();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChargeChange = (index, field, value) => {
    const newLines = [...chargeLines];
    newLines[index][field] = value;
    setChargeLines(newLines);
  };

  const calculateBalance = () => {
    return chargeLines.reduce((acc, line) => {
      const paid = parseFloat(line.provisioning_paid) || 0;
      const actual = parseFloat(line.actual_cost) || 0;
      return acc + (actual - paid);
    }, 0);
  };

  const columns = [
    {
      key: 'settlement_year',
      label: 'Année',
      render: (row) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          {row.settlement_year}
        </div>
      )
    },
    {
      key: 'settlement_date',
      label: 'Date de Règlement',
      render: (row) => new Date(row.settlement_date).toLocaleDateString('fr-FR')
    },
    {
      key: 'total_provisioning_paid',
      label: 'Provisions Payées',
      render: (row) => `${parseFloat(row.total_provisioning_paid).toFixed(2)}€`
    },
    {
      key: 'total_actual_cost',
      label: 'Coûts Réels',
      render: (row) => `${parseFloat(row.total_actual_cost).toFixed(2)}€`
    },
    {
      key: 'balance',
      label: 'Solde',
      render: (row) => (
        <span className={parseFloat(row.balance) >= 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
          {parseFloat(row.balance) > 0 ? '+' : ''}{parseFloat(row.balance).toFixed(2)}€
        </span>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          row.status === 'approved' ? 'bg-green-100 text-green-800' :
          row.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status === 'approved' ? 'Approuvé' :
           row.status === 'pending_review' ? 'En attente' :
           'Brouillon'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Règlements Annuels de Charges</h1>
        <Button onClick={() => setShowModal(true)} icon={Plus}>
          Nouveau Règlement
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <FormField
          label="Contrat"
          name="contract_select"
          type="number"
          value={selectedContractId}
          onChange={(e) => setSelectedContractId(e.target.value)}
          placeholder="Sélectionner un contrat"
        />
        <FormField
          label="Année"
          name="year_select"
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        />
      </div>

      {/* Table */}
      {selectedContractId ? (
        loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <Table
            columns={columns}
            data={settlements}
            keyField="id"
          />
        )
      ) : (
        <div className="text-center py-8 text-gray-500">
          Sélectionner un contrat pour voir les règlements
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouveau Règlement Annuel"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Contrat*"
              name="contract_id"
              type="number"
              value={formData.contract_id}
              onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
              required
            />
            <FormField
              label="Année*"
              name="settlement_year"
              type="number"
              value={formData.settlement_year}
              onChange={(e) => setFormData({ ...formData, settlement_year: parseInt(e.target.value) })}
              required
            />
          </div>

          <FormField
            label="Date de Règlement"
            name="settlement_date"
            type="date"
            value={formData.settlement_date}
            onChange={(e) => setFormData({ ...formData, settlement_date: e.target.value })}
          />

          {/* Charges Table */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Détails des Charges</h3>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Type de Charge</th>
                  <th className="text-right py-2">Provisions Payées</th>
                  <th className="text-right py-2">Coût Réel</th>
                  <th className="text-right py-2">Solde</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {chargeLines.map((line, idx) => {
                  const balance = (parseFloat(line.actual_cost) || 0) - (parseFloat(line.provisioning_paid) || 0);
                  return (
                    <tr key={idx} className="border-b">
                      <td className="py-3">
                        <span className="capitalize">
                          {line.type === 'water' ? 'Eau' :
                           line.type === 'electricity' ? 'Électricité' :
                           line.type === 'gas' ? 'Gaz' :
                           line.type === 'coproperty' ? 'Copropriété' :
                           line.type}
                        </span>
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={line.provisioning_paid}
                          onChange={(e) => handleChargeChange(idx, 'provisioning_paid', e.target.value)}
                          className="w-full p-2 border rounded text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={line.actual_cost}
                          onChange={(e) => handleChargeChange(idx, 'actual_cost', e.target.value)}
                          className="w-full p-2 border rounded text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-3 text-right font-semibold">
                        <span className={balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : ''}>
                          {balance > 0 ? '+' : ''}{balance.toFixed(2)}€
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t font-semibold bg-gray-50">
                <tr>
                  <td className="py-3">TOTAL</td>
                  <td className="py-3 text-right">
                    {chargeLines.reduce((sum, c) => sum + (parseFloat(c.provisioning_paid) || 0), 0).toFixed(2)}€
                  </td>
                  <td className="py-3 text-right">
                    {chargeLines.reduce((sum, c) => sum + (parseFloat(c.actual_cost) || 0), 0).toFixed(2)}€
                  </td>
                  <td className={`py-3 text-right ${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {calculateBalance() > 0 ? '+' : ''}{calculateBalance().toFixed(2)}€
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <FormField
            label="Observations"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer le Règlement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AnnualSettlement;
