import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

interface Suggestion {
  title: string;
  description: string;
  filters?: Record<string, unknown>;
  action?: {
    label?: string;
    [key: string]: unknown;
  };
}

interface AiCommandPaletteProps {
  context: Record<string, unknown>;
  onApplyFilters: (filters: Record<string, unknown>) => void;
  onRunAction: (action: unknown) => void;
}

export function AiCommandPalette({
  context,
  onApplyFilters,
  onRunAction,
}: AiCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const run = useCallback(async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await api.ai.assist(prompt, context);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('AI command palette error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [prompt, context]);

  const handleApplyFilters = useCallback(
    (filters: Record<string, unknown>) => {
      onApplyFilters(filters);
      setOpen(false);
      setPrompt('');
      setSuggestions([]);
    },
    [onApplyFilters]
  );

  const handleRunAction = useCallback(
    (action: unknown) => {
      onRunAction(action);
      setOpen(false);
      setPrompt('');
      setSuggestions([]);
    },
    [onRunAction]
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-start justify-center bg-black/40 p-6"
      onClick={() => setOpen(false)}
    >
      <div
        className="card w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <b>Assistant IA (Cmd+K)</b>
          <button
            className="btn"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            type="button"
          >
            ✖
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !loading) {
                run();
              }
            }}
            placeholder="Ex: locataires en impayé à Matam, contrats qui expirent ce mois-ci"
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={run}
            disabled={loading || !prompt.trim()}
            type="button"
          >
            {loading ? 'Analyse...' : 'Proposer'}
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {loading ? (
            <div className="h-5 w-1/2 rounded bg-gray-200 animate-pulse"></div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div key={index} className="rounded border p-2">
                <div className="font-medium">{suggestion.title}</div>
                <div className="text-sm text-gray-600">
                  {suggestion.description}
                </div>

                {suggestion.filters && (
                  <div className="mt-1 text-xs">
                    <b>Filtres:</b>{' '}
                    {Object.entries(suggestion.filters)
                      .map(([key, value]) => `${key}:${value}`)
                      .join(', ')}
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  {suggestion.filters && (
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        handleApplyFilters(suggestion.filters as Record<string, unknown>)
                      }
                      type="button"
                    >
                      Appliquer filtres
                    </button>
                  )}
                  {suggestion.action && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRunAction(suggestion.action)}
                      type="button"
                    >
                      {suggestion.action.label || 'Action'}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            !loading && <div className="text-sm text-gray-500">Aucune suggestion</div>
          )}
        </div>
      </div>
    </div>
  );
}
