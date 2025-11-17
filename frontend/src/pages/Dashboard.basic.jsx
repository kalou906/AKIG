/**
 * Dashboard AKIG - Version Complète et Moderne
 * Combine interface simple + données dynamiques + graphiques
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  Building2,
  Users,
  BarChart3,
  Bell,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    contracts: { value: 0, trend: 0 },
    payments_pending: { value: 0, trend: 0 },
    properties: { value: 0, trend: 0 },
    revenue: { value: 0, trend: 0 },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const user = JSON.parse(localStorage.getItem('user') || '{}');    // Charger les données du dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Charger les statistiques depuis l'API
      const [contractsRes, paymentsRes, propertiesRes] = await Promise.all([
        fetch('http://localhost:4000/api/contracts', { headers }).catch(() => null),
        fetch('http://localhost:4000/api/payments', { headers }).catch(() => null),
        fetch('http://localhost:4000/api/properties', { headers }).catch(() => null),
      ]);

      // Traiter les réponses
      if (contractsRes?.ok) {
        const data = await contractsRes.json();
        setStats(prev => ({
          ...prev,
          contracts: {
            value: data.length || 0,
            trend: 5.2
          }
        }));
      }

      if (paymentsRes?.ok) {
        const data = await paymentsRes.json();
        const pending = data.filter(p => p.status === 'PENDING').length;
        setStats(prev => ({
          ...prev,
          payments_pending: {
            value: pending || 0,
            trend: -2.3
          }
        }));
      }

      if (propertiesRes?.ok) {
        const data = await propertiesRes.json();
        setStats(prev => ({
          ...prev,
          properties: {
            value: data.length || 0,
            trend: 3.1
          },
          revenue: {
            value: data.reduce((sum, p) => sum + (p.rent_amount || 0), 0),
            trend: 8.4
          }
        }));
      }

      // Simuler des activités récentes (à remplacer par vraies données API)
      setRecentActivities([
        { id: 1, type: 'payment', message: 'Paiement reçu - Locataire A', time: 'Il y a 2h', icon: CheckCircle, color: 'text-green-600' },
        { id: 2, type: 'contract', message: 'Nouveau contrat signé - Propriété B', time: 'Il y a 5h', icon: FileText, color: 'text-blue-600' },
        { id: 3, type: 'alert', message: 'Paiement en retard - Locataire C', time: 'Il y a 1j', icon: AlertCircle, color: 'text-red-600' },
      ]);

      // Simuler des alertes (à remplacer par vraies données API)
      setAlerts([
        { id: 1, message: '3 paiements en attente ce mois', severity: 'warning' },
        { id: 2, message: '2 contrats expirent dans 30 jours', severity: 'info' },
      ]);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'contracts',
      label: 'Contrats',
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      description: 'Gérer vos contrats'
    },
    {
      id: 'payments',
      label: 'Paiements',
      icon: CreditCard,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      description: 'Suivre les paiements'
    },
    {
      id: 'properties',
      label: 'Propriétés',
      icon: Building2,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      description: 'Gérer vos biens'
    },
    {
      id: 'tenants',
      label: 'Locataires',
      icon: Users,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      description: 'Gérer les locataires'
    },
  ];

  const statsCards = [
    {
      label: 'Contrats Actifs',
      value: stats.contracts.value,
      trend: stats.contracts.trend,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Paiements En Attente',
      value: stats.payments_pending.value,
      trend: stats.payments_pending.trend,
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      label: 'Propriétés',
      value: stats.properties.value,
      trend: stats.properties.trend,
      icon: Building2,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Revenu Mensuel',
      value: `${(stats.revenue.value / 1000000).toFixed(1)}M`,
      trend: stats.revenue.trend,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue, {user.name || 'Utilisateur'} 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Voici un aperçu de votre activité aujourd'hui
            </p>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 size={18} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border flex items-center gap-3 ${alert.severity === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200'
                }`}
            >
              <Bell className={alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'} size={20} />
              <span className="text-sm font-medium text-gray-800">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend >= 0;

          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} border ${stat.bgColor.replace('bg-', 'border-')} rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.iconBg} p-3 rounded-lg`}>
                  <Icon className={stat.iconColor} size={24} />
                </div>
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="text-green-600" size={16} />
                  ) : (
                    <TrendingDown className="text-red-600" size={16} />
                  )}
                  <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accès Rapides */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Accès Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/${item.id}`)}
                  className={`${item.bgColor} border ${item.borderColor} rounded-xl p-6 hover:shadow-lg cursor-pointer transition-all transform hover:-translate-y-1`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${item.bgColor.replace('50', '100')} p-3 rounded-lg`}>
                      <Icon className={item.iconColor} size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.label}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      Accéder →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activités Récentes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activités Récentes</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {recentActivities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Clock size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentActivities.map(activity => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${activity.color.replace('text-', 'bg-').replace('600', '50')}`}>
                          <Icon className={activity.color} size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
