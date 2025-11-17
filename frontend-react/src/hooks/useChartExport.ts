// frontend-react/src/hooks/useChartExport.ts
/**
 * Hook pour exporter des graphiques en PNG
 * Utilise html2canvas pour capturer le DOM
 */
import { useRef, RefObject } from 'react';
import html2canvas from 'html2canvas';

interface UseChartExportReturn {
  exportRef: RefObject<HTMLDivElement>;
  exportToPNG: (filename: string) => Promise<void>;
  exportToJPEG: (filename: string, quality?: number) => Promise<void>;
  isExporting: boolean;
}

export function useChartExport(): UseChartExportReturn {
  const exportRef = useRef<HTMLDivElement>(null);

  const exportToPNG = async (filename: string): Promise<void> => {
    if (!exportRef.current) {
      console.error('Export ref not attached to element');
      return;
    }

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Haute résolution
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${filename}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      throw error;
    }
  };

  const exportToJPEG = async (filename: string, quality = 0.92): Promise<void> => {
    if (!exportRef.current) {
      console.error('Export ref not attached to element');
      return;
    }

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${filename}-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', quality);
      link.click();
    } catch (error) {
      console.error('Error exporting to JPEG:', error);
      throw error;
    }
  };

  return {
    exportRef,
    exportToPNG,
    exportToJPEG,
    isExporting: false, // À implémenter avec useState si besoin de loading state
  };
}
