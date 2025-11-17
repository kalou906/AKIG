import React, { useState } from 'react';
import { useRole } from '../contexts/RoleContext';
import { RevenueChart, PerformanceMetrics, PredictiveAnalysis, CostDistribution, AIInsightsPanel } from '../components/AICharts';
import { BarChart3, Settings, LogOut, Users, FileText, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';

export default function DashboardPDG() {
  const { userRole, currentUser, switchRole, hasPermission } = useRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [timeframe, setTimeframe] = useState('month');

  const kpis = [
    {
      title: 'Chiffre d\'Affaires',
      value: '$328,456',
      change: '+12.5%',
      status: 'positive',
      icon: DollarSign,
      color: '#0056B3'
    },
    {
      title: 'Rentabilité',
      value: '34.2%',
      change: '+2.3%',
      status: 'positive',
      icon: TrendingUp,
      color: '#00A86B'
    },
    {
      title: 'Clients Actifs',
      value: '1,247',
      change: '+8.1%',
      status: 'positive',
      icon: Users,
      color: '#FF8C00'
    },
    {
      title: 'Alertes Système',
      value: '3',
      change: 'À traiter',
      status: 'warning',
      icon: AlertCircle,
      color: '#CC0000'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#001F3F] via-[#0056B3] to-[#CC0000] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 size={32} />
                AKIG - Dashboard PDG
              </h1>
              <p className="text-blue-100 mt-1">Bienvenue, {currentUser.name}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Users size={20} />
                {userRole.toUpperCase()}
              </button>
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl z-50">
                  {['pdg', 'comptable', 'agent'].map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 ${
                        userRole === role ? 'bg-[#0056B3] text-white' : ''
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Timeframe Selector */}
        <div className="mb-8 flex gap-3">
          {['day', 'week', 'month', 'year'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-[#0056B3] to-[#CC0000] text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tf === 'day' ? 'Jour' : tf === 'week' ? 'Semaine' : tf === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: kpi.color }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
                  </div>
                  <Icon size={32} style={{ color: kpi.color }} opacity={0.7} />
                </div>
                <div className={`text-sm font-semibold ${kpi.status === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 Insights IA</h2>
          <AIInsightsPanel />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart title={`Analyse des Revenus (${timeframe})`} />
          <PerformanceMetrics title="Métriques de Performance" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PredictiveAnalysis title="Analyse Prédictive IA" />
          <CostDistribution title="Distribution des Coûts" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-[#0056B3]">
          <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-[#0056B3] to-[#003D82] text-white px-4 py-3 rounded-lg hover:shadow-lg transition flex items-center gap-2">
              <FileText size={20} />
              Générer Rapport
            </button>
            <button className="bg-gradient-to-r from-[#CC0000] to-[#990000] text-white px-4 py-3 rounded-lg hover:shadow-lg transition flex items-center gap-2">
              <Users size={20} />
              Gérer Équipe
            </button>
            <button className="bg-gradient-to-r from-[#00A86B] to-[#008040] text-white px-4 py-3 rounded-lg hover:shadow-lg transition flex items-center gap-2">
              <Settings size={20} />
              Paramètres
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
