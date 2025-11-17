/**
 * CSV Import API Routes
 * Handles payment CSV import operations and import run history
 */

const express = require('express');
const { importPaymentsCsv } = require('../import/paymentsCsvMultiYear');

const router = express.Router();

/**
 * POST /api/imports/payments/csv
 * Import payments from CSV file
 *
 * Body:
 * {
 *   "sourceFile": "string",   // filename for tracking
 *   "serverPath": "string"    // full path to CSV file on server
 * }
 *
 * Success Response:
 * {
 *   "ok": true,
 *   "import_run_id": 123,
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
 *   "error": "IMPORT_FAILED",
 *   "message": "Error description"
 * }
 */
router.post('/payments/csv', async (req, res) => {
  try {
    const { sourceFile, serverPath } = req.body;

    if (!sourceFile || !serverPath) {
      return res.status(400).json({
        error: 'MISSING_INPUT',
        message: 'sourceFile and serverPath are required',
      });
    }

    const pool = req.app.get('pool');
    if (!pool) {
      return res.status(500).json({
        error: 'DB_NOT_AVAILABLE',
        message: 'Database connection not available',
      });
    }

    // Run import
    const stats = await importPaymentsCsv(pool, sourceFile, serverPath);

    // Get the import run ID from database
    const runResult = await pool.query(
      `SELECT id FROM import_runs WHERE source_file=$1 ORDER BY created_at DESC LIMIT 1`,
      [sourceFile]
    );

    const importRunId = runResult.rows[0]?.id;

    res.json({
      ok: true,
      import_run_id: importRunId,
      stats: stats,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({
      error: 'IMPORT_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error during import',
    });
  }
});

/**
 * GET /api/imports/runs
 * List all import runs with latest first
 *
 * Query Parameters:
 *   - limit: number (default: 50, max: 1000)
 *
 * Response: Array of import_runs rows
 * [
 *   {
 *     "id": 123,
 *     "source_file": "filename.csv",
 *     "rows_total": 100,
 *     "rows_inserted": 98,
 *     "rows_duplicated": 2,
 *     "rows_failed": 0,
 *     "status": "completed",
 *     "created_at": "2024-01-15T10:00:00Z",
 *     "finished_at": "2024-01-15T10:05:30Z"
 *   }
 * ]
 */
router.get('/runs', async (req, res) => {
  try {
    const pool = req.app.get('pool');
    if (!pool) {
      return res.status(500).json({
        error: 'DB_NOT_AVAILABLE',
        message: 'Database connection not available',
      });
    }

    let limit = parseInt(req.query.limit || 50);
    limit = Math.min(Math.max(limit, 1), 1000);

    const result = await pool.query(
      `SELECT id, source_file, rows_total, rows_inserted, rows_duplicated, rows_failed, status, created_at, finished_at
       FROM import_runs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get import runs error:', error);
    res.status(500).json({
      error: 'QUERY_FAILED',
      message: error instanceof Error ? error.message : 'Failed to retrieve import runs',
    });
  }
});

module.exports = router;
