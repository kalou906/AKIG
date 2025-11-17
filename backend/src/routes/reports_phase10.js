/**
 * reports.js - Phase 10
 * Routes pour 6 types de rapports
 * 6 endpoints: paiements, fiscal, occupation, revenus/dépenses, réconciliation, honoraires
 */

const express = require('express');
const router = express.Router();
const ReportService = require('../services/ReportService');
const { authenticateJWT, authorize } = require('../middleware/auth');

/**
 * GET /api/reports/payments
 * Rapport des paiements
 */
router.get('/payments', authenticateJWT, async (req, res) => {
  try {
    const { date_from, date_to, proprietaire_id, statut, format = 'json' } = req.query;

    const data = await ReportService.getPaymentReport({
      date_from,
      date_to,
      proprietaire_id: proprietaire_id ? parseInt(proprietaire_id) : null,
      statut
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport_paiements.csv');
      res.send(ReportService.exportToCSV('Paiements', data));
    } else if (format === 'pdf') {
      const pdf = await ReportService.exportToPDF('Paiements', data, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport_paiements.pdf');
      res.send(pdf);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/fiscal
 * Rapport fiscal
 */
router.get('/fiscal', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const { annee, proprietaire_id, format = 'json' } = req.query;

    const data = await ReportService.getFiscalReport({
      annee: annee ? parseInt(annee) : null,
      proprietaire_id: proprietaire_id ? parseInt(proprietaire_id) : null
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport_fiscal.csv');
      res.send(ReportService.exportToCSV('Fiscal', data));
    } else if (format === 'pdf') {
      const pdf = await ReportService.exportToPDF('Fiscal', data, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport_fiscal.pdf');
      res.send(pdf);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/occupancy
 * Rapport d'occupation
 */
router.get('/occupancy', authenticateJWT, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    const data = await ReportService.getOccupancyReport({
      date_from,
      date_to
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/income-expense
 * Rapport revenus/dépenses
 */
router.get('/income-expense', authenticateJWT, async (req, res) => {
  try {
    const { date_from, date_to, proprietaire_id, format = 'json' } = req.query;

    const data = await ReportService.getIncomeExpenseReport({
      date_from,
      date_to,
      proprietaire_id: proprietaire_id ? parseInt(proprietaire_id) : null
    });

    if (format === 'csv') {
      const csv = `Catégorie,Montant\nRévenus,${data.revenus}\nDépenses,${data.depenses}\nRésultat,${data.resultat}`;
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } else if (format === 'pdf') {
      const pdfData = [
        { categorie: 'Revenus', montant: data.revenus },
        { categorie: 'Dépenses', montant: data.depenses },
        { categorie: 'Résultat', montant: data.resultat }
      ];
      const pdf = await ReportService.exportToPDF('Revenus/Dépenses', pdfData, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdf);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/reconciliation
 * Rapport réconciliation bancaire
 */
router.get('/reconciliation', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const { date_from, date_to, format = 'json' } = req.query;

    const data = await ReportService.getReconciliationReport({
      date_from,
      date_to
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport_reconciliation.csv');
      res.send(ReportService.exportToCSV('Réconciliation', data));
    } else if (format === 'pdf') {
      const pdf = await ReportService.exportToPDF('Réconciliation Bancaire', data, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdf);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/fees
 * Rapport honoraires
 */
router.get('/fees', authenticateJWT, async (req, res) => {
  try {
    const { date_from, date_to, proprietaire_id, format = 'json' } = req.query;

    const data = await ReportService.getFeeReport({
      date_from,
      date_to,
      proprietaire_id: proprietaire_id ? parseInt(proprietaire_id) : null
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport_honoraires.csv');
      res.send(ReportService.exportToCSV('Honoraires', data));
    } else if (format === 'pdf') {
      const pdf = await ReportService.exportToPDF('Honoraires', data, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdf);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
