const db = require('../config/database');

/**
 * GET /api/dashboard
 * Dashboard stats
 */
exports.getStats = async (req, res, next) => {
  try {
    // Stats générales
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM biens) as total_biens,
        (SELECT COUNT(*) FROM biens WHERE statut = 'disponible') as biens_disponibles,
        (SELECT COUNT(*) FROM biens WHERE statut = 'loue') as biens_loues,
        (SELECT COUNT(*) FROM locataires) as total_locataires,
        (SELECT COUNT(*) FROM proprietaires) as total_proprietaires,
        (SELECT COUNT(*) FROM contrats_location WHERE statut = 'actif') as contrats_actifs,
        (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE date_paiement >= CURRENT_DATE - INTERVAL '30 days' AND statut_validation = 'valide') as ca_30j
    `);

    // Dernières activités
    const activites = await db.query(`
      SELECT 'Paiement' as type, p.date_paiement as date, l.nom_prenoms as detail, p.montant
      FROM paiements p
      JOIN contrats_location c ON p.contrat_location_id = c.id
      JOIN locataires l ON c.locataire_id = l.id
      WHERE p.statut_validation = 'valide'
      ORDER BY p.date_paiement DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
      activites: activites.rows
    });
  } catch (error) {
    next(error);
  }
};
