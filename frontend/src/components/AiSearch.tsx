import React, { useState } from 'react';
import { Protected } from './Protected';
import { User } from '../lib/rbac';

/**
 * Interface pour les suggestions IA
 */
export interface AiSuggestion {
  title: string;
  description?: string;
  filters: {
    arrears_months?: number;
    location?: string;
    status?: string;
    [key: string]: any;
  };
  icon?: string;
}

/**
 * Props pour AiSearch
 */
export interface AiSearchProps {
  user?: User | null;
  onFilters: (filters: Record<string, any>) => void;
  onLoading?: (loading: boolean) => void;
}

/**
 * Composant AiSearch
 * Barre de recherche assistée par IA pour filtrer les locataires
 * Avec contrôle d'accès basé sur les permissions
 *
 * Permet de :
 * - Écrire des requêtes en langage naturel
 * - Recevoir des suggestions de filtrage
 * - Appliquer les filtres directement
 * - Restriction d'accès via permission 'ai.assist'
 *
 * Exemple d'utilisation :
 * <AiSearch
 *   user={user}
 *   onFilters={(filters) => applyFilters(filters)}
 *   onLoading={(loading) => setIsLoading(loading)}
 * />
 *
 * Exemples de prompts :
 * - "locataires en retard > 2 mois à Matam"
 * - "paiements non reçus ce mois"
 * - "nouveaux contrats octobre"
 */
export function AiSearch({ user, onFilters, onLoading }: AiSearchProps): React.ReactElement {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!prompt.trim()) {
      setError('Veuillez entrer une requête');
      return;
    }

    setLoading(true);
    setError(null);
    onLoading?.(true);

    try {
      // Note: api.req() n'existe pas, utiliser fetch directement
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche IA');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setSuggestions([]);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }

  function applySuggestion(suggestion: AiSuggestion) {
    onFilters(suggestion.filters);
    setPrompt(''); // Réinitialiser après application
    setSuggestions([]);
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Protected user={user} perm="ai.assist">
      <div className="card">
        <div className="space-y-3">
        {/* En-tête avec description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🤖 Recherche assistée par IA
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Décrivez ce que vous cherchez : locataires avec impayés, paiements non reçus, etc.
          </p>
        </div>

        {/* Champ de saisie */}
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ex: locataires en retard > 2 mois à Matam"
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? '⏳' : '🔍'}
            <span>{loading ? 'Analyse...' : 'Analyser'}</span>
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-2 rounded flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">💡 Suggestions :</p>
            <ul className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left p-2 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-sm"
                  >
                    <div className="font-semibold text-gray-700">{suggestion.title}</div>
                    {suggestion.description && (
                      <div className="text-xs text-gray-600 mt-1">{suggestion.description}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* État vide */}
        {!loading && suggestions.length === 0 && prompt && !error && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Aucune suggestion disponible
          </div>
        )}
        </div>
      </div>
    </Protected>
  );
}

/**
 * Variante compacte avec contrôle d'accès
 */
export function AiSearchCompact({ user, onFilters }: AiSearchProps): React.ReactElement {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        const firstSuggestion = data.suggestions?.[0];
        if (firstSuggestion) {
          onFilters(firstSuggestion.filters);
          setPrompt('');
        }
      }
    } catch (err) {
      console.error('Erreur recherche IA:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Protected user={user} perm="ai.assist">
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Recherche IA..."
          className="flex-1 border rounded px-2 py-1 text-sm"
          disabled={loading}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn btn-primary text-sm disabled:opacity-50"
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>
    </Protected>
  );
}
