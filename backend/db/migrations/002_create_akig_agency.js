/**
 * Migration: Create akig_agency table
 * Stores agency/organization information
 */

module.exports = {
  up: async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS akig_agency (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL,
        rccm TEXT,
        adresse TEXT,
        email TEXT,
        tel_pdg TEXT,
        tel_dg TEXT,
        tel_reception TEXT,
        whatsapp TEXT,
        code_marchand TEXT,
        compte_banque TEXT,
        rib TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index on email for faster lookups
      CREATE INDEX IF NOT EXISTS idx_akig_agency_email ON akig_agency(email);

      -- Create index on RCCM for lookups
      CREATE INDEX IF NOT EXISTS idx_akig_agency_rccm ON akig_agency(rccm);
    `);
    console.log('✅ Created akig_agency table');
  },

  down: async (pool) => {
    await pool.query(`
      DROP INDEX IF EXISTS idx_akig_agency_rccm;
      DROP INDEX IF EXISTS idx_akig_agency_email;
      DROP TABLE IF EXISTS akig_agency;
    `);
    console.log('✅ Dropped akig_agency table');
  },
};
