/**
 * 📊 Page Rapports Fiscaux - Frontend React
 * ImmobilierLoyer Integration
 */

import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, DollarSign, Calculator } from 'lucide-react';
import API from '../services/api';

export default function FiscalPage() {
  const [landlordId, setLandlordId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [multiYear, setMultiYear] = useState(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await API.get(`/fiscal/report/${landlordId}/${year}`);
      setReport(data.data);
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMultiYear = async () => {
    try {
      const startYear = year - 2;
      const data = await API.get(`/fiscal/multi-year/${landlordId}/${startYear}/${year}`);
      setMultiYear(data.data);
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    }
  };

  // 📥 Download blob response correctly
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    try {
      const response = await fetch(`/api/exports/reports/fiscal-pdf?year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Export échoué');
      const blob = await response.blob();
      downloadBlob(blob, `rapport-fiscal-${year}.pdf`);
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const exportExcel = async () => {
    try {
      const response = await fetch(`/api/exports/reports/fiscal-excel?year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Export échoué');
      const blob = await response.blob();
      downloadBlob(blob, `fiscal-${year}.xlsx`);
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  // Données pour graphiques
  const expenseData = report ? [
    { name: 'Maintenance', value: report.expenses.maintenance },
    { name: 'Réparations', value: report.expenses.repairs },
    { name: 'Assurance', value: report.expenses.insurance },
    { name: 'Taxe', value: report.expenses.propertyTax },
    { name: 'Agence', value: report.expenses.agencyFee }
  ].filter(e => e.value > 0) : [];

  const revenueTrendData = multiYear ? multiYear.yearsReports.map(r => ({
    year: r.year,
    revenue: r.collectedRent,
    expenses: r.expenses,
    net: r.netIncome
  })) : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Rapports Fiscaux</h1>
        <p className="text-gray-600">Déclarations fiscales automatisées - Devise: GNF</p>
      </div>

      {/* Saisie */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Générer Rapport Fiscal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">ID Propriétaire</label>
            <input
              type="number"
              value={landlordId}
              onChange={(e) => setLandlordId(e.target.value)}
              placeholder="ex: 123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Année</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={!landlordId}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              📊 Charger Rapport
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Loyers Collectés</p>
              <p className="text-2xl font-bold text-green-600">
                {report.income.collectedAnnualRent.toLocaleString()} GNF
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Dépenses Totales</p>
              <p className="text-2xl font-bold text-red-600">
                {report.expenses.totalExpenses.toLocaleString()} GNF
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Revenu Net</p>
              <p className="text-2xl font-bold text-blue-600">
                {report.netIncome.toLocaleString()} GNF
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Impôt Estimé (15%)</p>
              <p className="text-2xl font-bold text-purple-600">
                {report.tax.estimatedAmount.toLocaleString()} GNF
              </p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Répartition dépenses */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">📊 Répartition Dépenses</h3>
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value.toLocaleString()} GNF`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune dépense enregistrée</p>
              )}
            </div>

            {/* Flux de trésorerie */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">💰 Résumé Financier</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>Contrats Actifs:</span>
                  <span className="font-semibold">{report.income.activeContracts}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>Loyers Attendus:</span>
                  <span className="font-semibold">{report.income.expectedAnnualRent.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded">
                  <span>Loyers Collectés:</span>
                  <span className="font-semibold text-green-600">{report.income.collectedAnnualRent.toLocaleString()} GNF</span>
                </div>
                <div className="border-t pt-3 flex justify-between p-3 bg-blue-50 rounded font-bold">
                  <span>Revenu Net (après impôt):</span>
                  <span className="text-blue-600">{report.tax.netAfterTax.toLocaleString()} GNF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Détail par propriété */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">🏠 Détail par Propriété</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Propriété</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Loyers Attendus</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Loyers Collectés</th>
                </tr>
              </thead>
              <tbody>
                {report.properties.map(prop => (
                  <tr key={prop.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{prop.title}</p>
                        <p className="text-xs text-gray-500">{prop.property_ref}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{prop.type}</td>
                    <td className="px-6 py-4">{prop.expected_annual_rent.toLocaleString()} GNF</td>
                    <td className="px-6 py-4 font-semibold text-green-600">{prop.collected_rent.toLocaleString()} GNF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Boutons exports */}
          <div className="flex gap-3">
            <button
              onClick={exportPDF}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-semibold"
            >
              <Download size={20} /> PDF
            </button>
            <button
              onClick={exportExcel}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              <Download size={20} /> Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
