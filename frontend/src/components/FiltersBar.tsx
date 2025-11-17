import React from 'react';
import { FR } from '../i18n/fr';

/**
 * Interface pour les filtres
 */
export interface Filters {
  query?: string;
  year?: number;
  status?: string;
  mode?: string;
  site?: string;
  owner?: string;
}

/**
 * Props du FiltersBar
 */
export interface FiltersBarProps {
  value: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  showMode?: boolean;
  showSite?: boolean;
  showOwner?: boolean;
}

/**
 * Composant FiltersBar
 * Barre de filtrage pour les listes de locataires
 *
 * Filtres disponibles :
 * - Recherche par nom/téléphone
 * - Année
 * - Statut (actif, en retard, terminé)
 * - Mode de paiement
 * - Site et propriétaire (optionnels)
 *
 * Exemple d'utilisation :
 * <FiltersBar
 *   value={filters}
 *   onChange={setFilters}
 *   onReset={() => setFilters({year: new Date().getFullYear()})}
 *   showSite={true}
 * />
 */
export function FiltersBar({
  value,
  onChange,
  onReset,
  showMode = true,
  showSite = false,
  showOwner = false,
}: FiltersBarProps): React.ReactElement {
  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
      {/* Première ligne : recherche et année */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔍 {FR.common.search}
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={value.query || ''}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            placeholder="Nom, téléphone…"
          />
        </div>

        <div className="min-w-[120px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📅 {FR.common.year}
          </label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={value.year || currentYear}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[130px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📊 {FR.common.status}
          </label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={value.status || ''}
            onChange={(e) => onChange({ ...value, status: e.target.value })}
          >
            <option value="">{FR.common.status}</option>
            <option value="active">{FR.common.active}</option>
            <option value="overdue">{FR.common.overdue}</option>
            <option value="terminated">{FR.common.terminated}</option>
          </select>
        </div>

        <button
          onClick={onReset}
          className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition font-medium"
        >
          🔄 {FR.common.cancel}
        </button>
      </div>

      {/* Deuxième ligne : mode, site, propriétaire */}
      {(showMode || showSite || showOwner) && (
        <div className="flex flex-wrap gap-3 items-end">
          {showMode && (
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💳 {FR.common.mode}
              </label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={value.mode || ''}
                onChange={(e) => onChange({ ...value, mode: e.target.value })}
              >
                <option value="">{FR.common.mode}</option>
                <option value="cash">{FR.paymentModes.cash}</option>
                <option value="transfer">{FR.paymentModes.transfer}</option>
                <option value="mobile_money">{FR.paymentModes.mobileMoney}</option>
                <option value="check">{FR.paymentModes.check}</option>
                <option value="card">{FR.paymentModes.card}</option>
              </select>
            </div>
          )}

          {showSite && (
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏢 {FR.common.site}
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={value.site || ''}
                onChange={(e) => onChange({ ...value, site: e.target.value })}
                placeholder="Nom du site"
              />
            </div>
          )}

          {showOwner && (
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👤 {FR.common.owner}
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={value.owner || ''}
                onChange={(e) => onChange({ ...value, owner: e.target.value })}
                placeholder="Nom du propriétaire"
              />
            </div>
          )}
        </div>
      )}

      {/* Résumé des filtres actifs */}
      {(value.query || value.status || value.mode) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.query && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              🔍 {value.query}
            </span>
          )}
          {value.status && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              📊 {value.status}
            </span>
          )}
          {value.mode && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              💳 {value.mode}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Variante compacte du FiltersBar
 */
export function CompactFiltersBar({
  value,
  onChange,
  onReset,
}: Pick<FiltersBarProps, 'value' | 'onChange' | 'onReset'>): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2 items-end p-2">
      <input
        type="text"
        className="flex-1 min-w-[200px] border rounded px-2 py-1 text-sm"
        value={value.query || ''}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
        placeholder="Recherche…"
      />
      <select
        className="border rounded px-2 py-1 text-sm"
        value={value.year || new Date().getFullYear()}
        onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
      >
        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 9 + i).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button onClick={onReset} className="btn text-sm">
        🔄
      </button>
    </div>
  );
}
