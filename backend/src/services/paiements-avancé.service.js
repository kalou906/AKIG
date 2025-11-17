/**
 * 💳 Service Paiements Avancé avec Escrow
 * Gestion sécurisée des transactions, multiples paiements, escrow
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const logger = require('./logger');

class ServicePaiementsAvancé {
  /**
   * Créer transaction de paiement
   */
  static async créerTransaction(donnéesPaiement) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const {
        acheteurId,
        vendeureId,
        montant,
        typePaiement, // 'SEUL' | 'ÉCHELONNÉ' | 'ESCROW'
        devise = 'GNF',
        description,
        métadonnées = {}
      } = donnéesPaiement;

      const numéroTransaction = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const requête = `
        INSERT INTO transactions_paiements 
        (
          numéro_transaction, acheteur_id, vendeur_id, montant, 
          devise, type_paiement, description, métadonnées,
          créée_à, statut, expire_à
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'EN_ATTENTE', 
                NOW() + INTERVAL '24 heures')
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        numéroTransaction,
        acheteurId,
        vendeureId,
        montant,
        devise,
        typePaiement,
        description,
        JSON.stringify(métadonnées)
      ]);

      await pool.end();

      logger.info(`💳 Transaction paiement créée: ${numéroTransaction} - ${montant} ${devise}`);

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
   * Créer paiement échelonné
   */
  static async créerPaiementÉchelonné(donnéesEchelonné) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const {
        transactionId,
        montantTotal,
        nombreÉchéances,
        fréquence = 'MENSUELLE', // 'HEBDOMADAIRE' | 'MENSUELLE' | 'TRIMESTRIELLE'
        tauxIntérêt = 0
      } = donnéesEchelonné;

      const montantParÉchéance = Math.round(montantTotal / nombreÉchéances);
      const intérêtTotal = Math.round(montantTotal * (tauxIntérêt / 100));
      const montantAvecIntérêt = montantTotal + intérêtTotal;

      let requête = `
        INSERT INTO paiements_échelonnés 
        (transaction_id, montant_total, nombre_échéances, montant_par_échéance, 
         fréquence, taux_intérêt, créée_à, statut)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'ACTIVE')
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        transactionId,
        montantAvecIntérêt,
        nombreÉchéances,
        montantParÉchéance,
        fréquence,
        tauxIntérêt
      ]);

      // Créer les échéances
      const requêteÉchéances = `
        INSERT INTO échéances_paiement 
        (paiement_échelonné_id, numéro_échéance, montant, date_échéance, statut)
        VALUES
      `;

      const valeurs = [];
      let compteur = 1;

      for (let i = 0; i < nombreÉchéances; i++) {
        const dateÉchéance = this.calculerDateÉchéance(fréquence, i);
        valeurs.push(`(${résultat.rows[0].id}, ${i + 1}, ${montantParÉchéance}, '${dateÉchéance}', 'EN_ATTENTE')`);
      }

      await pool.query(requêteÉchéances + valeurs.join(','));

      await pool.end();

      logger.info(`📅 Plan échelonné créé: ${nombreÉchéances} échéances pour ${montantAvecIntérêt} GNF`);

      return {
        statut: 'succès',
        paiementÉchelonné: résultat.rows[0],
        montantAvecIntérêt
      };
    } catch (erreur) {
      logger.erreur('Erreur création paiement échelonné:', erreur);
      throw erreur;
    }
  }

  /**
   * Traiter paiement (appel API passerelle)
   */
  static async traiterPaiement(transactionId, méthodePaiement, détails) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      // Simuler appel passerelle paiement
      const statutPaiement = await this.vérifierAvecPasserelle(méthodePaiement, détails);

      const requête = `
        UPDATE transactions_paiements
        SET 
          méthode_paiement = $1,
          statut = $2,
          traité_à = NOW(),
          référence_passerelle = $3
        WHERE id = $4
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        méthodePaiement,
        statutPaiement ? 'APPROUVÉ' : 'REJETÉ',
        `REF-${crypto.randomBytes(8).toString('hex')}`,
        transactionId
      ]);

      await pool.end();

      logger.info(`✅ Paiement traité: ${transactionId} - ${statutPaiement ? 'APPROUVÉ' : 'REJETÉ'}`);

      return {
        statut: 'succès',
        transaction: résultat.rows[0],
        approuvé: statutPaiement
      };
    } catch (erreur) {
      logger.erreur('Erreur traitement paiement:', erreur);
      throw erreur;
    }
  }

  /**
   * Créer compte ESCROW (tiers de confiance)
   */
  static async créerCompteEscrow(donnéesEscrow) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const {
        transactionId,
        montant,
        conditions,
        agentEscrow
      } = donnéesEscrow;

      const requête = `
        INSERT INTO comptes_escrow 
        (transaction_id, montant, conditions_libération, agent_escrow, créé_à, statut)
        VALUES ($1, $2, $3, $4, NOW(), 'EN_RETENUE')
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        transactionId,
        montant,
        JSON.stringify(conditions),
        agentEscrow
      ]);

      await pool.end();

      logger.info(`🔒 Compte ESCROW créé: ${montant} GNF en retenue`);

      return {
        statut: 'succès',
        escrow: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur création ESCROW:', erreur);
      throw erreur;
    }
  }

  /**
   * Libérer ESCROW (fonds bloqués)
   */
  static async libérerEscrow(escrowId, conditionVérifiée = true) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      if (!conditionVérifiée) {
        const requête = `
          UPDATE comptes_escrow
          SET 
            statut = 'REMBOURSÉ',
            libéré_à = NOW()
          WHERE id = $1
          RETURNING *
        `;

        const résultat = await pool.query(requête, [escrowId]);
        await pool.end();

        logger.info(`↩️ ESCROW remboursé: ${escrowId}`);

        return {
          statut: 'succès',
          escrow: résultat.rows[0],
          action: 'REMBOURSEMENT'
        };
      }

      const requête = `
        UPDATE comptes_escrow
        SET 
          statut = 'LIBÉRÉ',
          libéré_à = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const résultat = await pool.query(requête, [escrowId]);
      await pool.end();

      logger.info(`✅ ESCROW libéré: ${escrowId}`);

      return {
        statut: 'succès',
        escrow: résultat.rows[0],
        action: 'LIBÉRATION'
      };
    } catch (erreur) {
      logger.erreur('Erreur libération ESCROW:', erreur);
      throw erreur;
    }
  }

  /**
   * Appliquer remise/promotion
   */
  static async appliquerRemise(transactionId, codeRemise) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      // Vérifier validité remise
      const requêteRemise = `
        SELECT * FROM remises_promotions 
        WHERE code = $1 AND actif = true AND expire_à > NOW()
      `;

      const résultatRemise = await pool.query(requêteRemise, [codeRemise]);

      if (résultatRemise.rows.length === 0) {
        await pool.end();
        return {
          statut: 'erreur',
          message: 'Code remise invalide ou expiré'
        };
      }

      const remise = résultatRemise.rows[0];

      // Appliquer remise à transaction
      const requête = `
        UPDATE transactions_paiements
        SET 
          remise_appliquée = $1,
          montant_remise = CASE 
            WHEN $2 = 'POURCENTAGE' THEN ROUND(montant * ($3 / 100))
            ELSE $3
          END,
          montant_final = CASE 
            WHEN $2 = 'POURCENTAGE' THEN montant - ROUND(montant * ($3 / 100))
            ELSE montant - $3
          END
        WHERE id = $4
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        codeRemise,
        remise.type_remise,
        remise.valeur,
        transactionId
      ]);

      await pool.end();

      logger.info(`🎁 Remise appliquée: ${codeRemise} sur transaction ${transactionId}`);

      return {
        statut: 'succès',
        transaction: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur application remise:', erreur);
      throw erreur;
    }
  }

  /**
   * Générer reçu/facture
   */
  static générerReçu(transaction) {
    const reçu = `
╔══════════════════════════════════════╗
║        REÇU DE PAIEMENT AKIG         ║
╚══════════════════════════════════════╝

📄 Numéro Transaction: ${transaction.numéro_transaction}
📅 Date: ${new Date(transaction.créée_à).toLocaleDateString('fr-FR')}
⏰ Heure: ${new Date(transaction.créée_à).toLocaleTimeString('fr-FR')}

┌──────────────────────────────────────┐
│ DÉTAILS TRANSACTION                   │
└──────────────────────────────────────┘

Montant Initial:     ${(transaction.montant / 1000000).toFixed(1)}M GNF
Remise:              ${(transaction.montant_remise / 1000000).toFixed(1)}M GNF
Montant Final:       ${((transaction.montant - (transaction.montant_remise || 0)) / 1000000).toFixed(1)}M GNF

Type de Paiement:    ${transaction.type_paiement}
Méthode:             ${transaction.méthode_paiement || 'Non spécifiée'}
Statut:              ${transaction.statut}

┌──────────────────────────────────────┐
│ INFORMATIONS PARTIES                  │
└──────────────────────────────────────┘

Acheteur ID:         ${transaction.acheteur_id}
Vendeur ID:          ${transaction.vendeur_id}

Référence Passerelle: ${transaction.référence_passerelle || 'N/A'}

═══════════════════════════════════════
        Merci pour votre paiement!
      Plateforme AKIG - Guinée
═══════════════════════════════════════
    `;

    return reçu;
  }

  /**
   * Calculer date d'échéance
   */
  static calculerDateÉchéance(fréquence, index) {
    const date = new Date();
    switch(fréquence) {
      case 'HEBDOMADAIRE':
        date.setDate(date.getDate() + (7 * (index + 1)));
        break;
      case 'MENSUELLE':
        date.setMonth(date.getMonth() + (index + 1));
        break;
      case 'TRIMESTRIELLE':
        date.setMonth(date.getMonth() + (3 * (index + 1)));
        break;
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Vérifier avec passerelle (simulation)
   */
  static async vérifierAvecPasserelle(méthodePaiement, détails) {
    // Simulation d'appel passerelle
    return Math.random() > 0.05; // 95% de succès
  }

  /**
   * Générer rapport transactions
   */
  static async générerRapportTransactions(critères) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const { dateDebut, dateFin, statut } = critères;

      let requête = `
        SELECT 
          COUNT(*) as nombre_transactions,
          SUM(montant) as montant_total,
          AVG(montant) as montant_moyen,
          COUNT(CASE WHEN statut = 'APPROUVÉ' THEN 1 END) as approuvées,
          COUNT(CASE WHEN statut = 'REJETÉ' THEN 1 END) as rejetées,
          type_paiement
        FROM transactions_paiements
        WHERE créée_à BETWEEN $1 AND $2
      `;

      const paramètres = [dateDebut, dateFin];

      if (statut) {
        requête += ` AND statut = $${paramètres.length + 1}`;
        paramètres.push(statut);
      }

      requête += ' GROUP BY type_paiement';

      const résultat = await pool.query(requête, paramètres);
      await pool.end();

      return {
        statut: 'succès',
        rapport: résultat.rows
      };
    } catch (erreur) {
      logger.erreur('Erreur rapport transactions:', erreur);
      throw erreur;
    }
  }
}

module.exports = ServicePaiementsAvancé;
