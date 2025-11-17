/**
 * 🏢 Composant: Dashboard Immobilier Principal
 * Affiche KPIs, propriétés, contrats, paiements
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin, Euro, Users, FileText, AlertCircle, TrendingUp, Download, Filter } from 'lucide-react';

export const RealEstateDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ city: 'Conakry', type: '', status: 'all' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      const [propsRes, contractsRes, paymentsRes, statsRes] = await Promise.all([
        fetch(`/api/properties?city=${filters.city}&limit=10`),
        fetch(`/api/contracts?status=${filters.status}&limit=10`),
        fetch(`/api/payments?limit=10`),
        fetch(`/api/properties/stats`)
      ]);

      setProperties(await propsRes.json());
      setContracts(await contractsRes.json());
      setPayments(await paymentsRes.json());
      setStats(await statsRes.json());
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setLoading(false);
    }
  };

  const PropertyCard = ({ prop }) => (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{prop.title}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin size={14} /> {prop.district}, {prop.city}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          prop.status === 'available' ? 'bg-green-100 text-green-800' : 
          prop.status === 'rented' ? 'bg-blue-100 text-blue-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {prop.status === 'available' ? '✓ Disponible' : prop.status === 'rented' ? '🔒 Louée' : 'Autre'}
        </span>
      </div>
      
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Chambres</span>
          <p className="font-semibold">{prop.bedrooms}</p>
        </div>
        <div>
          <span className="text-gray-500">Surface</span>
          <p className="font-semibold">{prop.total_area} m²</p>
        </div>
        <div>
          <span className="text-gray-500">Prix</span>
          <p className="font-semibold text-green-600">{prop.rental_price?.toLocaleString('fr-FR') || 'N/A'} GNF</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600">
          Détails
        </button>
        <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200">
          Éditer
        </button>
      </div>
    </div>
  );

  const ContractCard = ({ contract }) => (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-800">{contract.property_title}</h4>
          <p className="text-sm text-gray-600">Ref: {contract.reference}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {contract.status === 'active' ? 'Actif' : 'Inactif'}
        </span>
      </div>
      
      <div className="text-sm mb-2">
        <p><strong>Locataire:</strong> {contract.tenant_name}</p>
        <p><strong>Loyer:</strong> {contract.monthly_rent?.toLocaleString('fr-FR')} GNF/mois</p>
        <p><strong>Durée:</strong> {new Date(contract.start_date).toLocaleDateString('fr-FR')} → {new Date(contract.end_date).toLocaleDateString('fr-FR')}</p>
      </div>

      {contract.arrears > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mt-2 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span className="text-sm text-red-700">Arriérés: {contract.arrears.toLocaleString('fr-FR')} GNF</span>
        </div>
      )}
    </div>
  );

  const KPICard = ({ icon: Icon, title, value, unit = '', color = 'blue' }) => (
    <div className={`bg-${color}-50 border-l-4 border-${color}-500 rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value} <span className="text-lg text-gray-500">{unit}</span></p>
        </div>
        <Icon size={32} className={`text-${color}-500 opacity-50`} />
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Agence Immobilière AKIG</h1>
        <p className="text-gray-600">Plateforme de gestion immobilière - Conakry, Guinée</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4 items-center">
          <Filter size={20} className="text-gray-600" />
          <select 
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Conakry">Conakry</option>
            <option value="Kindia">Kindia</option>
            <option value="Mamou">Mamou</option>
          </select>
          <select 
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="apartment">Appartement</option>
            <option value="house">Maison</option>
            <option value="villa">Villa</option>
          </select>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={MapPin} title="Propriétés" value={stats.total_properties || 0} unit="total" color="blue" />
        <KPICard icon={Users} title="Clients" value={stats.total_clients || 0} unit="actifs" color="green" />
        <KPICard icon={FileText} title="Contrats" value={stats.active_contracts || 0} unit="actifs" color="purple" />
        <KPICard icon={Euro} title="Revenus" value={(stats.total_monthly_rent || 0).toLocaleString('fr-FR')} unit="GNF/mois" color="yellow" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Propriétés */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Propriétés Disponibles</h2>
              <button className="text-blue-500 hover:text-blue-700 text-sm font-semibold">Voir tout</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.data?.slice(0, 4).map((prop) => (
                <PropertyCard key={prop.id} prop={prop} />
              ))}
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              Alertes & Actions
            </h2>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-700">🔴 Paiements en retard</p>
                <p className="text-xs text-red-600 mt-1">{stats.contracts_with_arrears || 0} contrats</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-yellow-700">🟡 Contrats expirant</p>
                <p className="text-xs text-yellow-600 mt-1">5 contrats dans 30 jours</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-700">🔵 Propriétés libres</p>
                <p className="text-xs text-blue-600 mt-1">{stats.available || 0} disponibles</p>
              </div>
            </div>

            <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center gap-2">
              <Download size={16} /> Générer Rapport
            </button>
          </div>
        </div>
      </div>

      {/* Contrats Section */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Contrats Actifs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.data?.slice(0, 6).map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealEstateDashboard;
