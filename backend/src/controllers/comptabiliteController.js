const db = require('../config/database');

/**
 * GET /api/comptabilite/stats
 * Stats comptables
 */
exports.getStats = async (req, res, next) => {
  try {
    const { mois, annee } = req.query;
    
    const result = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN statut_validation = 'valide' THEN montant ELSE 0 END), 0) as total_encaisse,
        COALESCE(SUM(CASE WHEN statut_validation = 'en_attente' THEN montant ELSE 0 END), 0) as total_attente,
        COUNT(CASE WHEN statut_validation = 'valide' THEN 1 END) as nb_valides,
        COUNT(CASE WHEN statut_validation = 'en_attente' THEN 1 END) as nb_attente
      FROM paiements
      WHERE EXTRACT(MONTH FROM date_paiement) = $1 AND EXTRACT(YEAR FROM date_paiement) = $2
    `, [mois || new Date().getMonth() + 1, annee || new Date().getFullYear()]);

    // Commission AKIG (15%)
    const commission = Math.round(result.rows[0].total_encaisse * 0.15);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        commission_akig: commission,
        net_proprietaires: result.rows[0].total_encaisse - commission
      }
    });
  } catch (error) {
    next(error);
  }
};
