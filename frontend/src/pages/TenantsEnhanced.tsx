/**
 * 👥 TenantsEnhanced - Page de gestion des locataires avec annuaire
 */

import React, { useState } from 'react';
import { Users, Phone, Mail, MapPin, FileText, Search, Plus, Download } from 'lucide-react';
import DataTable from '../components/DataTable';

interface Tenant {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  property: string;
  leaseStart: string;
  leaseEnd: string;
  rent: number;
  status: 'active' | 'inactive' | 'pending';
}

export default function TenantsEnhanced() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const tenants: Tenant[] = [
    {
      id: 1,
      name: 'Ahmed Diallo',
      email: 'ahmed.diallo@email.com',
      phone: '+224 620 000 001',
      property: 'Immeuble Centre-Ville, Apt 401',
      leaseStart: '2023-01-15',
      leaseEnd: '2025-01-14',
      rent: 250000,
      status: 'active',
    },
    {
      id: 2,
      name: 'Fatoumata Sarr',
      email: 'fatoumata.sarr@email.com',
      phone: '+224 620 000 002',
      property: 'Villa Côte Nord',
      leaseStart: '2022-06-01',
      leaseEnd: '2025-05-31',
      rent: 500000,
      status: 'active',
    },
    {
      id: 3,
      name: 'Mamadou Ba',
      email: 'mamadou.ba@email.com',
      phone: '+224 620 000 003',
      property: 'Studio Presqu\'île',
      leaseStart: '2024-01-01',
      leaseEnd: '2024-12-31',
      rent: 150000,
      status: 'pending',
    },
    {
      id: 4,
      name: 'Aïssatou Ndiaye',
      email: 'aissatou.ndiaye@email.com',
      phone: '+224 620 000 004',
      property: 'Maison Kindia',
      leaseStart: '2023-03-15',
      leaseEnd: '2025-03-14',
      rent: 300000,
      status: 'active',
    },
    {
      id: 5,
      name: 'Ibrahim Camara',
      email: 'ibrahim.camara@email.com',
      phone: '+224 620 000 005',
      property: 'Immeuble Bambéto',
      leaseStart: '2024-01-10',
      leaseEnd: '2026-01-09',
      rent: 200000,
      status: 'active',
    },
    {
      id: 6,
      name: 'Oumou Kanoute',
      email: 'oumou.kanoute@email.com',
      phone: '+224 620 000 006',
      property: 'Résidence Dixinn',
      leaseStart: '2022-12-01',
      leaseEnd: '2024-11-30',
      rent: 280000,
      status: 'inactive',
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

  // Calculate statistics
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const totalRent = tenants.reduce((sum, t) => sum + t.rent, 0);
  const averageRent = Math.round(totalRent / tenants.length);

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const statusMatch = filterStatus === 'all' || tenant.status === filterStatus;
    const searchMatch =
      searchTerm === '' ||
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.includes(searchTerm);
    return statusMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Locataires</h1>
          <p className="text-gray-600">Annuaire et gestion des locataires</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Total locataires',
              value: tenants.length,
              icon: Users,
              color: 'from-blue-400 to-blue-600',
              delay: '0ms',
            },
            {
              title: 'Actifs',
              value: activeTenants,
              icon: Users,
              color: 'from-green-400 to-green-600',
              delay: '100ms',
            },
            {
              title: 'Loyer moyen',
              value: `${(averageRent / 1000000).toFixed(2)}M FG`,
              icon: FileText,
              color: 'from-purple-400 to-purple-600',
              delay: '200ms',
            },
            {
              title: 'Total reçus',
              value: `${(totalRent / 1000000).toFixed(2)}M FG`,
              icon: FileText,
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

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-slideInUp" style={{ animationDelay: '400ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
                <Search size={20} className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            {/* Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="pending">En attente</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105">
                <Plus size={18} />
                Ajouter
              </button>
              <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                <Download size={18} />
                Exporter
              </button>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slideInUp" style={{ animationDelay: '500ms' }}>
          <DataTable<Tenant>
            data={filteredTenants}
            columns={[
              {
                key: 'name',
                label: 'Nom',
                render: (value) => (
                  <span className="font-semibold text-gray-900">{value}</span>
                ),
              },
              {
                key: 'email',
                label: 'Email',
                render: (value) => (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail size={16} />
                    <a href={`mailto:${value}`} className="hover:underline text-blue-600">
                      {value}
                    </a>
                  </div>
                ),
              },
              {
                key: 'phone',
                label: 'Téléphone',
                render: (value) => (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={16} />
                    <a href={`tel:${value}`} className="hover:underline text-blue-600">
                      {value}
                    </a>
                  </div>
                ),
              },
              {
                key: 'property',
                label: 'Propriété',
                render: (value) => (
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <MapPin size={16} />
                    {value}
                  </div>
                ),
              },
              {
                key: 'rent',
                label: 'Loyer',
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
            onRowClick={(tenant) => console.log('Clicked tenant:', tenant)}
          />
        </div>

        {/* Quick Contact Cards */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contacts rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.slice(0, 4).map((tenant, i) => (
              <div
                key={tenant.id}
                className="bg-white rounded-lg shadow hover:shadow-lg p-4 animate-slideInUp"
                style={{ animationDelay: `${600 + i * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{tenant.name}</h3>
                    <p className="text-sm text-gray-600">{tenant.property}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-800' : 
                    tenant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {statusLabels[tenant.status]}
                  </span>
                </div>
                <div className="space-y-2 border-t pt-3">
                  <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Mail size={14} /> {tenant.email}
                  </a>
                  <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Phone size={14} /> {tenant.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
