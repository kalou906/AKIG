/**
 * Import routes for multi-year CSV data
 * Handles payment history import with deduplication
 */

const express = require('express');
const pool = require('../db');
const crypto = require('crypto');

const router = express.Router();

/**
 * Generate hash for deduplication
 * @param {Object} row - Payment row data
 * @returns {string} - SHA256 hash
 */
function generatePaymentHash(row) {
  const normalized = `${row.tenant_id}|${row.paid_at}|${row.amount}|${row.mode}`.toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * POST /api/import/payments
 * Import payment history from CSV
 * Body: { rows: [{tenant_id, paid_at, amount, mode, channel, allocation}...] }
 */
router.post('/payments', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows, source_file } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid rows data' });
    }

    // Start transaction
    await client.query('BEGIN');

    let inserted = 0;
    let duplicated = 0;
    let failed = 0;
    const errors = [];

    // Create import run record
    const importResult = await client.query(
      `INSERT INTO import_runs (source_file, rows_total, rows_inserted, rows_duplicated, rows_failed, status)
       VALUES ($1, $2, 0, 0, 0, 'processing') RETURNING id`,
      [source_file || 'csv_upload', rows.length]
    );

    const importRunId = importResult.rows[0].id;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const {
          external_ref,
          tenant_id,
          owner_id,
          site_id,
          contract_id,
          paid_at,
          amount,
          mode,
          allocation,
          channel,
        } = row;

        // Validation
        if (!tenant_id || !paid_at || !amount) {
          failed++;
          errors.push(`Row ${i + 1}: Missing required fields (tenant_id, paid_at, amount)`);
          continue;
        }

        // Generate hash for deduplication
        const raw_hash = generatePaymentHash(row);

        // Check if duplicate
        const duplicateCheck = await client.query(
          'SELECT id FROM payments WHERE raw_hash = $1 LIMIT 1',
          [raw_hash]
        );

        if (duplicateCheck.rows.length > 0) {
          duplicated++;
          continue;
        }

        // Insert payment
        await client.query(
          `INSERT INTO payments (external_ref, tenant_id, owner_id, site_id, contract_id, paid_at, amount, mode, allocation, channel, raw_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            external_ref,
            tenant_id,
            owner_id,
            site_id,
            contract_id,
            paid_at,
            amount,
            mode,
            allocation,
            channel,
            raw_hash,
          ]
        );

        inserted++;
      } catch (error) {
        failed++;
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    // Update import run with results
    await client.query(
      `UPDATE import_runs 
       SET rows_inserted = $1, rows_duplicated = $2, rows_failed = $3, status = 'completed'
       WHERE id = $4`,
      [inserted, duplicated, failed, importRunId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      import_run_id: importRunId,
      summary: {
        total: rows.length,
        inserted,
        duplicated,
        failed,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing payments:', error);
    res.status(500).json({ error: 'Failed to import payments', details: error.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/import/runs
 * Get import audit trail
 */
router.get('/runs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM import_runs ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching import runs:', error);
    res.status(500).json({ error: 'Failed to fetch import runs' });
  }
});

/**
 * GET /api/import/runs/:id
 * Get single import run details
 */
router.get('/runs/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM import_runs WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Import run not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching import run:', error);
    res.status(500).json({ error: 'Failed to fetch import run' });
  }
});

module.exports = router;
