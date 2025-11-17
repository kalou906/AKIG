/**
 * 💼 Page Charges et Régularisation - Frontend React
 * ImmobilierLoyer Integration
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Home, DollarSign, FileText } from 'lucide-react';
import API from '../services/api';

export default function ChargesPage() {
  const [charges, setCharges] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [formData, setFormData] = useState({
    type: 'water',
    amount: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const chargeTypes = [
    { value: 'water', label: '💧 Eau' },
    { value: 'electricity', label: '⚡ Électricité' },
    { value: 'coproperty', label: '🏢 Copropriété' },
    { value: 'maintenance', label: '🔧 Maintenance' },
    { value: 'insurance', label: '🛡️ Assurance' },
    { value: 'taxes', label: '📋 Taxes' }
  ];

  // Charger les charges
  useEffect(() => {
    if (selectedContract) {
      loadCharges();
    }
  }, [selectedContract]);

  const loadCharges = async () => {
    try {
      setLoading(true);
      const data = await API.get(`/charges/${selectedContract}`);
      setCharges(data.data || []);
    } catch (err) {
      console.error('Erreur chargement charges:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCharge = async () => {
    try {
      if (!formData.amount || !selectedContract) {
        alert('Veuillez remplir tous les champs');
        return;
      }

      const result = await API.post('/charges', {
        contractId: selectedContract,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        startDate: formData.startDate
      });

      alert('✅ Charge ajoutée');
      setFormData({ type: 'water', amount: '', description: '', startDate: new Date().toISOString().split('T')[0] });
      setShowAddCharge(false);
      loadCharges();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const regularize = async () => {
    try {
      const year = new Date().getFullYear();
      const result = await API.post(`/charges/${selectedContract}/regularize`, { year });
      alert(`✅ Régularisation complétée\n${result.data.message}`);
      loadCharges();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const calculateTotal = () => {
    return charges.reduce((sum, c) => sum + parseFloat(c.amount_gnf || 0), 0).toFixed(2);
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Charges</p>
              <p className="text-2xl font-bold text-blue-600">{calculateTotal()} GNF</p>
            </div>
            <TrendingUp className="text-blue-400" size={32} />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Charges Actives</p>
              <p className="text-2xl font-bold text-green-600">{charges.filter(c => !c.end_date).length}</p>
            </div>
            <Home className="text-green-400" size={32} />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Régularisations</p>
              <p className="text-2xl font-bold text-orange-600">{regularizations.length}</p>
            </div>
            <FileText className="text-orange-400" size={32} />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Alertes</p>
              <p className="text-2xl font-bold text-red-600">2</p>
            </div>
            <AlertCircle className="text-red-400" size={32} />
          </div>
        </div>
      </div>

      {/* Sélection contrat */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionner un contrat</label>
        <input
          type="text"
          placeholder="ID du contrat"
          value={selectedContract || ''}
          onChange={(e) => setSelectedContract(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Ajouter charge */}
      {showAddCharge && (
        <div className="bg-white p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-4">➕ Nouvelle Charge</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {chargeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Montant (GNF)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={addCharge}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                ✅ Ajouter
              </button>
              <button
                onClick={() => setShowAddCharge(false)}
                className="flex-1 bg-gray-300 text-black px-4 py-2 rounded-lg"
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {!showAddCharge && selectedContract && (
        <button
          onClick={() => setShowAddCharge(true)}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          ➕ Ajouter une Charge
        </button>
      )}

      {/* Tableau charges */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Montant</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Période</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Chargement...</td></tr>
            ) : charges.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Aucune charge</td></tr>
            ) : (
              charges.map(charge => (
                <tr key={charge.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {chargeTypes.find(t => t.value === charge.type)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{parseFloat(charge.amount_gnf).toLocaleString()} GNF</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(charge.start_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{charge.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Boutons actions */}
      {selectedContract && (
        <div className="flex gap-3">
          <button
            onClick={regularize}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
          >
            🔄 Régulariser (Année)
          </button>
          <button
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold"
          >
            📊 Relevé Annuel
          </button>
        </div>
      )}
    </div>
  );
}
