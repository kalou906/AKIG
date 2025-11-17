import React, { useState } from 'react';
import { useRole } from '../contexts/RoleContext';
import { PerformanceMetrics, CostDistribution, AIInsightsPanel } from '../components/AICharts';
import { PieChart, CreditCard, FileText, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function DashboardComptable() {
  const { userRole, currentUser, switchRole } = useRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const financialKPIs = [
    {
      title: 'Total Actifs',
      value: '$1.2M',
      change: '+5.2%',
      status: 'positive',
      icon: CreditCard,
      color: '#0056B3'
    },
    {
      title: 'Passifs',
      value: '$450K',
      change: '-2.1%',
      status: 'positive',
      icon: TrendingDown,
      color: '#CC0000'
    },
    {
      title: 'Bénéfice Net',
      value: '$320K',
      change: '+8.7%',
      status: 'positive',
      icon: CheckCircle,
      color: '#00A86B'
    },
    {
      title: 'Alertes Comptables',
      value: '2',
      change: 'À vérifier',
      status: 'warning',
      icon: AlertCircle,
      color: '#FFD700'
    }
  ];

  const transactions = [
    { id: 1, description: 'Paiement Fournisseur A', amount: '-$15,000', date: '2025-10-28', status: 'Approuvé' },
    { id: 2, description: 'Vente Client B', amount: '+$22,500', date: '2025-10-28', status: 'Confirmé' },
    { id: 3, description: 'Frais Opérationnels', amount: '-$5,200', date: '2025-10-27', status: 'En attente' },
    { id: 4, description: 'Dépôt Banque', amount: '+$50,000', date: '2025-10-27', status: 'Traité' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#001F3F] via-[#0056B3] to-[#CC0000] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <PieChart size={32} />
                AKIG - Dashboard Comptable
              </h1>
              <p className="text-blue-100 mt-1">Gestion Financière - {currentUser.name}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {financialKPIs.map((kpi, idx) => {
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
                <div className={`text-sm font-semibold ${kpi.status === 'positive' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {kpi.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceMetrics title="Ratios Financiers" />
          <CostDistribution title="Distribution des Coûts" />
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 Insights Comptables IA</h2>
          <AIInsightsPanel />
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-[#0056B3]">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={24} />
            Transactions Récentes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{tx.description}</td>
                    <td className={`py-3 px-4 text-right font-bold ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{tx.date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        tx.status === 'Approuvé' ? 'bg-green-100 text-green-700' :
                        tx.status === 'Confirmé' ? 'bg-blue-100 text-blue-700' :
                        tx.status === 'Traité' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-gradient-to-r from-[#0056B3] to-[#003D82] text-white px-6 py-3 rounded-lg hover:shadow-lg transition flex items-center gap-2 font-semibold">
            <FileText size={20} />
            Exporter État Financier
          </button>
          <button className="bg-gradient-to-r from-[#CC0000] to-[#990000] text-white px-6 py-3 rounded-lg hover:shadow-lg transition flex items-center gap-2 font-semibold">
            <AlertCircle size={20} />
            Valider Transactions
          </button>
        </div>
      </main>
    </div>
  );
}
