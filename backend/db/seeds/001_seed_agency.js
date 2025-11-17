/**
 * Seed data for akig_agency
 * Initializes agency information
 */

module.exports = {
  seed: async (pool) => {
    // Check if agency already exists
    const result = await pool.query('SELECT COUNT(*) FROM akig_agency');
    if (parseInt(result.rows[0].count) > 0) {
      console.log('✅ Agency data already seeded, skipping...');
      return;
    }

    await pool.query(`
      INSERT INTO akig_agency (
        nom,
        rccm,
        adresse,
        email,
        tel_pdg,
        tel_dg,
        tel_reception,
        whatsapp,
        code_marchand,
        compte_banque,
        rib
      ) VALUES (
        'AKIG - Agence de Gestion Immobilière',
        'GN-0000001234567',
        'Conakry, Guinée',
        'contact@akig.gn',
        '+224 600000000',
        '+224 600000001',
        '+224 600000002',
        '+224 600000003',
        'AKIG001',
        'Banque Internationale de Guinée',
        'GN64 BIG 0000 0000 0000 0000 00'
      )
    `);

    console.log('✅ Seeded akig_agency data');
  },
};
