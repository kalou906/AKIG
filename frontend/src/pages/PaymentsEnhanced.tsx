/**
 * 💰 PaymentsEnhanced - Page de gestion des paiements avec DataTable
 */

import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Filter, Download } from 'lucide-react';
import DataTable from '../components/DataTable';

interface Payment {
  id: string | number;
  tenant: string;
  property: string;
  amount: number;
  date: string;
  method: string;
  status: 'paid' | 'pending' | 'failed';
}

export default function PaymentsEnhanced() {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample payment data
  const payments: Payment[] = [
    {
      id: 1,
      tenant: 'Ahmed Diallo',
      property: 'Immeuble Centre-Ville, Apt 401',
      amount: 250000,
      date: '2024-01-15',
      method: 'Virement bancaire',
      status: 'paid',
    },
    {
      id: 2,
      tenant: 'Fatoumata Sarr',
      property: 'Villa Côte Nord',
      amount: 500000,
      date: '2024-01-14',
      method: 'Espèces',
      status: 'paid',
    },
    {
      id: 3,
      tenant: 'Mamadou Ba',
      property: 'Studio Presqu\u0027île',
      amount: 150000,
      date: '2024-01-10',
      method: 'Chèque',
      status: 'pending',
    },
    {
      id: 4,
      tenant: 'Aïssatou Ndiaye',
      property: 'Maison Kindia',
      amount: 300000,
      date: '2024-01-08',
      method: 'Mobile Money',
      status: 'paid',
    },
    {
      id: 5,
      tenant: 'Ibrahim Camara',
      property: 'Immeuble Bambéto',
      amount: 200000,
      date: '2024-01-05',
      method: 'Virement bancaire',
      status: 'failed',
    },
  ];

  // Calculate statistics
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'paid').length;

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 border-green-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusLabels: Record<string, string> = {
    paid: 'Payé',
    pending: 'En attente',
    failed: 'Échoué',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Paiements</h1>
          <p className="text-gray-600">Gestion et suivi des paiements des locataires</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Total reçu',
              value: `${(paidAmount / 1000000).toFixed(2)}M FG`,
              icon: DollarSign,
              color: 'from-green-400 to-green-600',
              delay: '0ms',
            },
            {
              title: 'Nombre payé',
              value: paidCount,
              icon: TrendingUp,
              color: 'from-blue-400 to-blue-600',
              delay: '100ms',
            },
            {
              title: 'En attente',
              value: `${(pendingAmount / 1000000).toFixed(2)}M FG`,
              icon: Calendar,
              color: 'from-yellow-400 to-yellow-600',
              delay: '200ms',
            },
            {
              title: 'Total',
              value: `${(totalPayments / 1000000).toFixed(2)}M FG`,
              icon: DollarSign,
              color: 'from-purple-400 to-purple-600',
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

        {/* Filter and Action Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-slideInUp" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par locataire, propriété..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
                <Filter size={20} className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105">
              <Download size={18} />
              Exporter
            </button>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slideInUp" style={{ animationDelay: '500ms' }}>
          <DataTable<Payment>
            data={payments}
            columns={[
              {
                key: 'tenant',
                label: 'Locataire',
                render: (value) => (
                  <span className="font-medium text-gray-900">{value}</span>
                ),
              },
              {
                key: 'property',
                label: 'Propriété',
                render: (value) => (
                  <span className="text-gray-700 text-sm">{value}</span>
                ),
              },
              {
                key: 'amount',
                label: 'Montant',
                render: (value) => (
                  <span className="font-semibold text-green-600">
                    {(value / 1000000).toFixed(2)}M FG
                  </span>
                ),
              },
              {
                key: 'date',
                label: 'Date',
                render: (value) => (
                  <span className="text-gray-600 text-sm">{value}</span>
                ),
              },
              {
                key: 'method',
                label: 'Méthode',
                render: (value) => (
                  <span className="text-gray-700 text-sm">{value}</span>
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
            onRowClick={(payment) => console.log('Clicked payment:', payment)}
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 animate-slideInUp" style={{ animationDelay: '600ms' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activité récente</h2>
          <div className="space-y-3">
            {payments.slice(0, 3).map((payment, i) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ animation: `slideInUp 0.5s ease-out ${700 + i * 100}ms backwards` }}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{payment.tenant}</p>
                  <p className="text-sm text-gray-600">{payment.property}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{(payment.amount / 1000000).toFixed(2)}M FG</p>
                  <p className="text-xs text-gray-500">{payment.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
