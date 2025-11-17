/**
 * 📋 Detailed Reports Page
 * Location: frontend/src/pages/DetailedReports.jsx
 */

import React, { useState } from 'react';
import { Download, Filter, Eye, BarChart3 } from 'lucide-react';
import Button from '../components/Button';

const DetailedReports = () => {
  const [activeTab, setActiveTab] = useState('property');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    property_id: '',
    from_date: '',
    to_date: '',
    year: new Date().getFullYear()
  });

  const tabs = [
    { id: 'property', label: '🏠 Propriétés', icon: '🏠' },
    { id: 'tenant', label: '👤 Locataires', icon: '👤' },
    { id: 'financial', label: '💰 Financier', icon: '💰' },
    { id: 'settlement', label: '📊 Régularisations', icon: '📊' }
  ];

  const generateReport = async (reportType) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      let url = '';
      switch(reportType) {
        case 'property':
          url = `/api/phase3/reports/property/${filters.property_id}`;
          break;
        case 'occupancy':
          url = '/api/phase3/reports/occupancy';
          break;
        case 'settlements':
          url = `/api/phase3/reports/settlements?year=${filters.year}`;
          break;
        case 'arrears':
          url = '/api/phase3/reports/arrears';
          break;
        case 'cashflow':
          url = `/api/phase3/reports/cash-flow?from_date=${filters.from_date}&to_date=${filters.to_date}`;
          break;
        case 'expenses':
          url = `/api/phase3/reports/expenses?from_date=${filters.from_date}&to_date=${filters.to_date}`;
          break;
        default:
          return;
      }

      const response = await fetch(url, { headers });
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
        setSelectedReport(reportType);
      } else {
        alert('Erreur lors du chargement du rapport');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = (format) => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📋 Rapports Détaillés</h1>
        <p className="text-gray-600 mt-1">Générez des rapports personnalisés pour analyser votre activité</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 'property' && (
          <>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Performance Propriété</h3>
              <input
                type="number"
                placeholder="ID Propriété"
                value={filters.property_id}
                onChange={(e) => setFilters({...filters, property_id: e.target.value})}
                className="w-full border rounded px-3 py-2 mb-3"
              />
              <Button
                onClick={() => generateReport('property')}
                disabled={!filters.property_id || isLoading}
                className="w-full"
              >
                Générer Rapport
              </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Taux d'Occupation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Voir le taux d'occupation de tous les immeubles
              </p>
              <Button
                onClick={() => generateReport('occupancy')}
                disabled={isLoading}
                className="w-full"
              >
                Voir Rapport
              </Button>
            </div>
          </>
        )}

        {activeTab === 'tenant' && (
          <>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Arriérés</h3>
              <p className="text-sm text-gray-600 mb-3">
                Analyse des locataires en retard de paiement
              </p>
              <Button
                onClick={() => generateReport('arrears')}
                disabled={isLoading}
                className="w-full"
              >
                Voir Rapport
              </Button>
            </div>
          </>
        )}

        {activeTab === 'financial' && (
          <>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Flux de Trésorerie</h3>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                className="w-full border rounded px-3 py-2 mb-2"
                placeholder="Du"
              />
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                className="w-full border rounded px-3 py-2 mb-3"
                placeholder="Au"
              />
              <Button
                onClick={() => generateReport('cashflow')}
                disabled={isLoading}
                className="w-full"
              >
                Voir Rapport
              </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Détail Charges</h3>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                className="w-full border rounded px-3 py-2 mb-2"
              />
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                className="w-full border rounded px-3 py-2 mb-3"
              />
              <Button
                onClick={() => generateReport('expenses')}
                disabled={isLoading}
                className="w-full"
              >
                Voir Rapport
              </Button>
            </div>
          </>
        )}

        {activeTab === 'settlement' && (
          <>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Régularisations</h3>
              <input
                type="number"
                placeholder="Année"
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                className="w-full border rounded px-3 py-2 mb-3"
              />
              <Button
                onClick={() => generateReport('settlements')}
                disabled={isLoading}
                className="w-full"
              >
                Voir Rapport
              </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">Renouvellements Contrats</h3>
              <p className="text-sm text-gray-600 mb-3">
                Contrats expirant prochainement
              </p>
              <Button disabled className="w-full">
                (Bientôt disponible)
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900">
              {selectedReport === 'property' && '📊 Performance Propriété'}
              {selectedReport === 'occupancy' && '🏠 Taux d\'Occupation'}
              {selectedReport === 'arrears' && '⚠️ Arriérés'}
              {selectedReport === 'cashflow' && '💰 Flux de Trésorerie'}
              {selectedReport === 'expenses' && '📉 Détail des Charges'}
              {selectedReport === 'settlements' && '📋 Régularisations'}
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadReport('json')}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadReport('csv')}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>

          {/* Report Content */}
          <div className="overflow-x-auto bg-gray-50 p-4 rounded border">
            {selectedReport === 'property' && reportData.performance && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Contrats Actifs:</span>
                  <span className="font-semibold">{reportData.performance.active_contracts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenu Total:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(reportData.performance.total_revenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dépenses Totales:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(reportData.performance.total_expenses)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>Revenu Net:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatCurrency(reportData.performance.net_income)}
                  </span>
                </div>
              </div>
            )}

            {selectedReport === 'occupancy' && reportData.occupancy_status && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Propriétés:</span>
                  <span className="font-semibold">{reportData.occupancy_status.total_properties}</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupées:</span>
                  <span className="font-semibold text-green-600">
                    {reportData.occupancy_status.occupied}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vacantes:</span>
                  <span className="font-semibold text-red-600">
                    {reportData.occupancy_status.vacant}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>Taux d'Occupation:</span>
                  <span className="font-bold text-lg">
                    {reportData.occupancy_status.occupancy_rate}%
                  </span>
                </div>
              </div>
            )}

            {reportData.summary && (
              <div className="text-sm text-gray-600">
                <pre className="bg-white p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedReports;
