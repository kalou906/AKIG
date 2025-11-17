/**
 * 🏢 Page SCI & Multi-Propriétaires - Frontend React Premium
 * ImmobilierLoyer Integration
 */

import React, { useState, useEffect } from 'react';
import { Users, Building2, TrendingUp, Plus, Trash2, Edit2, Share2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '../services/api';

export default function SCIPage() {
  const [scis, setSCIs] = useState([]);
  const [selectedSCI, setSelectedSCI] = useState(null);
  const [sciDetails, setSCIDetails] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [financialReport, setFinancialReport] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    siret: '',
    address: '',
    manager_id: '',
    members_count: 0
  });

  // Charger SCIs
  useEffect(() => {
    loadSCIs();
  }, []);

  // Charger détails SCI
  useEffect(() => {
    if (selectedSCI) {
      loadSCIDetails();
      loadFinancialReport();
    }
  }, [selectedSCI]);

  const loadSCIs = async () => {
    try {
      setLoading(true);
      const data = await API.get('/sci');
      setSCIs(data.data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSCIDetails = async () => {
    try {
      const data = await API.get(`/sci/${selectedSCI}`);
      setSCIDetails(data.data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const loadFinancialReport = async () => {
    try {
      const year = new Date().getFullYear();
      const data = await API.get(`/sci/${selectedSCI}/financial-report/${year}`);
      setFinancialReport(data.data);
    } catch (err) {
      console.error('Erreur rapport:', err);
    }
  };

  const createSCI = async () => {
    try {
      if (!formData.name || !formData.manager_id) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      const result = await API.post('/sci', formData);
      alert('✅ SCI créée');
      setFormData({ name: '', siret: '', address: '', manager_id: '', members_count: 0 });
      setShowForm(false);
      loadSCIs();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const distributeMemberRevenue = async (month, year) => {
    try {
      const result = await API.post(`/sci/${selectedSCI}/distribute/${month}/${year}`);
      alert(`✅ Distribution créée pour ${result.data.distributions.length} membres`);
      loadFinancialReport();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Données pour graphiques
  const expenseData = financialReport ? financialReport.expenses.map((e, i) => ({
    type: e.type,
    amount: e.amount,
    color: COLORS[i % COLORS.length]
  })) : [];

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Sociétés Civiles Immobilières</h1>
          <p className="text-gray-600">Gestion multi-propriétaires et distributions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Créer SCI
        </button>
      </div>

      {/* Form création */}
      {showForm && (
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">➕ Nouvelle SCI</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom SCI"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="SIRET"
              value={formData.siret}
              onChange={(e) => setFormData({...formData, siret: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="ID Gestionnaire"
              value={formData.manager_id}
              onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={createSCI}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              ✅ Créer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              ❌ Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste SCIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {scis.map(sci => (
          <div
            key={sci.id}
            onClick={() => setSelectedSCI(sci.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition ${
              selectedSCI === sci.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900">{sci.name}</h4>
            <p className="text-xs text-gray-500 mt-1">SIRET: {sci.siret || 'N/A'}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Users size={16} className="text-blue-600" />
              <span>{sci.member_count || 0} membres</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-green-600" />
              <span>{sci.property_count || 0} biens</span>
            </div>
          </div>
        ))}
      </div>

      {/* Détails SCI */}
      {selectedSCI && sciDetails && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Membres</p>
              <p className="text-3xl font-bold text-blue-600">{sciDetails.summary.memberCount}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Capital Total</p>
              <p className="text-2xl font-bold text-green-600">{sciDetails.summary.totalCapital.toLocaleString()} GNF</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Propriétés</p>
              <p className="text-3xl font-bold text-purple-600">{sciDetails.summary.propertyCount}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Parts Total</p>
              <p className="text-2xl font-bold text-orange-600">{sciDetails.summary.totalShares.toFixed(1)}%</p>
            </div>
          </div>

          {/* Membres */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users size={24} /> Membres
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nom</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Part %</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Capital</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {sciDetails.members.map(member => (
                  <tr key={member.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">{member.first_name} {member.last_name}</td>
                    <td className="px-6 py-4 text-sm">{member.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${member.share_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{member.share_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{parseFloat(member.share_amount_gnf).toLocaleString()} GNF</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rapport Financier */}
          {financialReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={24} /> Revenus {financialReport.year}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-green-50 rounded">
                    <span>Collectés:</span>
                    <span className="font-bold text-green-600">{financialReport.revenue.totalCollected.toLocaleString()} GNF</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Paiements:</span>
                    <span className="font-semibold">{financialReport.revenue.paymentCount}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span>Biens Actifs:</span>
                    <span className="font-semibold">{financialReport.revenue.propertyCount}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between p-3 bg-blue-50 rounded font-bold">
                    <span>Revenu Net:</span>
                    <span className="text-blue-600">{financialReport.netRevenue.toLocaleString()} GNF</span>
                  </div>
                </div>
              </div>

              {/* Expenses Pie */}
              {expenseData.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">📊 Répartition Dépenses</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, amount }) => `${type}: ${amount.toLocaleString()} GNF`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => distributeMemberRevenue(new Date().getMonth() + 1, new Date().getFullYear())}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              <Share2 size={20} /> Distribuer Revenus
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-semibold">
              📄 Résolution AG
            </button>
          </div>
        </>
      )}
    </div>
  );
}
