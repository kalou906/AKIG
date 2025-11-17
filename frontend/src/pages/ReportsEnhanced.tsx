/**
 * 📊 ReportsEnhanced - Page de rapports et analyses avec graphiques
 */

import React, { useState } from 'react';
import { TrendingUp, Calendar, Download, Filter, BarChart3, PieChart, LineChart } from 'lucide-react';

interface ReportData {
  month: string;
  revenue: number;
  expenses: number;
  occupancy: number;
}

export default function ReportsEnhanced() {
  const [dateRange, setDateRange] = useState('month');
  const [selectedProperty, setSelectedProperty] = useState('all');

  const reportData: ReportData[] = [
    { month: 'Jan', revenue: 2500000, expenses: 800000, occupancy: 85 },
    { month: 'Fév', revenue: 2650000, expenses: 850000, occupancy: 88 },
    { month: 'Mar', revenue: 2780000, expenses: 900000, occupancy: 90 },
    { month: 'Avr', revenue: 2900000, expenses: 950000, occupancy: 92 },
    { month: 'Mai', revenue: 3050000, expenses: 1000000, occupancy: 95 },
    { month: 'Juin', revenue: 3200000, expenses: 1050000, occupancy: 97 },
  ];

  const properties = [
    { value: 'all', label: 'Toutes les propriétés' },
    { value: 'centre-ville', label: 'Immeuble Centre-Ville' },
    { value: 'villa-nord', label: 'Villa Côte Nord' },
    { value: 'presquile', label: 'Studio Presqu\'île' },
    { value: 'kindia', label: 'Maison Kindia' },
    { value: 'bambeto', label: 'Immeuble Bambéto' },
  ];

  // Calculate totals
  const totalRevenue = reportData.reduce((sum, d) => sum + d.revenue, 0);
  const totalExpenses = reportData.reduce((sum, d) => sum + d.expenses, 0);
  const avgOccupancy = Math.round(reportData.reduce((sum, d) => sum + d.occupancy, 0) / reportData.length);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rapports & Analyses</h1>
          <p className="text-gray-600">Vue d'ensemble de la performance et des finances</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Revenu total',
              value: `${(totalRevenue / 1000000).toFixed(2)}M FG`,
              trend: '+12.5%',
              icon: TrendingUp,
              color: 'from-green-400 to-green-600',
              delay: '0ms',
            },
            {
              title: 'Dépenses',
              value: `${(totalExpenses / 1000000).toFixed(2)}M FG`,
              trend: '+3.2%',
              icon: TrendingUp,
              color: 'from-red-400 to-red-600',
              delay: '100ms',
            },
            {
              title: 'Bénéfice net',
              value: `${(netProfit / 1000000).toFixed(2)}M FG`,
              trend: '+15.3%',
              icon: TrendingUp,
              color: 'from-blue-400 to-blue-600',
              delay: '200ms',
            },
            {
              title: 'Occupation moyenne',
              value: `${avgOccupancy}%`,
              trend: '+4.1%',
              icon: TrendingUp,
              color: 'from-purple-400 to-purple-600',
              delay: '300ms',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${stat.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-slideInUp`}
              style={{ animationDelay: stat.delay }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs mt-2 opacity-75">{stat.trend}</p>
                </div>
                <stat.icon size={40} className="opacity-75" />
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-slideInUp" style={{ animationDelay: '400ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            {/* Property Filter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Propriété</label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                {properties.map(prop => (
                  <option key={prop.value} value={prop.value}>{prop.label}</option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105">
                <Download size={18} />
                Exporter PDF
              </button>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-slideInUp" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tendance des revenus</h2>
              <LineChart className="text-blue-500" size={24} />
            </div>

            <div className="space-y-4">
              {reportData.map((data, i) => {
                const maxRevenue = Math.max(...reportData.map(d => d.revenue));
                const percentage = (data.revenue / maxRevenue) * 100;
                return (
                  <div key={i} className="animate-slideInUp" style={{ animationDelay: `${600 + i * 50}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">{data.month}</span>
                      <span className="font-bold text-gray-900">{(data.revenue / 1000000).toFixed(2)}M FG</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Occupation Rate Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-slideInUp" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Taux d'occupation</h2>
              <BarChart3 className="text-green-500" size={24} />
            </div>

            <div className="space-y-4">
              {reportData.map((data, i) => (
                <div key={i} className="animate-slideInUp" style={{ animationDelay: `${650 + i * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">{data.month}</span>
                    <span className="font-bold text-gray-900">{data.occupancy}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.occupancy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slideInUp" style={{ animationDelay: '700ms' }}>
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Détails mensuels</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mois</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Revenu</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dépenses</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bénéfice</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Occupation</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Marge</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((data, i) => {
                  const profit = data.revenue - data.expenses;
                  const margin = ((profit / data.revenue) * 100).toFixed(1);
                  return (
                    <tr
                      key={i}
                      className={`border-b transition-colors ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 animate-slideInUp`}
                      style={{ animationDelay: `${750 + i * 50}ms` }}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{data.month}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">{(data.revenue / 1000000).toFixed(2)}M</td>
                      <td className="px-6 py-4 font-semibold text-red-600">{(data.expenses / 1000000).toFixed(2)}M</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">{(profit / 1000000).toFixed(2)}M</td>
                      <td className="px-6 py-4">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-full"
                            style={{ width: `${data.occupancy}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 animate-slideInUp" style={{ animationDelay: '900ms' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Résumé des performances</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Meilleur mois</p>
              <p className="text-2xl font-bold text-green-700">Juin</p>
              <p className="text-xs text-gray-600 mt-2">3.2M FG généré</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Croissance moyenne</p>
              <p className="text-2xl font-bold text-blue-700">+12.5%</p>
              <p className="text-xs text-gray-600 mt-2">Comparé au trimestre précédent</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 mb-1">Marge nette moyenne</p>
              <p className="text-2xl font-bold text-purple-700">67.5%</p>
              <p className="text-xs text-gray-600 mt-2">Revenu moins dépenses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
