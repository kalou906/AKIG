import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, Filter, Download, Plus, Edit2, Trash2, Calendar, Tag, Home } from 'lucide-react';

interface Charge {
  id: string;
  title: string;
  category: 'maintenance' | 'utilities' | 'taxes' | 'insurance' | 'management' | 'marketing' | 'other';
  amount: number;
  date: string;
  property: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

interface CategoryStats {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  maintenance: '#3B82F6',
  utilities: '#10B981',
  taxes: '#F59E0B',
  insurance: '#EF4444',
  management: '#8B5CF6',
  marketing: '#EC4899',
  other: '#6B7280',
};

const CATEGORY_LABELS: { [key: string]: string } = {
  maintenance: 'Maintenance',
  utilities: 'Utilities',
  taxes: 'Taxes',
  insurance: 'Insurance',
  management: 'Management',
  marketing: 'Marketing',
  other: 'Other',
};

const sampleCharges: Charge[] = [
  {
    id: '1',
    title: 'Plumbing Repair',
    category: 'maintenance',
    amount: 450,
    date: '2024-01-15',
    property: 'Luxury Apartment - Paris',
    status: 'paid',
    description: 'Fixed broken pipe in master bathroom',
  },
  {
    id: '2',
    title: 'Monthly Electric Bill',
    category: 'utilities',
    amount: 180,
    date: '2024-01-10',
    property: 'Villa - Côte d\'Azur',
    status: 'paid',
    description: 'January electricity consumption',
  },
  {
    id: '3',
    title: 'Property Tax Q1',
    category: 'taxes',
    amount: 2400,
    date: '2024-01-20',
    property: 'Commercial Space - Lyon',
    status: 'pending',
    description: 'First quarter property tax payment',
  },
  {
    id: '4',
    title: 'Homeowners Insurance',
    category: 'insurance',
    amount: 1200,
    date: '2024-01-08',
    property: 'Luxury Apartment - Paris',
    status: 'paid',
    description: 'Annual insurance premium',
  },
  {
    id: '5',
    title: 'Property Management Fee',
    category: 'management',
    amount: 500,
    date: '2024-01-05',
    property: 'Vacation Rental - Bordeaux',
    status: 'overdue',
    description: 'Monthly management service fee',
  },
  {
    id: '6',
    title: 'Google Ads Campaign',
    category: 'marketing',
    amount: 350,
    date: '2024-01-12',
    property: 'Vacation Rental - Bordeaux',
    status: 'pending',
    description: 'January advertising budget',
  },
  {
    id: '7',
    title: 'HVAC Maintenance',
    category: 'maintenance',
    amount: 300,
    date: '2024-01-18',
    property: 'Villa - Côte d\'Azur',
    status: 'paid',
    description: 'Annual heating system inspection',
  },
  {
    id: '8',
    title: 'Water Bill',
    category: 'utilities',
    amount: 95,
    date: '2024-01-14',
    property: 'Commercial Space - Lyon',
    status: 'paid',
    description: 'January water usage charge',
  },
];

export default function ChargesEnhanced() {
  const [charges] = useState<Charge[]>(sampleCharges);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter charges
  const filteredCharges = useMemo(() => {
    return charges.filter((charge) => {
      const matchesCategory = selectedCategory === 'all' || charge.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || charge.status === selectedStatus;
      const matchesSearch =
        charge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        charge.property.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [charges, selectedCategory, selectedStatus, searchTerm]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    charges.forEach((charge) => {
      stats[charge.category] = (stats[charge.category] || 0) + charge.amount;
    });

    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return Object.entries(stats).map(([category, amount]) => ({
      name: CATEGORY_LABELS[category],
      value: amount,
      percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
      color: CATEGORY_COLORS[category],
    }));
  }, [charges]);

  // Calculate monthly trend
  const monthlyTrend = useMemo(() => {
    const months: { [key: string]: number } = {};
    charges.forEach((charge) => {
      const month = charge.date.substring(0, 7);
      months[month] = (months[month] || 0) + charge.amount;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total,
      }));
  }, [charges]);

  // Calculate metrics
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
  const paidCharges = charges.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCharges = charges.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const overdueCharges = charges.filter((c) => c.status === 'overdue').reduce((sum, c) => sum + c.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'overdue' ? '⚠️' : status === 'paid' ? '✅' : '⏳';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={32} className="text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Gestion des Charges</h1>
          </div>
          <p className="text-gray-600">Track and manage all property expenses efficiently</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Charges',
              value: `€${totalCharges.toLocaleString()}`,
              icon: DollarSign,
              bg: 'from-blue-500 to-blue-600',
              delay: 0,
            },
            {
              label: 'Paid',
              value: `€${paidCharges.toLocaleString()}`,
              icon: TrendingUp,
              bg: 'from-green-500 to-green-600',
              delay: 100,
            },
            {
              label: 'Pending',
              value: `€${pendingCharges.toLocaleString()}`,
              icon: Calendar,
              bg: 'from-yellow-500 to-yellow-600',
              delay: 200,
            },
            {
              label: 'Overdue',
              value: `€${overdueCharges.toLocaleString()}`,
              icon: AlertCircle,
              bg: 'from-red-500 to-red-600',
              delay: 300,
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className={`bg-gradient-to-br ${stat.bg} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-slideInUp`}
                style={{ animationDelay: `${stat.delay}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <Icon size={24} className="text-white/60" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 animate-slideInLeft">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Tag size={20} className="text-blue-600" />
              Distribution par Catégorie
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryStats} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.percentage}%`} dataKey="value" outerRadius={100}>
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6 animate-slideInRight">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              Tendance Mensuelle
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-slideInUp">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Détail par Catégorie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryStats.map((stat, i) => (
              <div
                key={i}
                className="p-4 border-2 rounded-lg animate-slideInUp"
                style={{ borderColor: stat.color, animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{stat.name}</span>
                  <span className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.percentage}%
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">€{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-slideInUp" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
              <input
                type="text"
                placeholder="Search by title or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download size={18} />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus size={18} />
                Add Charge
              </button>
            </div>
          </div>
        </div>

        {/* Charges Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-slideInUp" style={{ animationDelay: '200ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Title</th>
                  <th className="px-6 py-4 text-left font-semibold">Property</th>
                  <th className="px-6 py-4 text-left font-semibold">Category</th>
                  <th className="px-6 py-4 text-right font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCharges.length > 0 ? (
                  filteredCharges.map((charge, i) => (
                    <tr key={charge.id} className="hover:bg-gray-50 transition-colors animate-slideInUp" style={{ animationDelay: `${i * 50}ms` }}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{charge.title}</p>
                          <p className="text-sm text-gray-600">{charge.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Home size={16} className="text-gray-400" />
                          <span className="text-gray-700">{charge.property}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: CATEGORY_COLORS[charge.category] + '20', color: CATEGORY_COLORS[charge.category] }}>
                          {CATEGORY_LABELS[charge.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">€{charge.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-700">{new Date(charge.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 ${getStatusColor(charge.status)}`}>
                          {getStatusIcon(charge.status)}
                          {charge.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={16} className="text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No charges found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
