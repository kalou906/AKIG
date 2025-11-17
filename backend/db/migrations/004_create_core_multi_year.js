/**
 * Migration: Create core AKIG multi-year database schema
 * Handles owners, sites, tenants, contracts, payments across multiple years
 */

module.exports = {
  up: async (pool) => {
    // ============================================
    // REFERENTIAL TABLES
    // ============================================

    // Owners table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owners (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_owners_name ON owners(name);
    `);
    console.log('✅ Created owners table');

    // Sites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        owner_id INT REFERENCES owners(id) ON DELETE SET NULL,
        address TEXT,
        city TEXT,
        country TEXT DEFAULT 'Guinea',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner_id);
      CREATE INDEX IF NOT EXISTS idx_sites_name ON sites(name);
    `);
    console.log('✅ Created sites table');

    // Tenants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        current_site_id INT REFERENCES sites(id) ON DELETE SET NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_name_site 
        ON tenants(full_name, current_site_id);
      CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);
      CREATE INDEX IF NOT EXISTS idx_tenants_site ON tenants(current_site_id);
    `);
    console.log('✅ Created tenants table');

    // ============================================
    // CONTRACTS TABLE
    // ============================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
        site_id INT REFERENCES sites(id) ON DELETE SET NULL,
        owner_id INT REFERENCES owners(id) ON DELETE SET NULL,
        ref TEXT,
        monthly_rent BIGINT NOT NULL DEFAULT 0,
        periodicity TEXT CHECK (periodicity IN ('monthly','quarterly','semiannual','annual')) 
          DEFAULT 'monthly',
        start_date DATE NOT NULL,
        end_date DATE,
        status TEXT CHECK (status IN ('active','terminated','overdue')) 
          DEFAULT 'active',
        frequency_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_contracts_tenant_site 
        ON contracts(tenant_id, site_id);
      CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
      CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);
    `);
    console.log('✅ Created contracts table');

    // ============================================
    // PAYMENTS TABLE (Multi-year)
    // ============================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id BIGSERIAL PRIMARY KEY,
        external_ref TEXT,
        tenant_id INT REFERENCES tenants(id) ON DELETE SET NULL,
        owner_id INT REFERENCES owners(id) ON DELETE SET NULL,
        site_id INT REFERENCES sites(id) ON DELETE SET NULL,
        contract_id INT REFERENCES contracts(id) ON DELETE SET NULL,
        paid_at TIMESTAMP NOT NULL,
        amount BIGINT NOT NULL,
        currency TEXT DEFAULT 'GNF',
        mode TEXT CHECK (mode IN ('cash','orange_money','marchand','virement','autre')) 
          DEFAULT 'autre',
        allocation TEXT,
        channel TEXT,
        comment TEXT,
        raw_hash TEXT UNIQUE,
        source_file TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_payments_contract_year 
        ON payments(contract_id, paid_at);
      CREATE INDEX IF NOT EXISTS idx_payments_tenant_year 
        ON payments(tenant_id, paid_at);
      CREATE INDEX IF NOT EXISTS idx_payments_mode ON payments(mode);
      CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
    `);
    console.log('✅ Created payments table');

    // ============================================
    // PAYMENT STATUS SNAPSHOT (Yearly)
    // ============================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_status_year (
        id SERIAL PRIMARY KEY,
        contract_id INT REFERENCES contracts(id) ON DELETE CASCADE,
        year INT NOT NULL,
        period_from DATE,
        period_to DATE,
        due_amount BIGINT DEFAULT 0,
        paid_amount BIGINT DEFAULT 0,
        arrears_amount BIGINT DEFAULT 0,
        arrears_months INT DEFAULT 0,
        pressure_level TEXT CHECK (pressure_level IN ('none','reminder','pressure','closure')) 
          DEFAULT 'none',
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contract_id, year)
      );
      CREATE INDEX IF NOT EXISTS idx_psy_contract ON payment_status_year(contract_id);
      CREATE INDEX IF NOT EXISTS idx_psy_year ON payment_status_year(year);
      CREATE INDEX IF NOT EXISTS idx_psy_pressure ON payment_status_year(pressure_level);
    `);
    console.log('✅ Created payment_status_year table');

    // ============================================
    // OPERATIONS & AUDIT
    // ============================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ops_notes (
        id SERIAL PRIMARY KEY,
        tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
        site_id INT REFERENCES sites(id) ON DELETE SET NULL,
        note TEXT NOT NULL,
        op_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ops_tenant ON ops_notes(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_ops_site ON ops_notes(site_id);
      CREATE INDEX IF NOT EXISTS idx_ops_date ON ops_notes(created_at);
    `);
    console.log('✅ Created ops_notes table');

    // Import audit table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_runs (
        id BIGSERIAL PRIMARY KEY,
        source_file TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP,
        rows_total INT DEFAULT 0,
        rows_inserted INT DEFAULT 0,
        rows_duplicated INT DEFAULT 0,
        rows_failed INT DEFAULT 0,
        status TEXT CHECK (status IN ('running','done','failed')) DEFAULT 'running'
      );
      CREATE INDEX IF NOT EXISTS idx_import_status ON import_runs(status);
      CREATE INDEX IF NOT EXISTS idx_import_date ON import_runs(started_at);
    `);
    console.log('✅ Created import_runs table');

    console.log('✅ All core tables created successfully');
  },

  down: async (pool) => {
    // Drop in reverse dependency order
    await pool.query('DROP TABLE IF EXISTS import_runs;');
    await pool.query('DROP TABLE IF EXISTS ops_notes;');
    await pool.query('DROP TABLE IF EXISTS payment_status_year;');
    await pool.query('DROP TABLE IF EXISTS payments;');
    await pool.query('DROP TABLE IF EXISTS contracts;');
    await pool.query('DROP TABLE IF EXISTS tenants;');
    await pool.query('DROP TABLE IF EXISTS sites;');
    await pool.query('DROP TABLE IF EXISTS owners;');

    console.log('✅ All core tables dropped');
  },
};
