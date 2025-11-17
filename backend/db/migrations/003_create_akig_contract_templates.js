/**
 * Migration: Create akig_contract_templates table
 * Stores contract templates with variables for dynamic generation
 */

module.exports = {
  up: async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS akig_contract_templates (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('location', 'gerance', 'audition', 'reference')),
        titre TEXT NOT NULL,
        contenu TEXT NOT NULL,
        version TEXT DEFAULT '1.0',
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index on type for faster filtering
      CREATE INDEX IF NOT EXISTS idx_akig_contract_templates_type ON akig_contract_templates(type);

      -- Create index on actif for finding active templates
      CREATE INDEX IF NOT EXISTS idx_akig_contract_templates_actif ON akig_contract_templates(actif);

      -- Create unique index on type + version for active templates
      CREATE UNIQUE INDEX IF NOT EXISTS idx_akig_contract_templates_type_version_active
        ON akig_contract_templates(type, version) WHERE actif = true;
    `);
    console.log('✅ Created akig_contract_templates table');
  },

  down: async (pool) => {
    await pool.query(`
      DROP INDEX IF EXISTS idx_akig_contract_templates_type_version_active;
      DROP INDEX IF EXISTS idx_akig_contract_templates_actif;
      DROP INDEX IF EXISTS idx_akig_contract_templates_type;
      DROP TABLE IF EXISTS akig_contract_templates;
    `);
    console.log('✅ Dropped akig_contract_templates table');
  },
};
