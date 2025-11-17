/**
 * 🏠 PropertiesEnhanced - Page de gestion des propriétés avec filtres avancés
 */

import React, { useState } from 'react';
import { Home, MapPin, Users, AlertCircle, Plus, Filter, Grid, List } from 'lucide-react';

interface Property {
  id: string | number;
  name: string;
  location: string;
  type: 'appartement' | 'maison' | 'studio' | 'villa';
  units: number;
  occupancy: number;
  price: number;
  status: 'active' | 'maintenance' | 'vacant';
}

export default function PropertiesEnhanced() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const properties: Property[] = [
    {
      id: 1,
      name: 'Immeuble Centre-Ville',
      location: 'Centre-Ville, Conakry',
      type: 'appartement',
      units: 12,
      occupancy: 10,
      price: 250000,
      status: 'active',
    },
    {
      id: 2,
      name: 'Villa Côte Nord',
      location: 'Côte Nord, Conakry',
      type: 'villa',
      units: 1,
      occupancy: 1,
      price: 500000,
      status: 'active',
    },
    {
      id: 3,
      name: 'Studio Presqu\'île',
      location: 'Presqu\'île, Conakry',
      type: 'studio',
      units: 8,
      occupancy: 5,
      price: 150000,
      status: 'active',
    },
    {
      id: 4,
      name: 'Maison Kindia',
      location: 'Kindia',
      type: 'maison',
      units: 4,
      occupancy: 2,
      price: 300000,
      status: 'maintenance',
    },
    {
      id: 5,
      name: 'Immeuble Bambéto',
      location: 'Bambéto, Conakry',
      type: 'appartement',
      units: 6,
      occupancy: 6,
      price: 200000,
      status: 'active',
    },
    {
      id: 6,
      name: 'Résidence Dixinn',
      location: 'Dixinn, Conakry',
      type: 'appartement',
      units: 15,
      occupancy: 12,
      price: 280000,
      status: 'active',
    },
  ];

  const typeEmojis: Record<string, string> = {
    appartement: '🏢',
    maison: '🏠',
    studio: '🏠',
    villa: '🏛️',
  };

  const typeLabels: Record<string, string> = {
    appartement: 'Appartement',
    maison: 'Maison',
    studio: 'Studio',
    villa: 'Villa',
  };

  const statusColors: Record<string, string> = {
    active: 'from-green-400 to-green-600',
    maintenance: 'from-yellow-400 to-yellow-600',
    vacant: 'from-red-400 to-red-600',
  };

  const statusLabels: Record<string, string> = {
    active: 'Actif',
    maintenance: 'Maintenance',
    vacant: 'Vacant',
  };

  // Filter properties
  const filteredProperties = properties.filter(prop => {
    const typeMatch = filterType === 'all' || prop.type === filterType;
    const searchMatch =
      searchTerm === '' ||
      prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  // Calculate statistics
  const totalUnits = properties.reduce((sum, p) => sum + p.units, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupancy, 0);
  const occupancyRate = ((occupiedUnits / totalUnits) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Propriétés</h1>
          <p className="text-gray-600">Gestion du portefeuille immobilier</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Total propriétés',
              value: properties.length,
              icon: Home,
              color: 'from-blue-400 to-blue-600',
              delay: '0ms',
            },
            {
              title: 'Unités totales',
              value: totalUnits,
              icon: Grid,
              color: 'from-green-400 to-green-600',
              delay: '100ms',
            },
            {
              title: 'Taux d\'occupation',
              value: `${occupancyRate}%`,
              icon: Users,
              color: 'from-purple-400 to-purple-600',
              delay: '200ms',
            },
            {
              title: 'Actifs',
              value: properties.filter(p => p.status === 'active').length,
              icon: AlertCircle,
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
              <input
                type="text"
                placeholder="Rechercher par nom ou localisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">Tous les types</option>
                <option value="appartement">Appartements</option>
                <option value="maison">Maisons</option>
                <option value="studio">Studios</option>
                <option value="villa">Villas</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid size={20} className="mx-auto" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={20} className="mx-auto" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property, i) => (
              <div
                key={property.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all overflow-hidden animate-slideInUp"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${statusColors[property.status]} p-6 text-white`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-4xl">{typeEmojis[property.type]}</span>
                    <span className="text-xs font-bold bg-white bg-opacity-30 px-3 py-1 rounded-full">
                      {statusLabels[property.status]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{property.name}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Location */}
                  <div className="flex items-center gap-2 mb-4 text-gray-600">
                    <MapPin size={18} />
                    <span className="text-sm">{property.location}</span>
                  </div>

                  {/* Type */}
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-xs text-gray-500 uppercase">Type de propriété</p>
                    <p className="font-semibold text-gray-900">{typeLabels[property.type]}</p>
                  </div>

                  {/* Units */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Unités</p>
                      <p className="text-2xl font-bold text-gray-900">{property.units}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Occupées</p>
                      <p className="text-2xl font-bold text-green-600">{property.occupancy}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-500 uppercase">Loyer mensuel</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(property.price / 1000000).toFixed(2)}M FG
                    </p>
                  </div>

                  {/* Actions */}
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all transform hover:scale-105">
                    Voir les détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredProperties.map((property, i) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 animate-slideInUp flex items-center justify-between"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{typeEmojis[property.type]}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{property.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin size={14} />
                        {property.location}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-8 items-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Unités</p>
                    <p className="font-bold text-gray-900">{property.units}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Occupées</p>
                    <p className="font-bold text-green-600">{property.occupancy}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Prix</p>
                    <p className="font-bold text-gray-900">{(property.price / 1000000).toFixed(2)}M</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    property.status === 'active' ? 'bg-green-500' : property.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {statusLabels[property.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
