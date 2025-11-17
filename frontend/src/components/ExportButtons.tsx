import React from 'react';
import { exportCsv, exportJson, copyToClipboard } from '../lib/exportCsv';

interface ExportButtonsProps {
  data: any[];
  filename?: string;
}

export function ExportButtons({
  data,
  filename = 'export.csv',
}: ExportButtonsProps): React.ReactElement {
  const handleCsvExport = (): void => {
    exportCsv(filename, data);
  };

  const handleJsonExport = (): void => {
    const jsonFilename = filename.replace('.csv', '.json');
    exportJson(jsonFilename, data);
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleCopyJson = async (): Promise<void> => {
    const success = await copyToClipboard(JSON.stringify(data, null, 2));
    if (success) {
      console.log('Data copied to clipboard');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        className="btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
        onClick={handleCsvExport}
        aria-label="Exporter en CSV"
        title="Télécharger en format CSV"
      >
        📥 CSV
      </button>

      <button
        className="btn bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
        onClick={handleJsonExport}
        aria-label="Exporter en JSON"
        title="Télécharger en format JSON"
      >
        📥 JSON
      </button>

      <button
        className="btn bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded"
        onClick={handleCopyJson}
        aria-label="Copier en JSON"
        title="Copier les données en format JSON"
      >
        📋 Copier
      </button>

      <button
        className="btn bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded"
        onClick={handlePrint}
        aria-label="Imprimer"
        title="Imprimer le document"
      >
        🖨️ Imprimer
      </button>
    </div>
  );
}
