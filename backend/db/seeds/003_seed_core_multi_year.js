/**
 * Seed data for core multi-year schema
 * Initializes sample owners, sites, tenants, and contracts
 */

module.exports = {
  seed: async (pool) => {
    // Check if data already seeded
    const ownerCount = await pool.query('SELECT COUNT(*) FROM owners');
    if (parseInt(ownerCount.rows[0].count) > 0) {
      console.log('✅ Core data already seeded, skipping...');
      return;
    }

    // ============================================
    // Insert Owners
    // ============================================

    const ownerResult = await pool.query(
      `INSERT INTO owners (name) 
       VALUES 
         ('Propriétaire A'),
         ('Propriétaire B'),
         ('Propriétaire C')
       RETURNING id, name`
    );
    console.log('✅ Seeded owners:', ownerResult.rowCount);
    const owners = ownerResult.rows;

    // ============================================
    // Insert Sites
    // ============================================

    const siteResult = await pool.query(
      `INSERT INTO sites (name, owner_id, address, city) 
       VALUES 
         ('Immeuble Matam', $1, 'Rue de Matam, Conakry', 'Conakry'),
         ('Résidence Kaloum', $2, 'Avenue de Kaloum, Conakry', 'Conakry'),
         ('Building Ratoma', $3, 'Route de Ratoma, Conakry', 'Conakry')
       RETURNING id, name`,
      [owners[0].id, owners[1].id, owners[2].id]
    );
    console.log('✅ Seeded sites:', siteResult.rowCount);
    const sites = siteResult.rows;

    // ============================================
    // Insert Tenants
    // ============================================

    const tenantResult = await pool.query(
      `INSERT INTO tenants (full_name, phone, email, current_site_id, active) 
       VALUES 
         ('TENSA STERENIHAST', '+224 620 00 00 00', 'tensa@example.com', $1, true),
         ('Mohamed Diallo', '+224 621 11 11 11', 'diallo@example.com', $2, true),
         ('Fatou Jallow', '+224 622 22 22 22', 'jallow@example.com', $3, true),
         ('Lansana Kone', '+224 623 33 33 33', 'kone@example.com', $1, true),
         ('Aïssatou Sy', '+224 624 44 44 44', 'sy@example.com', $2, true)
       RETURNING id, full_name`,
      [sites[0].id, sites[1].id, sites[2].id]
    );
    console.log('✅ Seeded tenants:', tenantResult.rowCount);
    const tenants = tenantResult.rows;

    // ============================================
    // Insert Contracts
    // ============================================

    const contractResult = await pool.query(
      `INSERT INTO contracts (tenant_id, site_id, owner_id, ref, monthly_rent, periodicity, start_date, end_date, status, frequency_note) 
       VALUES 
         ($1, $2, $3, 'REF001', 7390000, 'monthly', '2024-01-01', '2025-12-31', 'active', 'du 05 au 10'),
         ($4, $5, $6, 'REF002', 5000000, 'quarterly', '2024-06-01', '2026-05-31', 'active', 'Fin du mois'),
         ($7, $8, $9, 'REF003', 3000000, 'monthly', '2023-03-15', '2025-03-14', 'terminated', 'le 15'),
         ($1, $2, $3, 'REF004', 4500000, 'semiannual', '2025-01-01', '2026-12-31', 'active', 'Janvier et Juillet')
       RETURNING id, ref`,
      [
        tenants[0].id, sites[0].id, owners[0].id,
        tenants[1].id, sites[1].id, owners[1].id,
        tenants[2].id, sites[2].id, owners[2].id,
        tenants[0].id, sites[0].id, owners[0].id,
      ]
    );
    console.log('✅ Seeded contracts:', contractResult.rowCount);
    const contracts = contractResult.rows;

    // ============================================
    // Insert Sample Payments (2023-2025)
    // ============================================

    const paymentResult = await pool.query(
      `INSERT INTO payments 
       (external_ref, tenant_id, owner_id, site_id, contract_id, paid_at, amount, currency, mode, allocation, channel, raw_hash) 
       VALUES 
         ('OM-2023-001', $1, $2, $3, $4, '2023-01-15 10:30:00', 7390000, 'GNF', 'orange_money', 'Loyer Janvier', 'OM:466673', 'hash_001'),
         ('OM-2023-002', $1, $2, $3, $4, '2023-02-10 14:15:00', 7390000, 'GNF', 'orange_money', 'Loyer Février', 'OM:466673', 'hash_002'),
         ('VIR-2023-003', $5, $6, $7, $8, '2023-03-05 09:00:00', 5000000, 'GNF', 'virement', 'Loyer Q1', 'BIG', 'hash_003'),
         ('CASH-2024-001', $1, $2, $3, $4, '2024-01-20 16:45:00', 7390000, 'GNF', 'cash', 'Loyer Janvier', 'Guichet', 'hash_004'),
         ('OM-2024-002', $1, $2, $3, $4, '2024-02-08 11:20:00', 7390000, 'GNF', 'orange_money', 'Loyer Février', 'OM:466673', 'hash_005'),
         ('OM-2024-003', $1, $2, $3, $4, '2024-03-12 13:10:00', 7390000, 'GNF', 'orange_money', 'Loyer Mars', 'OM:466673', 'hash_006'),
         ('VIR-2024-004', $5, $6, $7, $8, '2024-06-01 10:30:00', 5000000, 'GNF', 'virement', 'Loyer Q2', 'BIG', 'hash_007'),
         ('OM-2025-001', $1, $2, $3, $4, '2025-01-15 12:00:00', 7390000, 'GNF', 'orange_money', 'Loyer Janvier', 'OM:466673', 'hash_008'),
         ('OM-2025-002', $1, $2, $3, $4, '2025-02-18 15:30:00', 7390000, 'GNF', 'orange_money', 'Loyer Février', 'OM:466673', 'hash_009')
       RETURNING id, external_ref`,
      [
        tenants[0].id, owners[0].id, sites[0].id, contracts[0].id,
        tenants[1].id, owners[1].id, sites[1].id, contracts[1].id,
      ]
    );
    console.log('✅ Seeded payments:', paymentResult.rowCount);

    // ============================================
    // Insert Payment Status Year Snapshots
    // ============================================

    const statusResult = await pool.query(
      `INSERT INTO payment_status_year 
       (contract_id, year, period_from, period_to, due_amount, paid_amount, arrears_amount, pressure_level) 
       VALUES 
         ($1, 2023, '2023-01-01', '2023-12-31', 88680000, 14780000, 73900000, 'pressure'),
         ($1, 2024, '2024-01-01', '2024-12-31', 88680000, 22170000, 66510000, 'reminder'),
         ($1, 2025, '2025-01-01', '2025-12-31', 88680000, 14780000, 73900000, 'none'),
         ($2, 2023, '2023-01-01', '2023-12-31', 20000000, 5000000, 15000000, 'reminder'),
         ($2, 2024, '2024-01-01', '2024-12-31', 20000000, 5000000, 15000000, 'reminder'),
         ($2, 2025, '2025-01-01', '2025-12-31', 20000000, 0, 20000000, 'pressure')
       RETURNING id`,
      [contracts[0].id, contracts[1].id]
    );
    console.log('✅ Seeded payment status snapshots:', statusResult.rowCount);

    // ============================================
    // Insert Operations Notes
    // ============================================

    const noteResult = await pool.query(
      `INSERT INTO ops_notes (tenant_id, site_id, note, op_type) 
       VALUES 
         ($1, $2, 'Rappel loyer février non payé', 'reminder'),
         ($1, $2, 'Appel téléphonique pour relance', 'follow_up'),
         ($3, $4, 'Renouvellement contrat discuté', 'negotiation'),
         ($3, $4, 'Résiliation acceptée', 'closure')
       RETURNING id`,
      [tenants[0].id, sites[0].id, tenants[2].id, sites[2].id]
    );
    console.log('✅ Seeded operations notes:', noteResult.rowCount);

    console.log('✅ All core seed data inserted successfully');
  },
};
