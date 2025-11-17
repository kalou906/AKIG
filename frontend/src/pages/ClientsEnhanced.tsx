/**
 * 🤝 ClientsEnhanced - Page de gestion des clients avec recherche avancée
 */

import React, { useState } from 'react';
import { Users, Search, Filter, MapPin, Mail, Phone, Briefcase, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import DataTable from '../components/DataTable';

interface Client {
  id: string | number;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'inactive' | 'pending';
  projects: number;
  revenue: number;
  joinDate: string;
}

export default function ClientsEnhanced() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const clients: Client[] = [
    {
      id: 1,
      name: 'Société Immobilière Alpha',
      company: 'Immobilière',
      email: 'contact@alpha-immobilier.com',
      phone: '+224 620 000 001',
      location: 'Conakry, Guinée',
      status: 'active',
      projects: 5,
      revenue: 1250000,
      joinDate: '2023-03-15',
    },
    {
      id: 2,
      name: 'Investissements Bêta SA',
      company: 'Fonds d\'Investissement',
      email: 'admin@beta-invest.com',
      phone: '+224 620 000 002',
      location: 'Dakar, Sénégal',
      status: 'active',
      projects: 8,
      revenue: 2450000,
      joinDate: '2023-06-20',
    },
    {
      id: 3,
      name: 'Gamma Properties',
      company: 'Gestion Immobilière',
      email: 'info@gamma-prop.com',
      phone: '+224 620 000 003',
      location: 'Abidjan, Côte d\'Ivoire',
      status: 'pending',
      projects: 2,
      revenue: 580000,
      joinDate: '2024-01-10',
    },
    {
      id: 4,
      name: 'Delta Développement',
      company: 'Promoteur',
      email: 'dev@delta-dev.com',
      phone: '+224 620 000 004',
      location: 'Kinshasa, RDC',
      status: 'active',
      projects: 6,
      revenue: 1890000,
      joinDate: '2023-09-05',
    },
    {
      id: 5,
      name: 'Épsilon Capital',
      company: 'Capital-Risque',
      email: 'team@epsilon-cap.com',
      phone: '+224 620 000 005',
      location: 'Lagos, Nigeria',
      status: 'inactive',
      projects: 0,
      revenue: 0,
      joinDate: '2022-11-30',
    },
    {
      id: 6,
      name: 'Zéta Consulting',
      company: 'Conseil Immobilier',
      email: 'hello@zeta-consult.com',
      phone: '+224 620 000 006',
      location: 'Casablanca, Maroc',
      status: 'active',
      projects: 3,
      revenue: 920000,
      joinDate: '2024-02-14',
    },
  ];

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  const statusLabels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    pending: 'En attente',
  };

  // Calculate stats
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);
  const totalProjects = clients.reduce((sum, c) => sum + c.projects, 0);

  // Filter clients
  const filteredClients = clients.filter(client => {
    const statusMatch = filterStatus === 'all' || client.status === filterStatus;
    const searchMatch =
      searchTerm === '' ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Users size={36} className="text-purple-600" />
            Clients
          </h1>
          <p className="text-gray-600">Gestion du portefeuille clients et partenaires</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Clients actifs',
              value: activeClients,
              icon: Users,
              color: 'from-green-400 to-green-600',
              delay: '0ms',
            },
            {
              title: 'Total clients',
              value: clients.length,
              icon: Briefcase,
              color: 'from-blue-400 to-blue-600',
              delay: '100ms',
            },
            {
              title: 'Projets',
              value: totalProjects,
              icon: TrendingUp,
              color: 'from-purple-400 to-purple-600',
              delay: '200ms',
            },
            {
              title: 'Revenu total',
              value: `${(totalRevenue / 1000000).toFixed(2)}M FG`,
              icon: ArrowUpRight,
              color: 'from-indigo-400 to-indigo-600',
              delay: '300ms',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${stat.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-slideInUp`}
              style={{ animationDelay: stat.delay }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon size={40} className="opacity-75" />
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-slideInUp" style={{ animationDelay: '400ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par nom, entreprise, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
                <Search size={20} className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="pending">En attente</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slideInUp" style={{ animationDelay: '500ms' }}>
          <DataTable<Client>
            data={filteredClients}
            columns={[
              {
                key: 'name',
                label: 'Nom',
                render: (value) => (
                  <div>
                    <p className="font-semibold text-gray-900">{value}</p>
                  </div>
                ),
              },
              {
                key: 'company',
                label: 'Entreprise',
                render: (value) => (
                  <span className="text-gray-700 text-sm font-medium">{value}</span>
                ),
              },
              {
                key: 'email',
                label: 'Email',
                render: (value) => (
                  <a href={`mailto:${value}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Mail size={14} />
                    {value}
                  </a>
                ),
              },
              {
                key: 'location',
                label: 'Localisation',
                render: (value) => (
                  <span className="text-gray-700 text-sm flex items-center gap-1">
                    <MapPin size={14} />
                    {value}
                  </span>
                ),
              },
              {
                key: 'projects',
                label: 'Projets',
                render: (value) => (
                  <span className="font-semibold text-purple-600">{value}</span>
                ),
              },
              {
                key: 'revenue',
                label: 'Revenu',
                render: (value) => (
                  <span className="font-semibold text-green-600">
                    {(value / 1000000).toFixed(2)}M FG
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Statut',
                render: (value: string) => (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border-2 ${statusColors[value] || ''}`}>
                    {statusLabels[value] || value}
                  </span>
                ),
              },
            ]}
            striped
            onRowClick={(client) => console.log('Clicked client:', client)}
          />
        </div>

        {/* Client Cards */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Clients</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clients
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 3)
              .map((client, i) => (
                <div
                  key={client.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg p-6 transform hover:scale-105 transition-all animate-slideInUp border-l-4 border-purple-600"
                  style={{ animationDelay: `${600 + i * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{client.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{client.company}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' : 
                      client.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabels[client.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <p className="flex items-center gap-2 text-gray-700">
                      <Mail size={14} className="text-purple-600" />
                      {client.email}
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <Phone size={14} className="text-purple-600" />
                      {client.phone}
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <MapPin size={14} className="text-purple-600" />
                      {client.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Projets</p>
                      <p className="text-lg font-bold text-purple-600">{client.projects}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Revenu</p>
                      <p className="text-lg font-bold text-green-600">{(client.revenue / 1000000).toFixed(2)}M</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
