/**
 * 🏪 Service Place de Marché Immobilière
 * Plateforme d'annonces et transactions entre agences
 */

const { Pool } = require('pg');
const logger = require('./logger');

class ServicePlaceMarché {
  /**
   * Publier annonce sur place de marché
   */
  static async publierAnnonce(donnéesAnnonce) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const {
        agenceId,
        propriétéId,
        titre,
        description,
        prix,
        typePropriété,
        surface,
        localisation,
        chambres,
        images,
        caractéristiques,
        commission
      } = donnéesAnnonce;

      const requête = `
        INSERT INTO annonces_place_marché 
        (
          agence_id, propriété_id, titre, description, prix, 
          type_propriété, surface, localisation, chambres, 
          images, caractéristiques, commission, 
          publiée_à, expire_à, statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
                NOW(), NOW() + INTERVAL '90 jours', 'ACTIVE')
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        agenceId,
        propriétéId,
        titre,
        description,
        prix,
        typePropriété,
        surface,
        localisation,
        chambres,
        JSON.stringify(images || []),
        JSON.stringify(caractéristiques || {}),
        commission || 3
      ]);

      await pool.end();

      logger.info(`🏪 Annonce publiée: ${résultat.rows[0].id} par agence ${agenceId}`);

      return {
        statut: 'succès',
        annonce: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur publication annonce:', erreur);
      throw erreur;
    }
  }

  /**
   * Rechercher annonces sur place de marché
   */
  static async rechercherAnnonces(critères) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const {
        localisation,
        prixMin,
        prixMax,
        typePropriété,
        chambresMin,
        surface,
        page = 1,
        limite = 20
      } = critères;

      let requête = `
        SELECT 
          a.id, a.titre, a.prix, a.surface, a.chambres,
          a.type_propriété, a.localisation, a.description,
          a.images, a.caractéristiques,
          ag.nom as agence_nom,
          COUNT(i.id) as intérêts,
          ROUND(AVG(c.note), 1) as note_agence
        FROM annonces_place_marché a
        JOIN agences ag ON a.agence_id = ag.id
        LEFT JOIN intérêts i ON a.id = i.annonce_id
        LEFT JOIN commentaires c ON ag.id = c.agence_id
        WHERE a.statut = 'ACTIVE'
      `;

      const paramètres = [];

      if (localisation) {
        requête += ` AND a.localisation ILIKE $${paramètres.length + 1}`;
        paramètres.push(`%${localisation}%`);
      }

      if (prixMin) {
        requête += ` AND a.prix >= $${paramètres.length + 1}`;
        paramètres.push(prixMin);
      }

      if (prixMax) {
        requête += ` AND a.prix <= $${paramètres.length + 1}`;
        paramètres.push(prixMax);
      }

      if (typePropriété) {
        requête += ` AND a.type_propriété = $${paramètres.length + 1}`;
        paramètres.push(typePropriété);
      }

      if (chambresMin) {
        requête += ` AND a.chambres >= $${paramètres.length + 1}`;
        paramètres.push(chambresMin);
      }

      requête += `
        GROUP BY a.id, a.titre, a.prix, a.surface, a.chambres, 
                 a.type_propriété, a.localisation, a.description,
                 a.images, a.caractéristiques, ag.nom
        ORDER BY a.publiée_à DESC
        LIMIT $${paramètres.length + 1} OFFSET $${paramètres.length + 2}
      `;

      paramètres.push(limite);
      paramètres.push((page - 1) * limite);

      const résultat = await pool.query(requête, paramètres);

      // Compter total
      let requêteTotal = 'SELECT COUNT(*) FROM annonces_place_marché WHERE statut = \'ACTIVE\'';
      const paramètresTotal = [];

      if (localisation) {
        requêteTotal += ` AND localisation ILIKE $${paramètresTotal.length + 1}`;
        paramètresTotal.push(`%${localisation}%`);
      }

      const résultatTotal = await pool.query(requêteTotal, paramètresTotal);
      await pool.end();

      return {
        statut: 'succès',
        annonces: résultat.rows,
        pagination: {
          page,
          limite,
          total: parseInt(résultatTotal.rows[0].count),
          pages: Math.ceil(parseInt(résultatTotal.rows[0].count) / limite)
        }
      };
    } catch (erreur) {
      logger.erreur('Erreur recherche annonces:', erreur);
      throw erreur;
    }
  }

  /**
   * Exprimer intérêt pour annonce
   */
  static async exprimerIntérêt(annoncéId, agenceId, message) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        INSERT INTO intérêts_place_marché 
        (annonce_id, agence_intéressée_id, message, créé_à, statut)
        VALUES ($1, $2, $3, NOW(), 'NOUVEAU')
        RETURNING *
      `;

      const résultat = await pool.query(requête, [annoncéId, agenceId, message]);

      await pool.end();

      logger.info(`💌 Intérêt exprimé pour annonce ${annoncéId} par agence ${agenceId}`);

      return {
        statut: 'succès',
        intérêt: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur expression intérêt:', erreur);
      throw erreur;
    }
  }

  /**
   * Créer transaction (accord entre agences)
   */
  static async créerTransaction(donnéesTransaction) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const {
        annoncéId,
        agenceVendeuse,
        agenceAcheteur,
        prixAccordé,
        commission,
        conditions
      } = donnéesTransaction;

      const requête = `
        INSERT INTO transactions_place_marché 
        (
          annonce_id, agence_vendeuse_id, agence_acheteuse_id,
          prix_accordé, commission, conditions, 
          créée_à, statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'EN_NÉGOCIATION')
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        annoncéId,
        agenceVendeuse,
        agenceAcheteur,
        prixAccordé,
        commission,
        JSON.stringify(conditions || {})
      ]);

      await pool.end();

      logger.info(`🤝 Transaction créée entre agences ${agenceVendeuse} et ${agenceAcheteur}`);

      return {
        statut: 'succès',
        transaction: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur création transaction:', erreur);
      throw erreur;
    }
  }

  /**
   * Finaliser transaction
   */
  static async finaliserTransaction(transactionId, signatureVendeuse, signatureAcheteur) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        UPDATE transactions_place_marché
        SET 
          signature_vendeuse = $1,
          signature_acheteuse = $2,
          statut = 'FINALISÉE',
          finalisée_à = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        signatureVendeuse,
        signatureAcheteur,
        transactionId
      ]);

      await pool.end();

      logger.info(`✅ Transaction ${transactionId} finalisée`);

      return {
        statut: 'succès',
        transaction: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur finalisation transaction:', erreur);
      throw erreur;
    }
  }

  /**
   * Évaluer agence (système de notation)
   */
  static async évaluerAgence(agenceId, note, commentaire, agenceÉvaluatrice) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        INSERT INTO évaluations_agences 
        (agence_id, note, commentaire, agence_évaluatrice_id, créée_à)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        agenceId,
        Math.max(1, Math.min(5, note)), // Entre 1 et 5
        commentaire,
        agenceÉvaluatrice
      ]);

      await pool.end();

      logger.info(`⭐ Agence ${agenceId} évaluée: ${note}/5`);

      return {
        statut: 'succès',
        évaluation: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur évaluation agence:', erreur);
      throw erreur;
    }
  }

  /**
   * Obtenir statistiques agence
   */
  static async obtenirStatistiquesAgence(agenceId) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT 
          a.id,
          a.nom,
          COUNT(DISTINCT ann.id) as annonces_publiées,
          COUNT(DISTINCT i.id) as intérêts_reçus,
          COUNT(DISTINCT t.id) as transactions_complétées,
          ROUND(AVG(e.note), 1) as note_moyenne,
          ROUND(SUM(CASE WHEN t.statut = 'FINALISÉE' THEN t.prix_accordé ELSE 0 END), 0) as volume_transactions
        FROM agences a
        LEFT JOIN annonces_place_marché ann ON a.id = ann.agence_id
        LEFT JOIN intérêts_place_marché i ON ann.id = i.annonce_id
        LEFT JOIN transactions_place_marché t ON ann.id = t.annonce_id
        LEFT JOIN évaluations_agences e ON a.id = e.agence_id
        WHERE a.id = $1
        GROUP BY a.id, a.nom
      `;

      const résultat = await pool.query(requête, [agenceId]);
      await pool.end();

      return {
        statut: 'succès',
        statistiques: résultat.rows[0] || {}
      };
    } catch (erreur) {
      logger.erreur('Erreur statistiques agence:', erreur);
      throw erreur;
    }
  }

  /**
   * Calculer commission automatiquement
   */
  static calculerCommission(prix, pourcentageCommission = 3) {
    return Math.round(prix * (pourcentageCommission / 100));
  }

  /**
   * Générer contrat de transaction
   */
  static générerContrat(transaction) {
    const contrat = `
CONTRAT DE TRANSACTION IMMOBILIÈRE
==================================

Date: ${new Date().toLocaleDateString('fr-FR')}
Numéro Transaction: ${transaction.id}

AGENCE VENDEUSE: ${transaction.agence_vendeuse}
AGENCE ACHETEUSE: ${transaction.agence_acheteuse}

PRIX ACCORDÉ: ${(transaction.prix_accordé / 1000000).toFixed(1)}M GNF
COMMISSION: ${transaction.commission}%
MONTANT COMMISSION: ${this.calculerCommission(transaction.prix_accordé, transaction.commission)}M GNF

CONDITIONS:
${JSON.stringify(transaction.conditions, null, 2)}

SIGNATURES NUMÉRIQUES:
Vendeuse: ${transaction.signature_vendeuse ? '✓ Signée' : '✗ Non signée'}
Acheteuse: ${transaction.signature_acheteuse ? '✓ Signée' : '✗ Non signée'}

Ce contrat est généré automatiquement par la plateforme AKIG.
    `;

    return contrat;
  }
}

module.exports = ServicePlaceMarché;
