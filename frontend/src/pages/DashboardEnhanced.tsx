/**
 * 🎯 Enhanced Dashboard - Version Premium avec animations et statistiques
 * Affichage en temps réel, graphiques, tendances, actions rapides
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, FileText, CreditCard, Building2, Users, BarChart3, Bell, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface StatCard {
  label: string;
  value: string;
  trend: string;
  color: string;
  icon: React.ReactNode;
  bgColor: string;
}

export default function DashboardEnhanced() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [animateCards, setAnimateCards] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Trigger animation on mount
    setAnimateCards(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { id: 'contracts', label: 'Contrats', icon: FileText, color: 'text-blue-600', count: 12 },
    { id: 'payments', label: 'Paiements', icon: CreditCard, color: 'text-green-600', count: 3 },
    { id: 'properties', label: 'Propriétés', icon: Building2, color: 'text-purple-600', count: 8 },
    { id: 'tenants', label: 'Locataires', icon: Users, color: 'text-orange-600', count: 24 },
    { id: 'reports', label: 'Rapports', icon: BarChart3, color: 'text-red-600', count: 5 },
    { id: 'reminders', label: 'Rappels', icon: Bell, color: 'text-yellow-600', count: 7 },
  ];

  const stats: StatCard[] = [
    {
      label: 'Contrats Actifs',
      value: '12',
      trend: '+2.5%',
      color: 'text-blue-600',
      icon: <FileText className="w-6 h-6" />,
      bgColor: 'bg-blue-50 border-blue-200 hover:border-blue-400'
    },
    {
      label: 'Paiements En Attente',
      value: '3',
      trend: '-1.2%',
      color: 'text-red-600',
      icon: <AlertCircle className="w-6 h-6" />,
      bgColor: 'bg-red-50 border-red-200 hover:border-red-400'
    },
    {
      label: 'Propriétés',
      value: '8',
      trend: '+0.8%',
      color: 'text-green-600',
      icon: <Building2 className="w-6 h-6" />,
      bgColor: 'bg-green-50 border-green-200 hover:border-green-400'
    },
    {
      label: 'Revenu Mensuel',
      value: '2.4M',
      trend: '+5.3%',
      color: 'text-yellow-600',
      icon: <TrendingUp className="w-6 h-6" />,
      bgColor: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
    },
  ];

  const recentActivities = [
    { id: 1, title: 'Contrat signé', description: 'Nouvel accord de location - Apt 203', time: '2h', icon: CheckCircle },
    { id: 2, title: 'Paiement reçu', description: 'Locataire Dupont - 850K GNF', time: '4h', icon: CreditCard },
    { id: 3, title: 'Alerte maintenance', description: 'Réparation chauffage urgente', time: '6h', icon: AlertCircle },
    { id: 4, title: 'Rappel contrat', description: 'Expiration dans 30 jours', time: '8h', icon: Clock },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col shadow-lg`}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-sm animate-pulse">A</div>
            {sidebarOpen && <span className="font-bold text-lg">AKIG</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-blue-700 rounded transition-all">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-700 transition-colors text-left group relative"
              >
                <Icon className={`${item.color} w-5 h-5 group-hover:scale-110 transition-transform`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{item.count}</span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 justify-center transition-all transform hover:scale-105"
          >
            <LogOut size={18} />
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {user.name || 'Utilisateur'}</h1>
              <p className="text-gray-600 mt-1">📊 Tableau de bord mis à jour en temps réel</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{new Date().toLocaleDateString('fr-FR')}</p>
              <p className="text-gray-600">Accès: {user.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500 ${animateCards ? 'opacity-100' : 'opacity-0'}`}>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-xl p-6 transition-all duration-500 hover:shadow-lg hover:scale-105 animate-slideInUp ${stat.bgColor}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`${stat.color}`}>{stat.icon}</span>
                  <span className="text-xs font-bold text-green-600">{stat.trend}</span>
                </div>
                <h3 className="text-gray-700 text-sm font-medium mb-1">{stat.label}</h3>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-200 animate-slideInUp">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="text-blue-600" />
                Activités Récentes
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => {
                  const ActivityIcon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-all hover:translate-x-2"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <ActivityIcon className="text-blue-600 w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white animate-slideInUp" style={{ animationDelay: '200ms' }}>
              <h2 className="text-xl font-bold mb-4">Actions Rapides</h2>
              <div className="space-y-3">
                <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105">
                  ➕ Nouveau Contrat
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105">
                  💰 Enregistrer Paiement
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105">
                  📄 Générer Rapport
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105">
                  📧 Envoyer Rappel
                </button>
              </div>
            </div>
          </div>

          {/* Performance Chart Area */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 animate-slideInUp" style={{ animationDelay: '300ms' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600" />
              Tendances Mensuelles
            </h2>
            <div className="h-64 bg-gradient-to-b from-blue-50 to-transparent rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="mx-auto mb-2 opacity-50" size={40} />
                <p>Graphiques disponibles dans la version premium</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
