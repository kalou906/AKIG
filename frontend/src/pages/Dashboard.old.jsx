/**
 * Dashboard - Version Fonctionnelle
 * SIMPLE et INTERACTIVE - pas de dépendances complexes/APIs manquantes
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, FileText, CreditCard, Building2, Users, BarChart3, Bell } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

  const stats = [
    { label: 'Contrats Actifs', value: '12', trend: '+2.5%', color: 'bg-blue-50 border-blue-200' },
    { label: 'Paiements En Attente', value: '3', trend: '-1.2%', color: 'bg-red-50 border-red-200' },
    { label: 'Propriétés', value: '8', trend: '+0.8%', color: 'bg-green-50 border-green-200' },
    { label: 'Revenu Mensuel', value: '2.4M', trend: '+5.3%', color: 'bg-yellow-50 border-yellow-200' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Header Sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
            {sidebarOpen ? (
              <>
                <img 
                  src="/assets/logos/logo.png" 
                  alt="Logo AKIG" 
                  className="w-8 h-8 object-contain"
                />
                <span className="font-bold text-lg">AKIG</span>
              </>
            ) : (
              <img 
                src="/assets/logos/logo.png" 
                alt="Logo AKIG" 
                className="w-8 h-8 object-contain"
              />
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-blue-700 rounded">
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
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-700 transition-colors text-left group"
                title={item.label}
              >
                <Icon size={20} className={item.color} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <span className="bg-blue-700 text-xs px-2 py-1 rounded-full text-white">{item.count}</span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 flex items-center gap-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white text-sm font-medium"
          >
            <LogOut size={18} />
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0) || 'D'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Bienvenue, {user.name || 'Utilisateur'}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="text-gray-600 mt-2">Aperçu de vos propriétés et finances</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className={`border ${stat.color} rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow`}>
                <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                  <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/${item.id}`)}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 cursor-pointer transition-all transform hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 ${item.color.replace('text-', 'bg-')} bg-opacity-10 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={item.color} size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.label}</h3>
                  <p className="text-sm text-gray-600 mb-4">Gérer vos {item.label.toLowerCase()}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${item.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Accéder →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
