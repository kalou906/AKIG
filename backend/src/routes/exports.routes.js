/**
 * 📤 Routes Export Universel - AKIG
 * 
 * Export PDF/Excel/CSV avec blob correct
 * Endpoints pour tout exporter
 */

const express = require('express');
const router = express.Router();
const UniversalExportService = require('../services/UniversalExport.service');

// ============================================================
// 📋 EXPORT PROPRIÉTÉS
// ============================================================

/**
 * GET /api/exports/properties/pdf
 * Exporter propriétés en PDF
 */
router.get('/properties/pdf', async (req, res) => {
  try {
    const { sector, minPrice, maxPrice } = req.query;

    // Données exemple (en prod: récupérer de BD)
    const properties = [
      { ref: '#001', title: 'Villa Matam', sector: 'Matam', price: '6M GNF', status: 'Disponible' },
      { ref: '#002', title: 'T3 Dixinn', sector: 'Dixinn', price: '2M GNF', status: 'Loué' },
      { ref: '#003', title: 'Apt Kaloum', sector: 'Kaloum', price: '4M GNF', status: 'Disponible' }
    ];

    const result = await UniversalExportService.generatePDF(
      'Rapport Propriétés',
      properties,
      {
        filename: `proprietes-${Date.now()}.pdf`,
        addTitle: true
      }
    );

    // IMPORTANT: Réponse correcte avec blob
    UniversalExportService.createDownloadResponse(
      res,
      result.buffer,
      result.filename,
      result.contentType
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exports/properties/excel
 * Exporter propriétés en Excel
 */
router.get('/properties/excel', async (req, res) => {
  try {
    const properties = [
      { Réference: '#001', Titre: 'Villa Matam', Secteur: 'Matam', Prix: '6M GNF', Statut: 'Disponible' },
      { Réference: '#002', Titre: 'T3 Dixinn', Secteur: 'Dixinn', Prix: '2M GNF', Statut: 'Loué' },
      { Réference: '#003', Titre: 'Apt Kaloum', Secteur: 'Kaloum', Prix: '4M GNF', Statut: 'Disponible' }
    ];

    const result = await UniversalExportService.generateExcel(
      'Propriétés',
      properties,
      {
        filename: `proprietes-${Date.now()}.xlsx`,
        sheetName: 'Propriétés',
        addTitle: true
      }
    );

    UniversalExportService.createDownloadResponse(
      res,
      result.buffer,
      result.filename,
      result.contentType
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exports/properties/csv
 * Exporter propriétés en CSV
 */
router.get('/properties/csv', async (req, res) => {
  try {
    const properties = [
      { Reference: '#001', Titre: 'Villa Matam', Secteur: 'Matam', Prix: '6M GNF' },
      { Reference: '#002', Titre: 'T3 Dixinn', Secteur: 'Dixinn', Prix: '2M GNF' }
    ];

    const result = await UniversalExportService.generateCSV(
      'Propriétés',
      properties,
      { filename: `proprietes-${Date.now()}.csv` }
    );

    UniversalExportService.createDownloadResponse(
      res,
      result.buffer,
      result.filename,
      result.contentType
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 💳 EXPORT PAIEMENTS
// ============================================================

/**
 * GET /api/exports/payments/pdf
 * Exporter paiements en PDF
 */
router.get('/payments/pdf', async (req, res) => {
  try {
    const payments = [
      { id: 'PAY001', locataire: 'Jean', montant: '500K GNF', date: '01/10/2025', statut: 'Payé' },
      { id: 'PAY002', locataire: 'Marie', montant: '450K GNF', date: '02/10/2025', statut: 'Payé' }
    ];

    const result = await UniversalExportService.generatePDF(
      'Rapport Paiements',
      payments,
      { filename: `paiements-${Date.now()}.pdf` }
    );

    UniversalExportService.createDownloadResponse(res, result.buffer, result.filename, result.contentType);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exports/payments/excel
 * Exporter paiements en Excel
 */
router.get('/payments/excel', async (req, res) => {
  try {
    const payments = [
      { ID: 'PAY001', Locataire: 'Jean', Montant: 500000, Date: '01/10/2025', Statut: 'Payé' },
      { ID: 'PAY002', Locataire: 'Marie', Montant: 450000, Date: '02/10/2025', Statut: 'Payé' }
    ];

    const result = await UniversalExportService.generateExcel(
      'Paiements',
      payments,
      { filename: `paiements-${Date.now()}.xlsx`, sheetName: 'Paiements' }
    );

    UniversalExportService.createDownloadResponse(res, result.buffer, result.filename, result.contentType);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📊 EXPORT RAPPORTS
// ============================================================

/**
 * GET /api/exports/reports/fiscal-pdf
 * Exporter rapport fiscal en PDF
 */
router.get('/reports/fiscal-pdf', async (req, res) => {
  try {
    const { year } = req.query;
    
    const reportData = {
      'Année': year || 2025,
      'Revenus totaux': '50M GNF',
      'Charges': '15M GNF',
      'Bénéfice net': '35M GNF',
      'Taux occupation': '95%'
    };

    const result = await UniversalExportService.generatePDF(
      `Rapport Fiscal ${year || 2025}`,
      reportData,
      { filename: `rapport-fiscal-${year}-${Date.now()}.pdf` }
    );

    UniversalExportService.createDownloadResponse(res, result.buffer, result.filename, result.contentType);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exports/reports/fiscal-excel
 * Exporter rapport fiscal en Excel
 */
router.get('/reports/fiscal-excel', async (req, res) => {
  try {
    const { year } = req.query;

    const reportData = [
      { Mois: 'Janvier', Revenus: 4000000, Charges: 1200000, Bénéfice: 2800000 },
      { Mois: 'Février', Revenus: 4200000, Charges: 1300000, Bénéfice: 2900000 },
      { Mois: 'Mars', Revenus: 4100000, Charges: 1250000, Bénéfice: 2850000 }
    ];

    const result = await UniversalExportService.generateExcel(
      `Fiscal ${year || 2025}`,
      reportData,
      { filename: `fiscal-${year}-${Date.now()}.xlsx`, sheetName: 'Mensuel' }
    );

    UniversalExportService.createDownloadResponse(res, result.buffer, result.filename, result.contentType);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📋 EXPORT CONTRATS
// ============================================================

/**
 * GET /api/exports/contracts/pdf/:contractId
 * Exporter contrat spécifique en PDF
 */
router.get('/contracts/pdf/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contractData = {
      'Contrat ID': contractId,
      'Propriétaire': 'Jean Diallo',
      'Locataire': 'Marie Camara',
      'Propriété': 'Villa Matam',
      'Loyer': '500K GNF',
      'Durée': '12 mois',
      'Date début': '01/10/2024',
      'Statut': 'Actif'
    };

    const result = await UniversalExportService.generatePDF(
      `Contrat ${contractId}`,
      contractData,
      { filename: `contrat-${contractId}-${Date.now()}.pdf` }
    );

    UniversalExportService.createDownloadResponse(res, result.buffer, result.filename, result.contentType);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📋 EXPORT MULTI-FORMAT
// ============================================================

/**
 * GET /api/exports/multi?type=properties&formats=pdf,excel,csv
 * Exporter en plusieurs formats à la fois
 */
router.get('/multi', async (req, res) => {
  try {
    const { type, formats = 'pdf' } = req.query;
    const formatArray = formats.split(',').map(f => f.trim());

    let data;
    let title;

    switch (type) {
      case 'properties':
        data = [
          { Reference: '#001', Titre: 'Villa Matam', Secteur: 'Matam', Prix: '6M GNF' },
          { Reference: '#002', Titre: 'T3 Dixinn', Secteur: 'Dixinn', Prix: '2M GNF' }
        ];
        title = 'Propriétés';
        break;
      case 'payments':
        data = [
          { ID: 'PAY001', Locataire: 'Jean', Montant: 500000, Statut: 'Payé' },
          { ID: 'PAY002', Locataire: 'Marie', Montant: 450000, Statut: 'Payé' }
        ];
        title = 'Paiements';
        break;
      default:
        return res.status(400).json({ error: 'Type non reconnu' });
    }

    const results = await UniversalExportService.exportMultiple(title, data, formatArray);

    // Retourner métadonnées
    res.json({
      success: true,
      title,
      type,
      formats: Object.keys(results),
      files: Object.entries(results).reduce((acc, [fmt, data]) => {
        acc[fmt] = {
          filename: data.filename,
          size: data.buffer.length,
          contentType: data.contentType
        };
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 📋 LIST & MANAGE
// ============================================================

/**
 * GET /api/exports/list
 * Lister fichiers exportés
 */
router.get('/list', (req, res) => {
  try {
    const files = UniversalExportService.listExports();
    res.json({ success: true, count: files.length, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/exports/cleanup
 * Nettoyer fichiers anciens
 */
router.post('/cleanup', (req, res) => {
  try {
    const { daysOld = 7 } = req.body;
    UniversalExportService.cleanupOldFiles(daysOld);
    res.json({ success: true, message: `Fichiers > ${daysOld} jours supprimés` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
