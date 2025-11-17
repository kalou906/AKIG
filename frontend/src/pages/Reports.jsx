/**
 * Reports.jsx
 * Phase 10: Dashboard with 6 report types
 * Filters, export, visualization
 */

import React, { useState } from 'react';
import { BarChart3, Download, Filter, Calendar } from 'lucide-react';
import { useQuery } from '../hooks/useQuery';
import { ensureItems } from '../utils/shape';
import { ErrorBanner, SkeletonCard } from '../components/design-system/Feedback';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('payments');
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    format: 'json'
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const reports = {
    payments: { title: 'Paiements', icon: '💰', endpoint: '/reports/payments' },
    fiscal: { title: 'Fiscal', icon: '📊', endpoint: '/reports/fiscal' },
    occupancy: { title: 'Occupation', icon: '🏠', endpoint: '/reports/occupancy' },
    'income-expense': { title: 'Revenus/Dépenses', icon: '📈', endpoint: '/reports/income-expense' },
    reconciliation: { title: 'Rapprochement', icon: '🔄', endpoint: '/reports/reconciliation' },
    fees: { title: 'Honoraires', icon: '💵', endpoint: '/reports/fees' }
  };

  const { data: rawReport, loading, error } = useQuery(() => {
    const params = new URLSearchParams({
      format: 'json',
      date_from: filters.date_from,
      date_to: filters.date_to
    });
    return fetch(`/api${reports[activeTab].endpoint}?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then(r => r.json());
  });
  // Normalisation : accepte data, items, ou tableau direct
  const reportData = rawReport?.data ?? ensureItems(rawReport).items ?? rawReport;

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({
        format,
        date_from: filters.date_from,
        date_to: filters.date_to
      });

      const res = await fetch(`/api${reports[activeTab].endpoint}?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!res.ok) throw new Error('Export échoué');

      if (format === 'json') {
        const json = await res.json();
        const element = document.createElement('a');
        element.href = URL.createObjectURL(new Blob([JSON.stringify(json?.data ?? json, null, 2)], { type: 'application/json' }));
        element.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(element);
        element.click();
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={32} /> Rapports
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {Object.entries(reports).map(([key, report]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-4 font-semibold flex items-center gap-2 transition ${activeTab === key
                ? 'border-b-4 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900 border-b-4 border-transparent'
                }`}
            >
              <span className="text-lg">{report.icon}</span>
              {report.title}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Export */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold mb-2">Depuis</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold mb-2">Jusqu'au</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download size={18} /> JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download size={18} /> CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <Download size={18} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card p-6">
        {loading ? (
          <SkeletonCard height={48} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : !reportData || (Array.isArray(reportData) && reportData.length === 0) ? (
          <div className="text-center py-8 text-gray-500">Aucune donnée</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            {reportData.summary && (
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(reportData.summary).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 uppercase">{key.replace(/_/g, ' ')}</div>
                    <div className="text-2xl font-bold mt-2">
                      {typeof value === 'number' && value < 1 ? formatPercent(value) : typeof value === 'number' ? formatCurrency(value) : value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Data Table */}
            {Array.isArray(reportData) && reportData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {Object.keys(reportData[0]).map(key => (
                        <th key={key} className="px-4 py-2 text-left font-semibold text-gray-700">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        {Object.entries(row).map(([key, value]) => (
                          <td key={key} className="px-4 py-2">
                            {typeof value === 'number' && value < 1 ? formatPercent(value) : typeof value === 'number' ? formatCurrency(value) : typeof value === 'string' ? value : JSON.stringify(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {reportData.length > 20 && (
                  <div className="text-center py-4 text-gray-500 text-xs">
                    Affichage des 20 premiers résultats ({reportData.length} total)
                  </div>
                )}
              </div>
            )}

            {/* Details Section */}
            {reportData.details && (
              <div className="space-y-4">
                {Object.entries(reportData.details).map(([section, data]) => (
                  <div key={section} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">{section}</h3>
                    {typeof data === 'object' ? (
                      <dl className="grid grid-cols-2 gap-4">
                        {Object.entries(data).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-sm text-gray-600">{key}</dt>
                            <dd className="text-lg font-semibold">
                              {typeof value === 'number' && value < 1 ? formatPercent(value) : typeof value === 'number' ? formatCurrency(value) : value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <div className="text-gray-700">{data}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
