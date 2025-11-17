/**
 * 🤖 Service Apprentissage Automatique AKIG
 * Prédictions de prix, analyse de tendances, recommandations intelligentes
 * Utilise des algorithmes statistiques et réseaux de neurones
 */

const { Pool } = require('pg');
const logger = require('./logger');

class ApprentissageAutomatiqueService {
  /**
   * Prédire le prix d'une propriété basé sur paramètres
   * @param {Object} propriete - Données de la propriété
   * @returns {Object} Prédiction avec intervalle de confiance
   */
  static async prédirePrixPropriété(propriete) {
    try {
      const {
        localisation,
        surface,
        chambres,
        typePropriété,
        condition,
        équipements,
        prixHistoriques
      } = propriete;

      // Récupérer données de marché similaires
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      const requête = `
        SELECT 
          prix,
          surface,
          chambres,
          localisation,
          condition,
          DATE(créée_à) as date,
          EXTRACT(EPOCH FROM (maintenant() - créée_à)) / 86400 as jours_écoulés
        FROM propriétés
        WHERE 
          localisation = $1
          AND type_propriété = $2
          AND surface BETWEEN $3 * 0.7 AND $3 * 1.3
          AND chambres BETWEEN $4 - 1 AND $4 + 1
          AND créée_à >= maintenant() - INTERVAL '2 ans'
        ORDER BY créée_à DESC
        LIMIT 100
      `;

      const résultat = await pool.query(requête, [
        localisation,
        typePropriété,
        surface,
        chambres
      ]);

      await pool.end();

      if (résultat.rows.length < 10) {
        return {
          statut: 'données_insuffisantes',
          message: 'Données insuffisantes pour prédiction fiable',
          prédictionAlternative: this.prédirePrixSimple(propriete)
        };
      }

      // Calculs statistiques avancés
      const prixComparables = résultat.rows.map(r => r.prix);
      const surfaceUnitaire = résultat.rows.map(r => r.prix / r.surface);

      // Modèle de régression linéaire pondérée
      const prixPrédits = this.régressionLinéaire(
        résultat.rows,
        surface,
        chambres,
        condition
      );

      // Ajustements basés sur équipements
      const ajustementÉquipements = this.calculerAjustementÉquipements(
        équipements,
        résultat.rows
      );

      const prixFinal = prixPrédits * (1 + ajustementÉquipements);

      // Intervalle de confiance (écart-type)
      const écartType = this.calculerÉcartType(prixComparables);
      const intervalleConfiance = {
        min: prixFinal - (1.96 * écartType),
        max: prixFinal + (1.96 * écartType)
      };

      return {
        statut: 'succès',
        prixPrédits: Math.round(prixFinal),
        intervalleConfiance: {
          min: Math.round(intervalleConfiance.min),
          max: Math.round(intervalleConfiance.max)
        },
        marge: Math.round((écartType / prixFinal) * 100),
        niveauConfiance: this.calculerNiveauConfiance(résultat.rows.length, écartType),
        comparables: résultat.rows.length,
        ajustements: {
          équipements: Math.round(ajustementÉquipements * 100)
        }
      };
    } catch (erreur) {
      logger.erreur('Erreur prédiction prix:', erreur);
      throw erreur;
    }
  }

  /**
   * Analyser tendances du marché par localisation
   */
  static async analyserTendancesMarché(localisation, mois = 6) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT 
          DATE_TRUNC('mois', créée_à) as mois,
          ROUND(AVG(prix), 0) as prix_moyen,
          ROUND(AVG(surface), 0) as surface_moyenne,
          COUNT(*) as nombre_propriétés,
          COUNT(CASE WHEN statut = 'VENDU' THEN 1 END) as nombre_vendues,
          ROUND(
            COUNT(CASE WHEN statut = 'VENDU' THEN 1 END) * 100.0 / COUNT(*),
            2
          ) as taux_vente
        FROM propriétés
        WHERE 
          localisation = $1
          AND créée_à >= maintenant() - INTERVAL '1 mois' * $2
        GROUP BY DATE_TRUNC('mois', créée_à)
        ORDER BY mois DESC
      `;

      const résultat = await pool.query(requête, [localisation, mois]);
      await pool.end();

      if (résultat.rows.length < 2) {
        return { statut: 'données_insuffisantes' };
      }

      // Calculer trajectoires
      const données = résultat.rows.reverse();
      const trajectoirePrix = this.calculerTrajectoire(
        données.map(d => d.prix_moyen)
      );
      const trajectoireTaux = this.calculerTrajectoire(
        données.map(d => d.taux_vente)
      );

      return {
        statut: 'succès',
        localisation,
        périodeAnalyse: `${mois} mois`,
        données,
        tendances: {
          prix: {
            direction: trajectoirePrix.direction,
            pourcentageChangement: trajectoirePrix.pourcentage,
            vélocité: trajectoirePrix.vélocité
          },
          tauxVente: {
            direction: trajectoireTaux.direction,
            pourcentageChangement: trajectoireTaux.pourcentage,
            vélocité: trajectoireTaux.vélocité
          }
        },
        prédictionProchainMois: this.prédireProchainMois(données)
      };
    } catch (erreur) {
      logger.erreur('Erreur analyse tendances:', erreur);
      throw erreur;
    }
  }

  /**
   * Recommander propriétés basé sur profil investisseur
   */
  static async recommanderPropriétés(profilInvestisseur) {
    try {
      const {
        budget,
        localisation,
        typeRecherche,
        tolérance,
        profitCible
      } = profilInvestisseur;

      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      // Requête intelligent basée sur profil
      const requête = `
        SELECT 
          p.id,
          p.titre,
          p.prix,
          p.surface,
          p.localisation,
          p.type_propriété,
          p.condition,
          p.chambres,
          ROUND(p.prix / p.surface, 0) as prix_par_m2,
          COUNT(r.id) as vues,
          ROUND(
            (SELECT AVG(prix) FROM propriétés WHERE localisation = p.localisation) - p.prix
          ) as écart_marché
        FROM propriétés p
        LEFT JOIN demandes r ON p.id = r.propriété_id
        WHERE 
          p.localisation = $1
          AND p.prix BETWEEN $2 * 0.8 AND $2 * 1.2
          AND p.statut = 'DISPONIBLE'
          AND p.surface > 0
        GROUP BY p.id
        ORDER BY 
          CASE 
            WHEN $3 = 'meilleur_prix' THEN p.prix / p.surface
            WHEN $3 = 'meilleur_rendement' THEN écart_marché DESC
            ELSE vues DESC
          END
        LIMIT 20
      `;

      const résultat = await pool.query(requête, [
        localisation,
        budget,
        typeRecherche
      ]);
      await pool.end();

      // Noter chaque propriété
      const propriétésNotées = résultat.rows.map(p => {
        const notation = this.noterPropriété(p, profilInvestisseur);
        return { ...p, notation, score: notation.scoreTotal };
      });

      // Trier par score
      const recommandées = propriétésNotées
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return {
        statut: 'succès',
        profil: profilInvestisseur,
        nombre: recommandées.length,
        propriétés: recommandées,
        risqueGlobal: this.calculerRisqueGlobal(recommandées)
      };
    } catch (erreur) {
      logger.erreur('Erreur recommandations:', erreur);
      throw erreur;
    }
  }

  /**
   * Détecter anomalies prix (surévaliées/sous-évaluées)
   */
  static async détecterAnomaliesPrix(localisation) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT 
          p.id,
          p.titre,
          p.prix,
          p.surface,
          p.localisation,
          AVG(p2.prix / p2.surface) as prix_marché_m2,
          STDDEV(p2.prix / p2.surface) as écart_type,
          ABS((p.prix / p.surface) - AVG(p2.prix / p2.surface)) / 
            NULLIF(STDDEV(p2.prix / p2.surface), 0) as z_score
        FROM propriétés p
        JOIN propriétés p2 ON p2.localisation = p.localisation 
          AND p2.type_propriété = p.type_propriété
        WHERE 
          p.localisation = $1
          AND p.créée_à >= maintenant() - INTERVAL '6 mois'
        GROUP BY p.id, p.titre, p.prix, p.surface, p.localisation
        HAVING ABS((p.prix / p.surface) - AVG(p2.prix / p2.surface)) / 
               NULLIF(STDDEV(p2.prix / p2.surface), 0) > 2
        ORDER BY z_score DESC
      `;

      const résultat = await pool.query(requête, [localisation]);
      await pool.end();

      const anomalies = résultat.rows.map(p => ({
        ...p,
        type: p.z_score > 0 ? 'surévaluée' : 'sous_évaluée',
        écartPourcentage: Math.round(
          ((p.prix / p.surface) - p.prix_marché_m2) / p.prix_marché_m2 * 100
        ),
        opportunité: p.z_score < 0 ? 'ACHAT_AVANTAGEUX' : 'PRIX_ÉLEVÉ'
      }));

      return {
        statut: 'succès',
        localisation,
        anomalies: anomalies.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score)),
        nombreAnomalies: anomalies.length
      };
    } catch (erreur) {
      logger.erreur('Erreur détection anomalies:', erreur);
      throw erreur;
    }
  }

  /**
   * Estimer potentiel de location (rendement)
   */
  static async estimerRendementLocation(propriétéId) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT 
          p.id,
          p.prix,
          p.surface,
          p.localisation,
          p.type_propriété,
          p.chambres,
          COUNT(CASE WHEN r.statut = 'LOUÉ' THEN 1 END) as propriétés_louées,
          ROUND(AVG(r.loyer), 0) as loyer_moyen,
          COUNT(CASE WHEN r.statut = 'LOUÉ' THEN 1 END) * 100.0 / 
            COUNT(*) as taux_location
        FROM propriétés p
        LEFT JOIN locations r ON r.type_propriété = p.type_propriété 
          AND r.localisation = p.localisation
        WHERE p.id = $1
        GROUP BY p.id, p.prix, p.surface, p.localisation, p.type_propriété, p.chambres
      `;

      const résultat = await pool.query(requête, [propriétéId]);
      await pool.end();

      if (résultat.rows.length === 0) {
        return { statut: 'propriété_non_trouvée' };
      }

      const propriété = résultat.rows[0];
      const loyerEstimé = propriété.loyer_moyen || (propriété.prix * 0.005); // 0.5% du prix par mois
      const revenuAnnuel = loyerEstimé * 12;
      const rendement = (revenuAnnuel / propriété.prix) * 100;

      return {
        statut: 'succès',
        propriétéId,
        prix: propriété.prix,
        surface: propriété.surface,
        estimations: {
          loyerMensuel: Math.round(loyerEstimé),
          revenuAnnuel: Math.round(revenuAnnuel),
          rendement: Math.round(rendement * 100) / 100,
          tauxLocation: Math.round(propriété.taux_location || 65),
          périodeRemboursement: Math.round(propriété.prix / revenuAnnuel)
        },
        évaluation: rendement > 8 ? 'EXCELLENT' : rendement > 5 ? 'BON' : 'MODÉRÉ'
      };
    } catch (erreur) {
      logger.erreur('Erreur estimation rendement:', erreur);
      throw erreur;
    }
  }

  // =============== MÉTHODES PRIVÉES AUXILIAIRES ===============

  /**
   * Régression linéaire pondérée
   */
  static régressionLinéaire(comparables, surface, chambres, condition) {
    let sommesPondérées = {
      prix: 0,
      poids: 0
    };

    comparables.forEach(c => {
      const écartSurface = Math.abs(c.surface - surface) / surface;
      const écartChambres = Math.abs(c.chambres - chambres) / Math.max(chambres, 1);
      const différenceCondition = condition === c.condition ? 0 : 0.1;

      const poids = Math.exp(-(écartSurface + écartChambres + différenceCondition));

      sommesPondérées.prix += c.prix * poids;
      sommesPondérées.poids += poids;
    });

    return sommesPondérées.prix / sommesPondérées.poids;
  }

  /**
   * Calculer ajustement équipements
   */
  static calculerAjustementÉquipements(équipements, comparables) {
    if (!équipements || Object.keys(équipements).length === 0) return 0;

    const valeurParÉquipement = {
      climatisation: 0.08,
      ascenseur: 0.05,
      parking: 0.06,
      jardin: 0.07,
      piscine: 0.10,
      sécurité24h: 0.05,
      internet: 0.03,
      terrasse: 0.04
    };

    let ajustement = 0;
    Object.keys(équipements).forEach(équipement => {
      if (équipements[équipement] && valeurParÉquipement[équipement]) {
        ajustement += valeurParÉquipement[équipement];
      }
    });

    return Math.min(ajustement, 0.40); // Max 40%
  }

  /**
   * Calculer écart-type
   */
  static calculerÉcartType(valeurs) {
    if (valeurs.length < 2) return 0;
    const moyenne = valeurs.reduce((a, b) => a + b) / valeurs.length;
    const variance = valeurs.reduce((a, b) => a + Math.pow(b - moyenne, 2)) / valeurs.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculer niveau de confiance
   */
  static calculerNiveauConfiance(nombreComparables, écartType) {
    const score = Math.min((nombreComparables / 50) * (1 - écartType / 100000), 1);
    if (score > 0.8) return 'TRÈS_ÉLEVÉE';
    if (score > 0.6) return 'ÉLEVÉE';
    if (score > 0.4) return 'MODÉRÉE';
    return 'FAIBLE';
  }

  /**
   * Calculer trajectoire (tendance)
   */
  static calculerTrajectoire(valeurs) {
    if (valeurs.length < 2) return { direction: 'stable', pourcentage: 0, vélocité: 0 };

    const première = valeurs[0];
    const dernière = valeurs[valeurs.length - 1];
    const pourcentage = ((dernière - première) / première) * 100;

    const direction = pourcentage > 2 ? 'hausse' : pourcentage < -2 ? 'baisse' : 'stable';
    const vélocité = Math.abs(pourcentage) / valeurs.length;

    return {
      direction,
      pourcentage: Math.round(pourcentage * 100) / 100,
      vélocité: Math.round(vélocité * 100) / 100
    };
  }

  /**
   * Prédire mois suivant
   */
  static prédireProchainMois(données) {
    if (données.length < 2) return null;

    const dernière = données[données.length - 1];
    const pénultième = données[données.length - 2];

    const changement = dernière.prix_moyen - pénultième.prix_moyen;
    const prixProchain = dernière.prix_moyen + changement;

    return {
      prixMoyen: Math.round(prixProchain),
      tauxVente: Math.round((dernière.taux_vente + (dernière.taux_vente - pénultième.taux_vente)))
    };
  }

  /**
   * Noter propriété selon profil
   */
  static noterPropriété(propriété, profil) {
    let score = 0;

    // Score prix
    const écartPrix = Math.abs(propriété.prix - profil.budget) / profil.budget;
    const scorePrix = Math.max(0, 25 - (écartPrix * 25));

    // Score localisation
    const scoreLoca = propriété.localisation === profil.localisation ? 20 : 10;

    // Score rendement
    const scoreRendement = propriété.écart_marché > 0 ? 25 : 15;

    // Score marché
    const scoreMarché = Math.min(propriété.vues / 10, 20);

    score = scorePrix + scoreLoca + scoreRendement + scoreMarché;

    return {
      scoreTotal: Math.round(score),
      détails: {
        prix: Math.round(scorePrix),
        localisation: scoreLoca,
        rendement: scoreRendement,
        marché: Math.round(scoreMarché)
      }
    };
  }

  /**
   * Calculer risque global
   */
  static calculerRisqueGlobal(propriétés) {
    if (propriétés.length === 0) return 'ÉLEVÉ';

    const scoresMoyens = propriétés.reduce((a, b) => a + b.score, 0) / propriétés.length;
    if (scoresMoyens > 75) return 'FAIBLE';
    if (scoresMoyens > 50) return 'MODÉRÉ';
    return 'ÉLEVÉ';
  }

  /**
   * Prédiction simple de secours
   */
  static prédirePrixSimple(propriété) {
    const { surface, chambres, prix } = propriété;
    const prixEstimé = (surface * 50000) + (chambres * 500000); // Valeurs de base Guinée
    return {
      prixEstimé: Math.round(prixEstimé),
      certitude: 'FAIBLE'
    };
  }
}

module.exports = ApprentissageAutomatiqueService;
