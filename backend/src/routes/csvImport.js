/**
 * CSV Import API Routes
 * Handles file uploads and processes multi-year payment history
 *
 * Endpoints:
 *  POST /api/csv-import/payments - Upload CSV file
 *  POST /api/csv-import/payments-raw - Import JSON array
 *  GET /api/csv-import/runs - List import runs
 *  GET /api/csv-import/runs/:id - Get import details
 */

const fs = require('fs');
const path = require('path');
const { importPaymentsCsv, getImportRunStats, getRecentImportRuns } = require('../import/paymentsCsvMultiYear');

/**
 * Create CSV import routes
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Router} Express router with CSV import endpoints
 */
function createCsvImportRoutes(pool) {
  const express = require('express');
  const router = express.Router();

  /**
   * POST /api/csv-import/payments
   * Upload and import payment CSV file
   *
   * Body: multipart/form-data with 'file' field
   *
   * Success Response:
   * {
   *   "success": true,
   *   "import_run_id": 123,
   *   "message": "Import completed",
   *   "stats": {
   *     "rowsTotal": 100,
   *     "rowsInserted": 98,
   *     "rowsDuplicated": 2,
   *     "rowsFailed": 0,
   *     "errors": []
   *   }
   * }
   *
   * Error Response:
   * {
   *   "success": false,
   *   "error": "File upload failed",
   *   "details": "Error message"
   * }
   */
  router.post('/payments', async (req, res) => {
    try {
      // Check if file is in request body (as multipart would be handled by multer middleware)
      // For MVP, we'll accept CSV content directly in body or from file parameter
      const csvContent = req.body.csvContent || req.body.csv;
      const fileName = req.body.fileName || 'import-' + Date.now() + '.csv';

      if (!csvContent) {
        return res.status(400).json({
          success: false,
          error: 'No CSV content provided',
          details: 'Send CSV data in csvContent field or upload a file',
        });
      }

      // Create temporary file from content
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const tempFilePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(tempFilePath, csvContent);

      try {
        // Process CSV import
        const stats = await importPaymentsCsv(pool, fileName, tempFilePath);

        // Get import run ID from import_runs table
        const runResult = await pool.query(
          `SELECT id FROM import_runs WHERE source_file=$1 ORDER BY created_at DESC LIMIT 1`,
          [fileName]
        );

        const importRunId = runResult.rows[0]?.id;

        // Clean up temp file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        return res.json({
          success: true,
          import_run_id: importRunId,
          message: 'Import completed successfully',
          stats: stats,
        });
      } catch (importError) {
        // Clean up temp file on error
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        throw importError;
      }
    } catch (error) {
      console.error('CSV import error:', error);
      return res.status(500).json({
        success: false,
        error: 'CSV import failed',
        details: error.message || 'Unknown error during import',
      });
    }
  });

  /**
   * POST /api/csv-import/payments-raw
   * Import payments from raw JSON array
   *
   * Body: {
   *   "payments": [
   *     {
   *       "owner_name": "Name",
   *       "site_name": "Site",
   *       "tenant_name": "Tenant",
   *       "date": "2024-01-01",
   *       "amount": 50000,
   *       "mode": "cash",
   *       ...
   *     }
   *   ]
   * }
   *
   * Returns: ImportStats object
   */
  router.post('/payments-raw', async (req, res) => {
    try {
      const { payments } = req.body;

      if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payments data',
          details: 'Expected array of payment objects in "payments" field',
        });
      }

      // Convert payments array to CSV format
      if (!payments[0] || typeof payments[0] !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment object',
          details: 'Each payment must be an object',
        });
      }

      // Build CSV header from first record
      const headers = Object.keys(payments[0]);
      const csvLines = [headers.join(',')];

      // Add data rows
      for (const payment of payments) {
        const row = headers.map((h) => {
          const val = payment[h];
          // Escape quotes and wrap in quotes if contains comma
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"')) {
            return '"' + str.replace(/"/g, '""') + '"';
          }
          return str;
        });
        csvLines.push(row.join(','));
      }

      const csvContent = csvLines.join('\n');

      // Create temporary file
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = 'raw-import-' + Date.now() + '.csv';
      const tempFilePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(tempFilePath, csvContent);

      try {
        // Process import
        const stats = await importPaymentsCsv(pool, fileName, tempFilePath);

        // Get import run ID
        const runResult = await pool.query(
          `SELECT id FROM import_runs WHERE source_file=$1 ORDER BY created_at DESC LIMIT 1`,
          [fileName]
        );

        const importRunId = runResult.rows[0]?.id;

        // Cleanup
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          // Ignore
        }

        return res.json({
          success: true,
          import_run_id: importRunId,
          message: 'Raw import completed successfully',
          stats: stats,
        });
      } catch (importError) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          // Ignore
        }
        throw importError;
      }
    } catch (error) {
      console.error('Raw import error:', error);
      return res.status(500).json({
        success: false,
        error: 'Raw import failed',
        details: error.message || 'Unknown error',
      });
    }
  });

  /**
   * GET /api/csv-import/runs
   * List recent import runs
   *
   * Query Parameters:
   *  - limit: number (default: 50, max: 1000)
   *
   * Returns:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": 123,
   *       "source_file": "filename.csv",
   *       "rows_total": 100,
   *       "rows_inserted": 98,
   *       "rows_duplicated": 2,
   *       "rows_failed": 0,
   *       "created_at": "2024-01-01T10:00:00Z",
   *       "errors": []
   *     }
   *   ]
   * }
   */
  router.get('/runs', async (req, res) => {
    try {
      let limit = parseInt(req.query.limit || 50);
      limit = Math.min(Math.max(limit, 1), 1000);

      const result = await getRecentImportRuns(pool, limit);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get import runs error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve import runs',
        details: error.message,
      });
    }
  });

  /**
   * GET /api/csv-import/runs/:id
   * Get specific import run details
   *
   * Returns: ImportRunStats
   */
  router.get('/runs/:id', async (req, res) => {
    try {
      const importId = parseInt(req.params.id);

      if (!importId || isNaN(importId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid import ID',
        });
      }

      const stats = await getImportRunStats(pool, importId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Import run not found',
          details: `No import with ID ${importId}`,
        });
      }

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get import stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve import stats',
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = { createCsvImportRoutes };
