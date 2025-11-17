/**
 * 🇬🇳 Page: Propriétés Guinée - Complète avec secteurs et devise GNF
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Bed, Bath, Maximize2, Heart, Share2, Phone, Mail, Filter } from 'lucide-react';
import PropertiesMap from '../components/PropertiesMap';
import SectorsComponent from '../components/SectorsComponent';
import { useGuineaCurrency, useGuineaSectors } from '../hooks/useGuinea';

export const GuineaPropertiesPage = () => {
  const { formatGnf, convertUsdToGnf } = useGuineaCurrency();
  const { sectors, getSectorById } = useGuineaSectors();

  const [properties, setProperties] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [showSectorFilter, setShowSectorFilter] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    bedrooms: '',
    minPrice: 0,
    maxPrice: null,
    sector: null
  });

  // Données de propriétés example (en prod, récupérer de l'API)
  const demoProperties = [
    {
      id: 1,
      title: 'Villa luxe Matam',
      description: 'Superbe villa avec piscine',
      sector: 'matam',
      type: 'villa',
      bedrooms: 4,
      bathrooms: 3,
      sqm: 500,
      priceUsd: 100000,
      image: '🏰',
      amenities: ['Piscine', 'Jardin', 'Garage', 'Sécurité']
    },
    {
      id: 2,
      title: 'Appartement Kaloum centre',
      description: 'T3 spacieux centre-ville',
      sector: 'kaloum',
      type: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      sqm: 120,
      priceUsd: 50000,
      image: '🏢',
      amenities: ['Ascenseur', 'Climatisation', 'Balcon']
    },
    {
      id: 3,
      title: 'T2 Dixinn résidentiel',
      description: 'Logement moderne proximité université',
      sector: 'dixinn',
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 1,
      sqm: 80,
      priceUsd: 20000,
      image: '🏘️',
      amenities: ['Cuisine', 'Balcon', 'Internet']
    },
    {
      id: 4,
      title: 'Maison familiale Ratoma',
      description: 'Belle demeure quartier populaire',
      sector: 'ratoma',
      type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      sqm: 200,
      priceUsd: 15000,
      image: '🏪',
      amenities: ['Cour', 'Cuisine', 'Sanitaires']
    }
  ];

  // Filtrer propriétés
  useEffect(() => {
    let filtered = demoProperties;

    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    if (filters.sector) {
      filtered = filtered.filter(p => p.sector === filters.sector);
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(p => p.bedrooms === parseInt(filters.bedrooms));
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.priceUsd >= filters.minPrice);
    }

    setProperties(filtered);
  }, [filters]);

  const handleSectorSelect = (sector) => {
    setSelectedSector(sector);
    setFilters({ ...filters, sector: sector.id });
  };

  const toggleFavorite = (id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">🇬🇳 Propriétés Guinée</h1>
          <p className="text-blue-100">
            {properties.length} propriétés disponibles • Prix en GNF (Franc Guinéen)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Carte des propriétés */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h3 className="font-bold text-lg mb-3">🗺️ Carte de Conakry</h3>
            <PropertiesMap
              height={360}
              markers={properties.map(p => ({
                // Fausse géoloc par secteur pour la démo
                ...(p.sector === 'kaloum' ? { lng: -13.677, lat: 9.509 } :
                  p.sector === 'dixinn' ? { lng: -13.635, lat: 9.546 } :
                    p.sector === 'matam' ? { lng: -13.640, lat: 9.536 } :
                      { lng: -13.620, lat: 9.640 }),
                popup: `<strong>${p.title}</strong><br/>${formatGnf(Math.round(p.priceUsd * 8650))}`
              }))}
            />
            {!window.mapboxgl && (
              <p className="text-xs text-gray-500 mt-2">Astuce: ajoutez VITE_MAPBOX_TOKEN et Internet pour activer la carte.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filtres */}
          <div className="lg:col-span-1 space-y-6">
            {/* Toggle secteurs */}
            <button
              onClick={() => setShowSectorFilter(!showSectorFilter)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <Filter size={20} />
              {showSectorFilter ? 'Masquer' : 'Afficher'} Secteurs
            </button>

            {/* Secteurs */}
            {showSectorFilter && sectors.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 space-y-2">
                <h3 className="font-bold text-lg mb-3">📍 Secteurs Conakry</h3>
                {sectors.map(sector => (
                  <button
                    key={sector.id}
                    onClick={() => handleSectorSelect(sector)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedSector?.id === sector.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{sector.icon} {sector.name}</span>
                      <span className="text-xs font-semibold">{sector.priceLevel}</span>
                    </div>
                  </button>
                ))}
                {selectedSector && (
                  <button
                    onClick={() => {
                      setSelectedSector(null);
                      setFilters({ ...filters, sector: null });
                    }}
                    className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    ✕ Réinitialiser
                  </button>
                )}
              </div>
            )}

            {/* Filtres additionnels */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
              <h3 className="font-bold text-lg">🔍 Filtres</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={e => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="apartment">Appartement</option>
                  <option value="house">Maison</option>
                  <option value="villa">Villa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chambres</label>
                <select
                  value={filters.bedrooms}
                  onChange={e => setFilters({ ...filters, bedrooms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes</option>
                  <option value="1">1 chambre</option>
                  <option value="2">2 chambres</option>
                  <option value="3">3 chambres</option>
                  <option value="4">4+ chambres</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prix min (USD)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={e => setFilters({ ...filters, minPrice: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedSector && (
                <div className="bg-blue-50 rounded p-3 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Secteur sélectionné:</p>
                  <p className="text-lg font-bold text-blue-600">{selectedSector.icon} {selectedSector.name}</p>
                  <p className="text-xs text-blue-700 mt-1">{selectedSector.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Grille propriétés */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map(prop => {
                    const priceGnf = Math.round(prop.priceUsd * 8650); // Approximatif
                    const sector = sectors.find(s => s.id === prop.sector);

                    return (
                      <div
                        key={prop.id}
                        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-200"
                      >
                        {/* Image */}
                        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden flex items-center justify-center">
                          <div className="text-6xl">{prop.image}</div>
                          <button
                            onClick={() => toggleFavorite(prop.id)}
                            className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-red-50 transition shadow-lg"
                          >
                            <Heart
                              size={20}
                              fill={favorites.includes(prop.id) ? 'currentColor' : 'none'}
                              className={favorites.includes(prop.id) ? 'text-red-500' : 'text-gray-400'}
                            />
                          </button>
                          <span className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ✓ Disponible
                          </span>
                        </div>

                        {/* Contenu */}
                        <div className="p-4 space-y-3">
                          {/* Titre et localisation */}
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{prop.title}</h3>
                            <div className="flex items-center gap-2 text-blue-600 text-sm mt-1">
                              <MapPin size={16} />
                              <span>{sector ? sector.name : 'Conakry'}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{prop.description}</p>
                          </div>

                          {/* Specs */}
                          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-gray-50 rounded-lg">
                            <div>
                              <div className="text-xl">🛏️</div>
                              <p className="text-xs text-gray-600">{prop.bedrooms} ch.</p>
                            </div>
                            <div>
                              <div className="text-xl">🚿</div>
                              <p className="text-xs text-gray-600">{prop.bathrooms} sdb</p>
                            </div>
                            <div>
                              <div className="text-xl">📐</div>
                              <p className="text-xs text-gray-600">{prop.sqm} m²</p>
                            </div>
                          </div>

                          {/* Prix */}
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-xs text-gray-600 mb-1">Prix</p>
                            <p className="text-2xl font-bold text-blue-600">{formatGnf(priceGnf)}</p>
                            <p className="text-xs text-gray-500 mt-1">${prop.priceUsd.toLocaleString()}</p>
                          </div>

                          {/* Amenities */}
                          {prop.amenities && prop.amenities.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-700">Services:</p>
                              <div className="flex flex-wrap gap-1">
                                {prop.amenities.map((amenity, idx) => (
                                  <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm flex items-center justify-center gap-2">
                              <Phone size={16} /> Contacter
                            </button>
                            <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                              <Share2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-gray-600">Aucune propriété ne correspond à vos critères</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuineaPropertiesPage;
