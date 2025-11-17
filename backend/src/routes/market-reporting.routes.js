/**
 * 📊 Market Reporting Routes
 * PDF exports, CSV downloads, scheduled reports
 * backend/src/routes/market-reporting.routes.js
 */

const express = require('express');
const router = express.Router();
const MarketReportingService = require('../services/market-reporting.service');
const { authenticate } = require('../middleware/auth.middleware');
const fs = require('fs');
const path = require('path');

// Ensure reports directory exists
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * POST /api/reporting/market-analysis
 * Generate market analysis report
 */
router.post('/market-analysis', authenticate, async (req, res) => {
  try {
    const { location } = req.body;

    const reportPath = await MarketReportingService.generateMarketAnalysisReport(location);

    res.json({
      success: true,
      message: 'Rapport marché généré',
      report: {
        path: reportPath,
        filename: path.basename(reportPath),
        generatedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Erreur génération rapport:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur génération rapport',
      error: err.message
    });
  }
});

/**
 * POST /api/reporting/competitive-analysis/:propertyId
 * Generate competitive analysis report
 */
router.post('/competitive-analysis/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const reportPath = await MarketReportingService.generateCompetitiveAnalysisReport(propertyId);

    res.json({
      success: true,
      message: 'Rapport compétitif généré',
      report: {
        path: reportPath,
        filename: path.basename(reportPath),
        generatedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Erreur rapport compétitif:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur rapport compétitif',
      error: err.message
    });
  }
});

/**
 * GET /api/reporting/export/market-data
 * Export market data to CSV
 */
router.get('/export/market-data', authenticate, async (req, res) => {
  try {
    const csvPath = await MarketReportingService.exportAnalyticsToCSV('market');

    res.download(csvPath, 'market_data.csv', (err) => {
      if (err) {
        console.error('Erreur download:', err);
      }
      // Cleanup after download
      fs.unlink(csvPath, (unlinkErr) => {
        if (unlinkErr) console.error('Erreur cleanup:', unlinkErr);
      });
    });
  } catch (err) {
    console.error('Erreur export CSV:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur export données',
      error: err.message
    });
  }
});

/**
 * GET /api/reporting/export/properties
 * Export properties data to CSV
 */
router.get('/export/properties', authenticate, async (req, res) => {
  try {
    const csvPath = await MarketReportingService.exportAnalyticsToCSV('properties');

    res.download(csvPath, 'properties.csv', (err) => {
      if (err) {
        console.error('Erreur download:', err);
      }
      fs.unlink(csvPath, (unlinkErr) => {
        if (unlinkErr) console.error('Erreur cleanup:', unlinkErr);
      });
    });
  } catch (err) {
    console.error('Erreur export propriétés:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur export propriétés',
      error: err.message
    });
  }
});

/**
 * GET /api/reporting/export/performance
 * Export performance data to CSV
 */
router.get('/export/performance', authenticate, async (req, res) => {
  try {
    const csvPath = await MarketReportingService.exportAnalyticsToCSV('performance');

    res.download(csvPath, 'performance.csv', (err) => {
      if (err) {
        console.error('Erreur download:', err);
      }
      fs.unlink(csvPath, (unlinkErr) => {
        if (unlinkErr) console.error('Erreur cleanup:', unlinkErr);
      });
    });
  } catch (err) {
    console.error('Erreur export performance:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur export performance',
      error: err.message
    });
  }
});

/**
 * POST /api/reporting/generate-scheduled
 * Generate all scheduled reports
 */
router.post('/generate-scheduled', authenticate, async (req, res) => {
  try {
    const reports = await MarketReportingService.generateScheduledReports();

    res.json({
      success: true,
      message: 'Rapports programmés générés',
      reports: reports.map(r => ({
        type: r.type,
        filename: path.basename(r.path),
        timestamp: r.timestamp
      }))
    });
  } catch (err) {
    console.error('Erreur rapports programmés:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur génération rapports',
      error: err.message
    });
  }
});

/**
 * GET /api/reporting/list
 * List available reports
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    const files = fs.readdirSync(reportsDir);
    
    const reports = files
      .filter(f => f.endsWith('.pdf') || f.endsWith('.csv'))
      .map(f => ({
        filename: f,
        size: fs.statSync(path.join(reportsDir, f)).size,
        created: fs.statSync(path.join(reportsDir, f)).birthtimeMs
      }))
      .sort((a, b) => b.created - a.created);

    res.json({
      success: true,
      reports: reports.slice(0, 20) // Last 20 reports
    });
  } catch (err) {
    console.error('Erreur list rapports:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur listage rapports',
      error: err.message
    });
  }
});

/**
 * GET /api/reporting/download/:filename
 * Download specific report
 */
router.get('/download/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(reportsDir, filename);

    // Security: ensure file is within reports directory
    if (!filePath.startsWith(reportsDir)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    res.download(filePath, filename);
  } catch (err) {
    console.error('Erreur download rapport:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur téléchargement',
      error: err.message
    });
  }
});

/**
 * DELETE /api/reporting/cleanup
 * Clean up old reports (older than 30 days)
 */
router.delete('/cleanup', authenticate, async (req, res) => {
  try {
    const files = fs.readdirSync(reportsDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.birthtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    res.json({
      success: true,
      message: `${deletedCount} rapports supprimés`,
      deleted: deletedCount
    });
  } catch (err) {
    console.error('Erreur cleanup:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur nettoyage',
      error: err.message
    });
  }
});

module.exports = router;
