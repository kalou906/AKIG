/**
 * 📄 Page: Propriétés - Listing Complet
 */
import React, { useState, useEffect } from 'react';
import { MapPin, Bed, Bath, Maximize2, Heart, Phone } from 'lucide-react';
import { SkeletonCard, ErrorBanner } from '../components/design-system/Feedback';

export const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({ type: '', city: 'Conakry', minPrice: 0, maxPrice: 10000000 });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams(filters).toString();
    fetch(`/api/properties?${q}`)
      .then(r => {
        if (!r.ok) throw new Error('Erreur chargement propriétés');
        return r.json();
      })
      .then(d => setProperties(d.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const toggleFavorite = (id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 mb-4">
          <img
            src="/assets/logos/logo.png"
            alt="Logo AKIG"
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-800">Catalogue des Propriétés</h1>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Type</option>
            <option value="apartment">Appartement</option>
            <option value="house">Maison</option>
            <option value="villa">Villa</option>
          </select>
          <select value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            <option value="Conakry">Conakry</option>
            <option value="Kindia">Kindia</option>
          </select>
          <input type="number" placeholder="Prix min" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Prix max" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64"><SkeletonCard height={48} /></div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : properties.length === 0 ? (
          <ErrorBanner message="Aucune propriété trouvée" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(prop => (
              <div key={prop.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="relative h-64 bg-gray-300 overflow-hidden">
                  {prop.main_image ? <img src={prop.main_image} alt={prop.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400">Image</div>}
                  <button onClick={() => toggleFavorite(prop.id)} className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100">
                    <Heart size={20} fill={favorites.includes(prop.id) ? 'currentColor' : 'none'} className={favorites.includes(prop.id) ? 'text-red-500' : 'text-gray-400'} />
                  </button>
                  <span className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Disponible</span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{prop.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3"><MapPin size={14} /> {prop.district}, {prop.city}</p>

                  <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b">
                    <div><Bed size={16} className="text-gray-400 mx-auto" /><p className="text-center text-xs text-gray-600 mt-1">{prop.bedrooms} Ch.</p></div>
                    <div><Bath size={16} className="text-gray-400 mx-auto" /><p className="text-center text-xs text-gray-600 mt-1">{prop.bathrooms} S.D.</p></div>
                    <div><Maximize2 size={16} className="text-gray-400 mx-auto" /><p className="text-center text-xs text-gray-600 mt-1">{prop.total_area} m²</p></div>
                  </div>

                  <p className="text-2xl font-bold text-green-600 mb-3">{prop.rental_price?.toLocaleString('fr-FR') || 'N/A'} <span className="text-sm text-gray-500">GNF/mois</span></p>

                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-semibold text-sm">Détails</button>
                    <button className="bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-semibold text-sm flex items-center justify-center gap-1"><Phone size={14} /> Contact</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
