import React, { useState } from 'react';
import { api } from '../api/client';

/**
 * AiRecoveryAssistant Component
 * AI-powered assistant for identifying and prioritizing payment collection targets
 *
 * Features:
 * - Natural language prompt for collection strategies
 * - Year-based filtering (2015-present)
 * - AI suggestions for filter combinations
 * - Quick apply filters to parent component
 * - Smart keyword extraction (arrears, payment methods, sites)
 *
 * Usage:
 * <AiRecoveryAssistant onApplyFilters={(filters) => {
 *   // Apply filters to tenant/contract list
 * }} />
 */
export function AiRecoveryAssistant({
  onApplyFilters,
}: {
  onApplyFilters: (filters: Record<string, any>) => void;
}) {
  const [prompt, setPrompt] = useState(
    'Prioriser impayés > 2 000 000 GNF sur 2025, mode orange money, sites problématiques'
  );
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Run AI analysis on the prompt
   * Extracts keywords and generates filter suggestions
   */
  async function analyze() {
    if (!prompt.trim()) {
      setError('Veuillez entrer une demande');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await api.ai.assist(prompt, {
        year,
        domain: 'payments',
        thresholds: {
          high_arrears: 2_000_000,
          moderate_arrears: 500_000,
        },
      });

      if (result && result.suggestions) {
        setSuggestions(result.suggestions);
      } else {
        setError('Aucune suggestion générée');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse');
      console.error('AI assist error:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Apply suggestion filters to parent component
   */
  function applySuggestion(filters: any) {
    onApplyFilters({
      ...filters,
      year,
    });
  }

  // Generate year options (2015 to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2015 + 1 }).map((_, i) => {
    const y = 2015 + i;
    return { value: y, label: String(y) };
  });

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <b className="text-lg">Assistant IA - Recouvrement</b>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          ⌘K / Ctrl+K
        </span>
      </div>

      {/* Input Section */}
      <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Impayés > 2M GNF, orange money, 2025..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') analyze();
            }}
          />
          <select
            className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded transition"
            onClick={analyze}
            disabled={loading}
          >
            {loading ? 'Analyse…' : 'Analyser'}
          </button>
        </div>

        {error && (
          <div className="text-sm px-3 py-2 rounded bg-red-50 text-red-800 border border-red-200">
            ✗ {error}
          </div>
        )}
      </div>

      {/* Suggestions Grid */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">Suggestions générées:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion: any, idx: number) => (
              <div
                key={idx}
                className="p-3 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50 hover:shadow-sm transition"
              >
                <div className="font-medium text-sm mb-1">
                  {suggestion.title || `Suggestion ${idx + 1}`}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {suggestion.description || 'Filtres intelligents détectés'}
                </div>

                {/* Filter Tags */}
                {suggestion.filters && Object.keys(suggestion.filters).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(suggestion.filters).map(([key, value]: [string, any]) => (
                      <span
                        key={key}
                        className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {key}: <strong>{String(value).substring(0, 20)}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Apply Button */}
                {suggestion.filters && (
                  <button
                    className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-2 py-1.5 rounded transition"
                    onClick={() => applySuggestion(suggestion.filters)}
                  >
                    {suggestion.action?.label || 'Appliquer filtres'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && suggestions.length === 0 && !error && (
        <div className="text-xs text-gray-500 p-4 text-center">
          Entrez une demande pour voir les suggestions intelligentes
        </div>
      )}
    </div>
  );
}
