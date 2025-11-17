/**
 * CSV Import Utility - Multi-Year Payment Processing
 * Advanced CSV parsing with format normalization, deduplication, and arrears calculation
 *
 * Features:
 * - Flexible CSV column mapping (French/English headers)
 * - Format normalization (amounts, dates, phones, modes)
 * - SHA256 deduplication by payment details
 * - Referential integrity with upserts (owners, sites, tenants, contracts)
 * - Automatic multi-year arrears calculation
 * - Complete import audit trail
 */

const fs = require('fs');
const { createReadStream } = fs;
const { parse } = require('csv-parse');
const crypto = require('crypto');

/**
 * Normalize amount string to number
 * Handles: "1 500 000", "1,500,000", "1500000"
 *
 * @param {string} s Amount string
 * @returns {number} Parsed number
 */
function normAmount(s) {
  return Number(String(s).replace(/[^\d]/g, '')) || 0;
}

/**
 * Normalize phone number to Guinea format
 * Handles: "+224612345678", "612345678", "212345678", "+224 61 234 56 78"
 *
 * @param {string} s Phone string
 * @returns {string|null} "+224 XXXXXXXXX" format or null
 */
function normPhone(s) {
  if (!s) return null;
  const digits = String(s).replace(/[^\d+]/g, '');
  if (!digits) return null;

  // Already has +224
  if (digits.startsWith('+224')) {
    return digits;
  }

  // Just digits - could be missing country code
  if (digits.length === 8 || digits.length === 9) {
    return `+224${digits}`;
  }

  // Has other country code - keep as is
  if (digits.startsWith('+')) {
    return digits;
  }

  return `+224${digits}`;
}

/**
 * Normalize payment mode to canonical value
 * Handles: "espèce", "cash", "orange money", "OM", "marchand", "virement", "banque"
 *
 * @param {string} s Mode string
 * @returns {string} Canonical mode value ('cash'|'orange_money'|'marchand'|'virement'|'autre')
 */
function normMode(s) {
  const v = s.toLowerCase();

  if (v.includes('esp') || v.includes('cash')) return 'cash';
  if (v.includes('marchand')) return 'marchand';
  if (v.includes('orange') || v.includes('om')) return 'orange_money';
  if (v.includes('vir') || v.includes('banque')) return 'virement';

  return 'autre';
}

/**
 * Normalize date string to Date object
 * Handles: "YYYY-MM-DD", "DD/MM/YYYY", "YYYY-MM-DD HH:mm"
 *
 * @param {string} s Date string
 * @returns {Date} Parsed Date object
 */
function normDate(s) {
  const t = s.trim();

  // ISO format with optional time
  if (/\d{4}-\d{2}-\d{2}/.test(t)) {
    return new Date(t);
  }

  // French format DD/MM/YYYY
  const m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) {
    return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  }

  // Fallback to Date parser
  return new Date(t);
}

/**
 * Generate SHA256 hash for deduplication
 * Includes: source file + normalized payment details
 * This prevents exact duplicate payments from being imported twice
 *
 * @param {Object} r CSV row
 * @param {string} sourceFile Source filename for file-specific deduplication
 * @returns {string} SHA256 hash hex string
 */
function hashRow(r, sourceFile) {
  const str = `${sourceFile}|${r.tenant_name}|${r.owner_name}|${r.site_name}|${r.paid_at}|${r.amount}|${r.mode}|${r.allocation || ''}|${r.external_ref || ''}`;
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Upsert owner record
 * Creates owner if doesn't exist, updates if does
 *
 * @param {Object} pool PostgreSQL pool
 * @param {string} owner Owner name
 * @returns {Promise<number>} Owner ID
 */
async function upsertOwner(pool, owner) {
  const q = await pool.query(
    `INSERT INTO owners(name) VALUES($1)
     ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
     RETURNING id`,
    [owner.trim()]
  );
  return q.rows[0].id;
}

/**
 * Upsert site record
 * Creates site if doesn't exist, updates owner_id if does
 *
 * @param {Object} pool PostgreSQL pool
 * @param {string} site Site name
 * @param {number} ownerId Owner ID
 * @returns {Promise<number>} Site ID
 */
async function upsertSite(pool, site, ownerId) {
  const q = await pool.query(
    `INSERT INTO sites(name, owner_id) VALUES($1,$2)
     ON CONFLICT (name) DO UPDATE SET owner_id=EXCLUDED.owner_id
     RETURNING id`,
    [site.trim(), ownerId]
  );
  return q.rows[0].id;
}

/**
 * Upsert tenant record
 * Creates tenant if doesn't exist, updates phone if does
 *
 * @param {Object} pool PostgreSQL pool
 * @param {string} name Tenant full name
 * @param {string|null} phone Normalized phone number
 * @param {number} siteId Current site ID
 * @returns {Promise<number>} Tenant ID
 */
async function upsertTenant(pool, name, phone, siteId) {
  const q = await pool.query(
    `INSERT INTO tenants(full_name, phone, current_site_id, active)
     VALUES($1,$2,$3,true)
     ON CONFLICT (full_name, current_site_id) 
     DO UPDATE SET phone=COALESCE(EXCLUDED.phone, tenants.phone), active=true
     RETURNING id`,
    [name.trim(), phone, siteId]
  );
  return q.rows[0].id;
}

/**
 * Ensure contract exists for tenant
 * - First tries to find contract by reference
 * - Then tries to find most recent contract for tenant+site
 * - Creates new active contract if none found
 *
 * @param {Object} pool PostgreSQL pool
 * @param {number} tenantId Tenant ID
 * @param {number} siteId Site ID
 * @param {number} ownerId Owner ID
 * @param {string} ref Optional contract reference
 * @returns {Promise<number>} Contract ID
 */
async function ensureContract(pool, tenantId, siteId, ownerId, ref) {
  // Try to find by reference first
  if (ref?.trim()) {
    const e = await pool.query(
      `SELECT id FROM contracts WHERE ref=$1 LIMIT 1`,
      [ref.trim()]
    );
    if (e.rows[0]) return e.rows[0].id;
  }

  // Try to find most recent contract for tenant+site
  const existing = await pool.query(
    `SELECT id FROM contracts WHERE tenant_id=$1 AND site_id=$2 ORDER BY start_date DESC NULLS LAST LIMIT 1`,
    [tenantId, siteId]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  // Create new active contract
  const created = await pool.query(
    `INSERT INTO contracts(tenant_id, site_id, owner_id, status, periodicity, start_date, ref)
     VALUES($1,$2,$3,'active','monthly',CURRENT_DATE,$4) 
     RETURNING id`,
    [tenantId, siteId, ownerId, ref || null]
  );
  return created.rows[0].id;
}

/**
 * Main CSV import function
 * Processes CSV file line-by-line with deduplication and referential integrity
 *
 * @param {Object} pool PostgreSQL connection pool
 * @param {string} sourceFile Source filename for import tracking
 * @param {string} serverPath Full path to CSV file
 * @returns {Promise<Object>} Import statistics
 */
async function importPaymentsCsv(pool, sourceFile, serverPath) {
  // Create import run record
  const run = await pool.query(
    `INSERT INTO import_runs(source_file, status) VALUES($1,'processing') RETURNING id`,
    [sourceFile]
  );
  const runId = run.rows[0].id;

  const stats = {
    rowsTotal: 0,
    rowsInserted: 0,
    rowsDuplicated: 0,
    rowsFailed: 0,
    errors: [],
  };

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    createReadStream(serverPath)
      .pipe(parser)
      .on('data', async (row) => {
        stats.rowsTotal++;
        const rowNum = stats.rowsTotal;

        try {
          // Map CSV columns to normalized row
          const r = {
            tenant_name: row['Nom locataire'] || row['Locataire'] || row['Tenant'] || '',
            tenant_phone: row['Téléphone'] || row['Phone'] || '',
            owner_name: row['Propriétaire'] || row['Owner'] || '',
            site_name: row['Immeuble/Site'] || row['Site'] || '',
            contract_ref: row['Contrat'] || row['Ref contrat'] || '',
            paid_at: row['Date paiement'] || row['Date'] || '',
            amount: row['Montant'] || row['Amount'] || '0',
            mode: row['Mode paiement'] || row['Mode'] || '',
            allocation: row['Affectation'] || row['Allocation'] || '',
            channel: row['Canal'] || row['Channel'] || '',
            comment: row['Commentaire'] || row['Note'] || '',
            external_ref: row['Ref externe'] || row['Transaction'] || '',
          };

          // Validate required fields
          if (!r.tenant_name?.trim()) {
            throw new Error('Missing tenant name');
          }
          if (!r.owner_name?.trim()) {
            throw new Error('Missing owner name');
          }
          if (!r.site_name?.trim()) {
            throw new Error('Missing site name');
          }
          if (!r.paid_at?.trim()) {
            throw new Error('Missing payment date');
          }

          // Normalize values
          const amount = normAmount(r.amount);
          if (amount <= 0) {
            throw new Error('Invalid amount');
          }

          const phone = normPhone(r.tenant_phone);
          const paidAt = normDate(r.paid_at);
          const mode = normMode(r.mode);
          const rawHash = hashRow(r, sourceFile);

          // Check for duplicates
          const dup = await pool.query(
            `SELECT id FROM payments WHERE raw_hash=$1`,
            [rawHash]
          );
          if (dup.rows[0]) {
            stats.rowsDuplicated++;
            return;
          }

          // Upsert referential data
          const ownerId = await upsertOwner(pool, r.owner_name);
          const siteId = await upsertSite(pool, r.site_name, ownerId);
          const tenantId = await upsertTenant(pool, r.tenant_name, phone, siteId);
          const contractId = await ensureContract(pool, tenantId, siteId, ownerId, r.contract_ref);

          // Insert payment
          await pool.query(
            `INSERT INTO payments(external_ref, tenant_id, owner_id, site_id, contract_id, paid_at, amount, mode, allocation, channel, comment, raw_hash, source_file)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [
              r.external_ref || null,
              tenantId,
              ownerId,
              siteId,
              contractId,
              paidAt,
              amount,
              mode,
              r.allocation || null,
              r.channel || null,
              r.comment || null,
              rawHash,
              sourceFile,
            ]
          );

          stats.rowsInserted++;
        } catch (error) {
          stats.rowsFailed++;
          stats.errors.push({
            row: rowNum,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
      .on('error', (err) => reject(err))
      .on('end', async () => {
        try {
          // Update import run with results
          await pool.query(
            `UPDATE import_runs 
             SET finished_at=NOW(), rows_total=$1, rows_inserted=$2, rows_duplicated=$3, rows_failed=$4, status=$5 
             WHERE id=$6`,
            [
              stats.rowsTotal,
              stats.rowsInserted,
              stats.rowsDuplicated,
              stats.rowsFailed,
              stats.rowsFailed === 0 ? 'completed' : 'completed_with_errors',
              runId,
            ]
          );

          // Recompute arrears for all years
          await recomputeArrearsAllYears(pool);

          resolve(stats);
        } catch (error) {
          reject(error);
        }
      });
  });
}

/**
 * Recompute arrears (impayés) for all active contracts across all payment years
 * This is called after each import to ensure payment_status_year is up-to-date
 *
 * Process:
 * 1. Find all distinct payment years in database
 * 2. For each active contract, compute:
 *    - due_amount: monthly_rent * 12 months
 *    - paid_amount: sum of payments in that year
 *    - arrears_amount: max(0, due - paid)
 *    - arrears_months: floor(arrears / monthly_rent)
 *    - pressure_level: 'pressure' if >1 month or >2M arrears, 'reminder' if 1 month, 'none' otherwise
 *
 * @param {Object} pool PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function recomputeArrearsAllYears(pool) {
  // Get all distinct years from payments
  const yearsRes = await pool.query(
    `SELECT DISTINCT date_part('year', paid_at)::INT AS y FROM payments ORDER BY y`
  );
  const years = yearsRes.rows.map((r) => Number(r.y)) || [new Date().getFullYear()];

  // Get all active contracts
  const contracts = await pool.query(
    `SELECT id, monthly_rent, periodicity FROM contracts WHERE status='active'`
  );

  // For each contract and year, compute arrears
  for (const c of contracts.rows) {
    const rent = Number(c.monthly_rent) || 0;

    // Due amount is always 12 months worth (annual basis)
    const dueMonths = 12;
    const dueAmount = rent * dueMonths;

    for (const y of years) {
      // Sum all payments for this contract in this year
      const paidRes = await pool.query(
        `SELECT COALESCE(SUM(amount),0)::NUMERIC as sum FROM payments 
         WHERE contract_id=$1 AND date_part('year', paid_at)::INT=$2`,
        [c.id, y]
      );
      const paid = Number(paidRes.rows[0].sum) || 0;

      // Calculate arrears
      const arrears = Math.max(0, dueAmount - paid);
      const arrearsMonths = rent > 0 ? Math.floor(arrears / rent) : 0;

      // Determine pressure level for collection follow-up
      const pressure =
        arrearsMonths > 1 || arrears > 2_000_000
          ? 'pressure'
          : arrearsMonths === 1
            ? 'reminder'
            : 'none';

      // Upsert yearly snapshot
      await pool.query(
        `INSERT INTO payment_status_year(contract_id, year, period_from, period_to, due_amount, paid_amount, arrears_amount, arrears_months, pressure_level, last_update)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (contract_id, year) DO UPDATE SET
           period_from=$3, period_to=$4, due_amount=$5, paid_amount=$6, arrears_amount=$7, arrears_months=$8, pressure_level=$9, last_update=NOW()`,
        [
          c.id,
          y,
          new Date(`${y}-01-01`),
          new Date(`${y}-12-31`),
          dueAmount,
          paid,
          arrears,
          arrearsMonths,
          pressure,
        ]
      );
    }
  }
}

/**
 * Get import statistics for a specific import run
 *
 * @param {Object} pool PostgreSQL connection pool
 * @param {number} runId Import run ID
 * @returns {Promise<Object>} Import run details or null
 */
async function getImportRunStats(pool, runId) {
  const result = await pool.query(
    `SELECT id, source_file, rows_total, rows_inserted, rows_duplicated, rows_failed, status, created_at, finished_at
     FROM import_runs WHERE id=$1`,
    [runId]
  );
  return result.rows[0] || null;
}

/**
 * Get recent import runs with pagination
 *
 * @param {Object} pool PostgreSQL connection pool
 * @param {number} limit Maximum number of runs to return
 * @returns {Promise<Array>} Array of import runs
 */
async function getRecentImportRuns(pool, limit = 50) {
  const result = await pool.query(
    `SELECT id, source_file, rows_total, rows_inserted, rows_duplicated, rows_failed, status, created_at, finished_at
     FROM import_runs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  importPaymentsCsv,
  recomputeArrearsAllYears,
  getImportRunStats,
  getRecentImportRuns,
};
