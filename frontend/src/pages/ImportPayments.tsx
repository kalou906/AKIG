import React, { useState, useRef } from 'react';
import { FormField } from '../components/FormField';
import { ExportButtons } from '../components/ExportButtons';
import { uiLog } from '../lib/uilog';
import { req } from '../api/client';

interface PaymentRow {
  tenant_id: number;
  paid_at: string;
  amount: number;
  mode?: string;
  channel?: string;
  external_ref?: string;
}

interface ImportResult {
  success: boolean;
  import_run_id: number;
  summary: {
    total: number;
    inserted: number;
    duplicated: number;
    failed: number;
  };
  errors?: string[];
}

export const ImportPayments: React.FC = () => {
  const [csvText, setCsvText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): PaymentRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: PaymentRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const row: PaymentRow = {
        tenant_id: parseInt(values[headers.indexOf('tenant_id')] || '0'),
        paid_at: values[headers.indexOf('paid_at')] || new Date().toISOString().split('T')[0],
        amount: parseFloat(values[headers.indexOf('amount')] || '0'),
        mode: values[headers.indexOf('mode')] || 'cash',
        channel: values[headers.indexOf('channel')] || undefined,
        external_ref: values[headers.indexOf('external_ref')] || undefined,
      };

      if (row.tenant_id && row.amount) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      setCsvText(text);
      uiLog('import_csv_file_selected', { filename: file.name, size: file.size });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to read file';
      setError(errorMsg);
      uiLog('import_csv_file_error', { error: errorMsg });
    }
  };

  const handleImport = async () => {
    try {
      setError('');
      setResult(null);

      if (!csvText.trim()) {
        setError('Please provide CSV data');
        return;
      }

      setIsLoading(true);
      uiLog('import_payments_start', { rows_count: csvText.split('\n').length - 1 });

      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        setError('No valid payment rows found. Required columns: tenant_id, paid_at, amount');
        uiLog('import_payments_error', { error: 'no_valid_rows' });
        setIsLoading(false);
        return;
      }

      const result = await req<ImportResult>('/import/payments', {
        method: 'POST',
        body: JSON.stringify({
          rows,
          source_file: 'csv_upload',
        }),
      });

      setResult(result);
      setCsvText('');

      uiLog('import_payments_success', {
        total: result.summary.total,
        inserted: result.summary.inserted,
        duplicated: result.summary.duplicated,
        failed: result.summary.failed,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import failed';
      setError(errorMsg);
      uiLog('import_payments_error', { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Import Payment History</h1>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-2">
            Required columns: tenant_id, paid_at, amount. Optional: mode, channel, external_ref
          </p>
        </div>

        {/* CSV Input */}
        <FormField
          label="Or paste CSV data directly"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          type="textarea"
          placeholder="tenant_id,paid_at,amount,mode,channel&#10;1,2024-01-15,500000,cash&#10;2,2024-01-20,250000,orange_money"
          disabled={isLoading}
        />

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Result Summary */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Import Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">{result.summary.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Inserted</p>
                <p className="text-2xl font-bold text-green-600">{result.summary.inserted}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duplicated</p>
                <p className="text-2xl font-bold text-yellow-600">{result.summary.duplicated}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      {err}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-sm text-gray-600">
                      ... and {result.errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => {
                  setResult(null);
                  setCsvText('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleImport}
            disabled={isLoading || !csvText.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Importing...' : 'Import Payments'}
          </button>
          <button
            onClick={() => {
              setCsvText('');
              setError('');
              setResult(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition"
          >
            Clear
          </button>
        </div>

        {/* Template Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-3">CSV Template</h3>
          <p className="text-sm text-gray-600 mb-3">
            Download this template and fill in your payment data:
          </p>
          <ExportButtons
            data={[
              {
                tenant_id: 1,
                paid_at: '2024-01-15',
                amount: 500000,
                mode: 'cash',
                channel: 'counter',
                external_ref: 'REC-001',
              },
              {
                tenant_id: 2,
                paid_at: '2024-01-20',
                amount: 250000,
                mode: 'orange_money',
                channel: 'mobile',
                external_ref: 'REC-002',
              },
            ]}
            filename="payment_import_template"
          />
        </div>
      </div>
    </div>
  );
};
