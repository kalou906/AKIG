/**
 * 📊 Financial Dashboard Page
 * Location: frontend/src/pages/FinancialDashboard.jsx
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Home, Users, Calendar } from 'lucide-react';
import Button from '../components/Button';

const FinancialDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    financial: null,
    occupancy: null,
    arrears: null,
    deposits: null,
    cashFlow: null
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [financial, occupancy, arrears, deposits, cashFlow] = await Promise.all([
        fetch('/api/phase3/reports/financial-summary', { headers }).then(r => r.json()),
        fetch('/api/phase3/reports/occupancy', { headers }).then(r => r.json()),
        fetch('/api/phase3/reports/arrears', { headers }).then(r => r.json()),
        fetch('/api/phase3/reports/deposits', { headers }).then(r => r.json()),
        fetch('/api/phase3/reports/cash-flow', { headers }).then(r => r.json())
      ]);

      setDashboardData({
        financial: financial.data?.financial_summary,
        occupancy: occupancy.data?.occupancy_status,
        arrears: arrears.data?.summary,
        deposits: deposits.data?.summary,
        cashFlow: cashFlow.data
      });
    } catch (err) {
      setError(err.message);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-900',
      green: 'bg-green-50 text-green-900',
      red: 'bg-red-50 text-red-900',
      yellow: 'bg-yellow-50 text-yellow-900'
    };

    return (
      <div className={`${colors[color]} p-6 rounded-lg border`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtext && <p className="text-xs mt-2 opacity-75">{subtext}</p>}
          </div>
          <Icon className="w-8 h-8 opacity-50" />
        </div>
        {trend && (
          <div className="flex items-center mt-3 text-xs font-medium">
            {trend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">+{trend}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                <span className="text-red-600">{trend}%</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Tableau de Bord Financier</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre portefeuille immobilier</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading}>
          Actualiser
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Loyers Collectés"
          value={formatCurrency(dashboardData.financial?.total_rent_collected)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Charges Collectées"
          value={formatCurrency(dashboardData.financial?.total_charges_collected)}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Arriérés Impayés"
          value={formatCurrency(dashboardData.financial?.total_arrears)}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="Dépôts de Garantie"
          value={formatCurrency(dashboardData.financial?.deposits?.balance)}
          subtext={`${dashboardData.financial?.deposits?.count} dépôts`}
          icon={Home}
          color="yellow"
        />
      </div>

      {/* Occupancy & Arrears Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-600" />
            Taux d'Occupation
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Occupés</span>
                <span className="text-lg font-bold text-blue-600">
                  {dashboardData.occupancy?.occupied} / {dashboardData.occupancy?.total_properties}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${dashboardData.occupancy?.occupancy_rate || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.occupancy?.occupancy_rate}% occupé
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                🏠 Vacants: <span className="font-semibold">{dashboardData.occupancy?.vacant}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Arrears Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
            Situation des Arriérés
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-red-600">
                {dashboardData.arrears?.contracts_with_arrears || 0}
              </p>
              <p className="text-sm text-gray-600">Contrats en arrérages</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(dashboardData.arrears?.total_arrears_amount)}
              </p>
              <p className="text-sm text-gray-600">Total des arrérés</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Moyenne: {formatCurrency(dashboardData.arrears?.average_arrears)}
              </p>
            </div>
          </div>
        </div>

        {/* Deposits Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="w-5 h-5 mr-2 text-yellow-600" />
            Dépôts de Garantie
          </h3>
          <div className="space-y-2">
            {dashboardData.deposits?.map((deposit, index) => (
              <div key={index} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                <span className="text-sm text-gray-600 capitalize">{deposit.status}</span>
                <span className="font-semibold">
                  {deposit.count} ({formatCurrency(deposit.total_amount)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Flux de Trésorerie
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Cumulé</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {formatCurrency(dashboardData.cashFlow?.cumulative?.total)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nombre de Transactions</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {dashboardData.cashFlow?.cumulative?.transactions || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">Exporter PDF</Button>
        <Button variant="secondary">Exporter Excel</Button>
        <Button variant="secondary">Imprimer</Button>
      </div>
    </div>
  );
};

export default FinancialDashboard;
