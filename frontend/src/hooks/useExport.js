/**
 * 🎣 React Hook useExport
 * 
 * Hook réutilisable pour tous les exports PDF/Excel/CSV
 * Gère le téléchargement blob correctement
 */

import { useState } from 'react';

/**
 * Hook pour exporter données en blob
 * @param {string} endpoint - API endpoint pour export (/api/exports/...)
 * @param {string} filename - Nom du fichier à télécharger
 * @returns {object} {export, isLoading, error}
 */
export const useExport = (endpoint, filename) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadBlob = (blob, fname) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fname;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportData = async (params = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // Construire URL avec params
      const queryParams = new URLSearchParams(params);
      const url = `${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      downloadBlob(blob, filename);

      return { success: true, message: 'Export réussi' };
    } catch (err) {
      const errorMsg = err.message || 'Erreur lors de l\'export';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return { exportData, isLoading, error };
};

/**
 * Hook spécifique pour exports PDF
 */
export const useExportPDF = (title) => {
  const endpoint = '/api/exports/reports/fiscal-pdf';
  const filename = `${title}-${new Date().toISOString().split('T')[0]}.pdf`;
  return useExport(endpoint, filename);
};

/**
 * Hook spécifique pour exports Excel
 */
export const useExportExcel = (title) => {
  const endpoint = '/api/exports/reports/fiscal-excel';
  const filename = `${title}-${new Date().toISOString().split('T')[0]}.xlsx`;
  return useExport(endpoint, filename);
};

/**
 * Hook pour exports Propriétés
 */
export const useExportProperties = (format = 'pdf') => {
  const formats = {
    pdf: { endpoint: '/api/exports/properties/pdf', ext: 'pdf' },
    excel: { endpoint: '/api/exports/properties/excel', ext: 'xlsx' },
    csv: { endpoint: '/api/exports/properties/csv', ext: 'csv' }
  };
  
  const config = formats[format] || formats.pdf;
  const filename = `proprietes-${new Date().toISOString().split('T')[0]}.${config.ext}`;
  return useExport(config.endpoint, filename);
};

/**
 * Hook pour exports Paiements
 */
export const useExportPayments = (format = 'pdf') => {
  const formats = {
    pdf: { endpoint: '/api/exports/payments/pdf', ext: 'pdf' },
    excel: { endpoint: '/api/exports/payments/excel', ext: 'xlsx' }
  };
  
  const config = formats[format] || formats.pdf;
  const filename = `paiements-${new Date().toISOString().split('T')[0]}.${config.ext}`;
  return useExport(config.endpoint, filename);
};

/**
 * Hook pour exports Contrats
 */
export const useExportContract = (contractId, format = 'pdf') => {
  const endpoint = `/api/exports/contracts/${format}/${contractId}`;
  const filename = `contrat-${contractId}-${new Date().toISOString().split('T')[0]}.${format}`;
  return useExport(endpoint, filename);
};

/**
 * Hook pour multi-format export
 */
export const useExportMulti = (type, formats = 'pdf') => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportMultiple = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/exports/multi?type=${type}&formats=${formats}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Export échoué');
      
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const errorMsg = err.message || 'Erreur lors de l\'export';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return { exportMultiple, isLoading, error };
};

export default useExport;
