import React, { useState } from 'react';
import { api } from '../api/client';

interface Suggestion {
  title: string;
  description: string;
  explain?: string;
  filters?: Record<string, any>;
  action?: {
    label: string;
    [key: string]: any;
  };
}

interface AiAssistantProps {
  context: Record<string, any>;
  onFilters?: (filters: Record<string, any>) => void;
  onAction?: (action: Record<string, any>) => void;
}

export function AiAssistant({ context, onFilters, onAction }: AiAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [res, setRes] = useState<{ suggestions: Suggestion[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.ai.assist(prompt, context);
      setRes(result as any);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
      setError(errorMessage);
      console.error('[AiAssistant] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && prompt.trim()) {
      run();
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <b>💡 Assistant IA</b>
        <span className="text-xs text-gray-500">Ctrl+K</span>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ex: Contrats qui expirent ce mois-ci à Matam"
          disabled={loading}
        />
        <button
          className="btn bg-[var(--akigBlue)] text-white"
          onClick={run}
          disabled={loading || !prompt.trim()}
          type="button"
        >
          {loading ? 'Analyse...' : 'Proposer'}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-2 border border-red-500 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {res && (
        <div className="mt-3 grid gap-2">
          {(res.suggestions || []).map((s: Suggestion, i: number) => (
            <div key={i} className="p-2 border rounded bg-blue-50">
              <div className="font-medium text-blue-900">{s.title}</div>
              <div className="text-sm text-gray-600 mt-1">{s.description}</div>
              {s.explain && (
                <div className="text-xs text-gray-500 mt-1 italic">{s.explain}</div>
              )}
              <div className="mt-2 flex gap-2">
                {s.filters && (
                  <button
                    className="btn btn-primary text-sm"
                    onClick={() => onFilters?.(s.filters!)}
                    type="button"
                  >
                    Appliquer filtres
                  </button>
                )}
                {s.action && (
                  <button
                    className="btn bg-[var(--akigRed)] text-white text-sm"
                    onClick={() => onAction?.(s.action!)}
                    type="button"
                  >
                    {s.action.label}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
