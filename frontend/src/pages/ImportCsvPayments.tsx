import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * ImportCsvPayments - Import payment CSV files
 * Handles CSV file uploads and tracks import history
 *
 * Features:
 * - Specify CSV file path and name
 * - Import triggers multi-year arrears recalculation
 * - View import run history with statistics
 * - Shows row counts: total, inserted, duplicated, failed
 */
export default function ImportCsvPayments() {
  const [path, setPath] = useState('/data/Export_Paiements_20251026.csv');
  const [name, setName] = useState('Export_Paiements_20251026.csv');
  const [status, setStatus] = useState<string | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Execute CSV import
   * Sends file path to backend which processes the CSV and recalculates arrears
   */
  async function run() {
    if (!path.trim() || !name.trim()) {
      setStatus('Erreur: Veuillez entrer un chemin et un nom de fichier');
      return;
    }

    setStatus('Import en cours…');
    setLoading(true);
    try {
      const response = await api.imports.importPaymentsCsv(name, path);

      if (response.ok) {
        setStatus('✓ Import OK. Impayés multi-années recalculés.');
        setPath('');
        setName('');
        // Reload import history
        await loadRuns();
      } else {
        setStatus(`✗ Erreur import: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setStatus(`✗ Erreur import: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Load import run history from backend
   */
  async function loadRuns() {
    try {
      const data = await api.imports.getImportRuns(20);
      setRuns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load import runs:', error);
      setRuns([]);
    }
  }

  // Load import history on component mount
  useEffect(() => {
    loadRuns();
  }, []);

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Importer paiements (2015–aujourd'hui)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Importez des fichiers CSV contenant l'historique des paiements. Le système recalculera automatiquement les impayés pour toutes les années.
        </p>
      </div>

      {/* Import Form */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nom du fichier
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Export_Paiements_20251026.csv"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Chemin du fichier
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/data/Export_Paiements_20251026.csv"
            />
          </div>
          <div className="flex items-end">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded transition"
              onClick={run}
              disabled={loading}
            >
              {loading ? 'Import en cours…' : 'Importer'}
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`text-sm px-3 py-2 rounded ${
              status.startsWith('✓')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status}
          </div>
        )}
      </div>

      {/* Import History */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-3">Historique des imports</h3>
        {runs.length === 0 ? (
          <div className="text-sm text-gray-500 p-4 text-center">
            Aucun import effectué pour le moment
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run: any) => (
              <div
                key={run.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {run.source_file}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded mr-2 ${
                          run.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : run.status === 'completed_with_errors'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {run.status}
                      </span>
                      <span className="text-gray-700">
                        Total: <strong>{run.rows_total}</strong> • Insertés:{' '}
                        <strong>{run.rows_inserted}</strong> • Doublons:{' '}
                        <strong>{run.rows_duplicated}</strong> • Échecs:{' '}
                        <strong>{run.rows_failed}</strong>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Début:{' '}
                      {new Date(run.created_at).toLocaleString('fr-GN')}
                      {run.finished_at && (
                        <>
                          {' '}
                          • Fin:{' '}
                          {new Date(run.finished_at).toLocaleString('fr-GN')}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
