import React, { useState } from 'react';
import { useRole } from '../contexts/RoleContext';
import { PerformanceMetrics, AIInsightsPanel } from '../components/AICharts';
import { Briefcase, CheckCircle, Clock, MapPin, Users, Phone } from 'lucide-react';

export default function DashboardAgent() {
  const { userRole, currentUser, switchRole } = useRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const agentKPIs = [
    {
      title: 'Propriétés Actives',
      value: '12',
      change: '+3 cette semaine',
      status: 'positive',
      icon: MapPin,
      color: '#0056B3'
    },
    {
      title: 'Visites Programmées',
      value: '8',
      change: 'Cette semaine',
      status: 'info',
      icon: Clock,
      color: '#FF8C00'
    },
    {
      title: 'Transactions Complétées',
      value: '5',
      change: 'Ce mois',
      status: 'positive',
      icon: CheckCircle,
      color: '#00A86B'
    },
    {
      title: 'Leads',
      value: '24',
      change: '+6 en suivi',
      status: 'positive',
      icon: Users,
      color: '#9932CC'
    }
  ];

  const myTasks = [
    { id: 1, title: 'Appel Client - Dupont', status: 'Urgent', time: 'Aujourd\'hui 14h' },
    { id: 2, title: 'Visite Propriété - Rue de Flandre', status: 'En cours', time: 'Aujourd\'hui 16h' },
    { id: 3, title: 'Signature Contrat - Martin', status: 'Prévu', time: 'Demain 10h' },
    { id: 4, title: 'Documentation - Dossier 45', status: 'À faire', time: 'Cette semaine' }
  ];

  const myProperties = [
    { id: 1, address: '123 Rue de Flandre, Paris', type: 'Appartement', status: 'Actif', inquiries: 3 },
    { id: 2, address: '45 Boulevard Haussmann, Paris', type: 'Maison', status: 'Actif', inquiries: 5 },
    { id: 3, address: '78 Avenue Montaigne, Paris', type: 'Studio', status: 'Vendu', inquiries: 8 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#001F3F] via-[#0056B3] to-[#CC0000] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Briefcase size={32} />
                AKIG - Dashboard Agent
              </h1>
              <p className="text-blue-100 mt-1">Gestion Opérationnelle - {currentUser.name}</p>
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
        {/* Agent KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {agentKPIs.map((kpi, idx) => {
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
                <div className="text-sm font-semibold text-gray-600">
                  {kpi.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Chart */}
        <div className="mb-8">
          <PerformanceMetrics title="Performance Opérationnelle" />
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-[#0056B3] mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={24} />
            Mes Tâches
          </h3>
          <div className="space-y-3">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{task.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{task.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  task.status === 'Urgent' ? 'bg-red-100 text-red-700' :
                  task.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                  task.status === 'Prévu' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* My Properties */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-[#CC0000]">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={24} />
            Mes Propriétés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myProperties.map(prop => (
              <div key={prop.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{prop.address}</p>
                    <p className="text-sm text-gray-600 mt-1">{prop.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    prop.status === 'Actif' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {prop.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-3 border-t">
                  <Phone size={16} />
                  <span>{prop.inquiries} demandes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 Conseils IA pour Agent</h2>
          <AIInsightsPanel />
        </div>
      </main>
    </div>
  );
}
