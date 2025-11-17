/**
 * 🏘️  Composant Secteurs Conakry - AKIG
 * 
 * Affichage et sélection des 5 communes
 */

import React, { useState } from 'react';
import { useGuineaSectors, useGuineaCurrency } from '../hooks/useGuinea';

const SectorsComponent = ({ onSectorSelect = () => {}, selectedSector = null }) => {
  const { sectors, isLoading, error, filterByPriceLevel } = useGuineaSectors();
  const { formatGnf } = useGuineaCurrency();
  const [filter, setFilter] = useState('ALL');

  const displaySectors = filter === 'ALL' 
    ? sectors 
    : filterByPriceLevel(filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">🔄</div>
          <p className="text-gray-500">Chargement secteurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Erreur lors du chargement des secteurs
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous les secteurs
        </button>
        {['PREMIUM', 'HAUT', 'MOYEN', 'ACCESSIBLE', 'BUDGET'].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === level
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Grille secteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displaySectors.map((sector) => (
          <div
            key={sector.id}
            onClick={() => onSectorSelect(sector)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition ${
              selectedSector?.id === sector.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold">{sector.name}</h3>
                <p className="text-sm text-gray-600">{sector.common}</p>
              </div>
              <span className="text-3xl">{sector.icon}</span>
            </div>

            {/* Price Level */}
            <div className="mb-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                sector.priceLevel === 'PREMIUM' ? 'bg-yellow-200 text-yellow-800' :
                sector.priceLevel === 'HAUT' ? 'bg-green-200 text-green-800' :
                sector.priceLevel === 'MOYEN' ? 'bg-blue-200 text-blue-800' :
                sector.priceLevel === 'ACCESSIBLE' ? 'bg-purple-200 text-purple-800' :
                'bg-red-200 text-red-800'
              }`}>
                {sector.priceLevel}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {sector.description}
            </p>

            {/* Prix T3 */}
            <div className="bg-gray-50 rounded p-2 mb-3">
              <p className="text-xs text-gray-600">Prix moyen T3:</p>
              <p className="text-lg font-bold text-blue-600">
                {formatGnf(sector.averagePrices.t3)}
              </p>
            </div>

            {/* Caractéristiques */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Caractéristiques:</p>
              <div className="flex flex-wrap gap-1">
                {sector.characteristics.slice(0, 3).map((char, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Risque */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Risque:</span>
              <span className={`font-semibold ${
                sector.riskLevel === 'Très faible' ? 'text-green-600' :
                sector.riskLevel === 'Faible' ? 'text-green-500' :
                sector.riskLevel === 'Moyen' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {sector.riskLevel}
              </span>
            </div>
          </div>
        ))}
      </div>

      {displaySectors.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Aucun secteur trouvé pour cette catégorie
        </div>
      )}
    </div>
  );
};

export default SectorsComponent;
