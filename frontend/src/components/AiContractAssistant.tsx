import React, { useState } from 'react';
import { uiLog } from '../lib/uilog';

interface ClientProfile {
  nom?: string;
  tel?: string;
  adresse?: string;
  profession?: string;
  cni?: string;
  garant?: string;
  revenu?: string;
  [key: string]: any;
}

interface AgencyProfile {
  nom?: string;
  email?: string;
  tel_reception?: string;
  rccm?: string;
  [key: string]: any;
}

interface ContractDetails {
  type?: string;
  loyer?: string;
  caution?: string;
  date_debut?: string;
  date_fin?: string;
  periodicite?: string;
  mode_paiement?: string;
  [key: string]: any;
}

interface AiSuggestion {
  id: string;
  category: 'risk' | 'document' | 'recommendation' | 'missing_info';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action?: string;
}

interface AiContractAssistantProps {
  variables?: {
    akig?: AgencyProfile;
    client?: ClientProfile;
    contrat?: ContractDetails;
    [key: string]: any;
  };
  onUpdate?: (suggestions: AiSuggestion[]) => void;
}

/**
 * AI Contract Assistant Component
 * Provides intelligent suggestions for contract generation
 */
export function AiContractAssistant({
  variables = {},
  onUpdate,
}: AiContractAssistantProps): React.ReactElement {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [expanded, setExpanded] = useState(true);

  /**
   * Generate local AI suggestions based on variables
   */
  const generateLocalSuggestions = (): AiSuggestion[] => {
    const sugg: AiSuggestion[] = [];
    const client = variables.client || {};
    const contract = variables.contrat || {};
    const agency = variables.akig || {};

    // Check for missing critical information
    if (!client.nom) {
      sugg.push({
        id: 'missing_client_name',
        category: 'missing_info',
        severity: 'critical',
        title: 'Nom du client manquant',
        description: 'Le nom complet du client est requis pour générer le contrat',
      });
    }

    if (!client.tel) {
      sugg.push({
        id: 'missing_client_tel',
        category: 'missing_info',
        severity: 'warning',
        title: 'Téléphone client manquant',
        description: 'Un numéro de téléphone facilite le suivi',
      });
    }

    if (!contract.loyer) {
      sugg.push({
        id: 'missing_loyer',
        category: 'missing_info',
        severity: 'critical',
        title: 'Montant du loyer manquant',
        description: 'Le montant du loyer est essential pour le contrat',
      });
    }

    // Analyze revenu vs loyer ratio
    if (client.revenu && contract.loyer) {
      const revenuMatch = client.revenu.match(/(\d+[\s.]?\d*)/);
      const loyerMatch = contract.loyer.match(/(\d+[\s.]?\d*)/);

      if (revenuMatch && loyerMatch) {
        const revenuNum = parseFloat(revenuMatch[1].replace(/[\s.]/g, ''));
        const loyerNum = parseFloat(loyerMatch[1].replace(/[\s.]/g, ''));
        const ratio = (loyerNum / revenuNum) * 100;

        if (ratio > 50) {
          sugg.push({
            id: 'high_rent_ratio',
            category: 'risk',
            severity: 'warning',
            title: 'Loyer élevé par rapport au revenu',
            description: `Le loyer représente ${ratio.toFixed(1)}% du revenu. Standard: <30%`,
            action: 'Vérifier la capacité de paiement du client',
          });
        }
      }
    }

    // Check contract duration
    if (contract.date_debut && contract.date_fin) {
      try {
        const start = new Date(contract.date_debut);
        const end = new Date(contract.date_fin);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                       (end.getMonth() - start.getMonth());

        if (months < 6) {
          sugg.push({
            id: 'short_contract',
            category: 'recommendation',
            severity: 'info',
            title: 'Contrat court term',
            description: `Durée: ${months} mois. Contrats courts peuvent nécessiter des ajustements`,
          });
        }
      } catch (e) {
        // Date parsing failed, skip
      }
    }

    // Recommend caution amount
    if (contract.loyer && !contract.caution) {
      sugg.push({
        id: 'suggest_caution',
        category: 'recommendation',
        severity: 'info',
        title: 'Caution non définie',
        description: 'Recommandation: Fixer la caution à 2-3 mois de loyer',
        action: 'Caution suggérée: 2-3 mois',
      });
    }

    // Check for guarantor
    if (!client.garant) {
      sugg.push({
        id: 'missing_guarantor',
        category: 'missing_info',
        severity: 'warning',
        title: 'Garant non spécifié',
        description: 'Un garant renforce la sécurité du contrat',
      });
    }

    // Validate contact information
    if (!agency.email || !agency.tel_reception) {
      sugg.push({
        id: 'incomplete_agency_info',
        category: 'document',
        severity: 'warning',
        title: 'Informations agence incomplètes',
        description: 'Email ou téléphone de réception manquant dans le contrat',
      });
    }

    return sugg;
  };

  /**
   * Fetch AI suggestions from backend
   */
  const fetchAiSuggestions = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      uiLog('ai_contract_suggest_start', { variables });

      const response = await fetch('/api/ai/contract-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables }),
        credentials: 'include',
      });

      if (!response.ok) {
        // Fallback to local suggestions if backend not available
        console.warn('Backend AI unavailable, using local suggestions');
        const localSugg = generateLocalSuggestions();
        setSuggestions(localSugg);
        onUpdate?.(localSugg);
        uiLog('ai_contract_suggest_local', {
          count: localSugg.length,
        });
        return;
      }

      const data = await response.json();
      const serverSuggestions: AiSuggestion[] = data.suggestions || [];

      // Merge with local suggestions
      const allSuggestions = [...generateLocalSuggestions(), ...serverSuggestions];

      // Remove duplicates
      const uniqueSuggestions = Array.from(
        new Map(allSuggestions.map((s) => [s.id, s])).values()
      );

      setSuggestions(uniqueSuggestions);
      onUpdate?.(uniqueSuggestions);

      uiLog('ai_contract_suggest_success', {
        count: uniqueSuggestions.length,
      });
    } catch (err) {
      const message = String(err);
      setError(message);
      uiLog('ai_contract_suggest_error', { error: message });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analyze profile without backend (local only)
   */
  const analyzeLocal = (): void => {
    const localSugg = generateLocalSuggestions();
    setSuggestions(localSugg);
    onUpdate?.(localSugg);
    uiLog('ai_contract_analyze_local', {
      count: localSugg.length,
    });
  };

  const handleAnalyze = (): void => {
    // Try backend first, fallback to local
    if (navigator.onLine) {
      fetchAiSuggestions();
    } else {
      analyzeLocal();
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'risk':
        return 'Risque';
      case 'document':
        return 'Document';
      case 'recommendation':
        return 'Recommandation';
      case 'missing_info':
        return 'Information manquante';
      default:
        return category;
    }
  };

  return (
    <div className="card mt-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg text-blue-900">🤖 Assistant IA</h3>
          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
            Beta
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {!expanded && (
        <div className="mt-2">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:bg-gray-400"
          >
            {isLoading ? '⟳ Analyse en cours...' : '🔍 Analyser le profil client'}
          </button>
        </div>
      )}

      {expanded && (
        <>
          {/* Controls */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:bg-gray-400 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Analyse en cours...
                </>
              ) : (
                <>
                  🔍 Analyser le profil client
                </>
              )}
            </button>

            {suggestions.length > 0 && (
              <button
                onClick={() => setSuggestions([])}
                className="btn bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
              >
                🗑️ Effacer
              </button>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              ❌ Erreur: {error}
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                    🚨 {suggestions.filter((s) => s.severity === 'critical').length}
                  </span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    ⚠️ {suggestions.filter((s) => s.severity === 'warning').length}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ℹ️ {suggestions.filter((s) => s.severity === 'info').length}
                  </span>
                </div>
              </div>

              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-3 rounded ${getSeverityColor(suggestion.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getSeverityIcon(suggestion.severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                        <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded">
                          {getCategoryLabel(suggestion.category)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{suggestion.description}</p>
                      {suggestion.action && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          💡 {suggestion.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isLoading ? (
            <div className="mt-4 text-center text-gray-600">
              <p>⟳ Analyse du profil en cours...</p>
            </div>
          ) : (
            <div className="mt-4 text-center text-gray-500 text-sm">
              <p>Cliquez sur "Analyser le profil client" pour recevoir des suggestions intelligentes</p>
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600">
            <p>
              ℹ️ L'assistant IA analyse le profil du client et fournit des recommandations pour
              optimiser le contrat.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
