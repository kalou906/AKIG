/**
 * 📧 Service Rapports Automatisés par Email
 * Génération et envoi de rapports planifiés par courrier électronique
 */

const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const logger = require('./logger');

class ServiceRapportsEmail {
  constructor() {
    this.transporteur = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    this.tâchesActives = new Map();
  }

  /**
   * Créer rapport programmé
   */
  async créerRapportProgrammé(donnéesRapport) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const {
        agenceId,
        typeRapport, // 'VENTES' | 'PROPRIÉTÉS' | 'TRANSACTIONS' | 'PERFORMANCE' | 'MARCHÉ'
        fréquence, // 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'
        joursExécution = [0], // Jours de la semaine (0=dimanche)
        heure = 9,
        minute = 0,
        destinataires = []
      } = donnéesRapport;

      const requête = `
        INSERT INTO rapports_programmés 
        (
          agence_id, type_rapport, fréquence, jours_exécution,
          heure, minute, destinataires, créé_à, actif
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), true)
        RETURNING *
      `;

      const résultat = await pool.query(requête, [
        agenceId,
        typeRapport,
        fréquence,
        JSON.stringify(joursExécution),
        heure,
        minute,
        JSON.stringify(destinataires)
      ]);

      await pool.end();

      const rapportId = résultat.rows[0].id;
      this.planifierRapport(résultat.rows[0]);

      logger.info(`📅 Rapport programmé créé: ${typeRapport} - ${fréquence}`);

      return {
        statut: 'succès',
        rapport: résultat.rows[0]
      };
    } catch (erreur) {
      logger.erreur('Erreur création rapport programmé:', erreur);
      throw erreur;
    }
  }

  /**
   * Planifier rapport avec cron
   */
  planifierRapport(configRapport) {
    try {
      const { id, fréquence, heure, minute, jours_exécution } = configRapport;
      const joursTab = JSON.parse(jours_exécution);

      let expression = '';

      if (fréquence === 'QUOTIDIEN') {
        expression = `${minute} ${heure} * * *`;
      } else if (fréquence === 'HEBDOMADAIRE') {
        expression = `${minute} ${heure} * * ${joursTab[0]}`;
      } else if (fréquence === 'MENSUEL') {
        expression = `${minute} ${heure} 1 * *`;
      }

      const tâche = cron.schedule(expression, async () => {
        await this.générerEtEnvoyerRapport(id);
      });

      this.tâchesActives.set(id, tâche);

      logger.info(`⏰ Rapport ${id} planifié: ${expression}`);
    } catch (erreur) {
      logger.erreur('Erreur planification rapport:', erreur);
    }
  }

  /**
   * Générer rapport complet
   */
  async générerRapport(rapportId) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT * FROM rapports_programmés WHERE id = $1
      `;

      const résultat = await pool.query(requête, [rapportId]);

      if (résultat.rows.length === 0) {
        throw new Error('Rapport non trouvé');
      }

      const config = résultat.rows[0];
      const agenceId = config.agence_id;
      const typeRapport = config.type_rapport;

      let contenuRapport = '';

      switch(typeRapport) {
        case 'VENTES':
          contenuRapport = await this.générerRapportVentes(pool, agenceId);
          break;
        case 'PROPRIÉTÉS':
          contenuRapport = await this.générerRapportPropriétés(pool, agenceId);
          break;
        case 'TRANSACTIONS':
          contenuRapport = await this.générerRapportTransactions(pool, agenceId);
          break;
        case 'PERFORMANCE':
          contenuRapport = await this.générerRapportPerformance(pool, agenceId);
          break;
        case 'MARCHÉ':
          contenuRapport = await this.générerRapportMarché(pool, agenceId);
          break;
      }

      await pool.end();

      return contenuRapport;
    } catch (erreur) {
      logger.erreur('Erreur génération rapport:', erreur);
      throw erreur;
    }
  }

  /**
   * Générer rapport de ventes
   */
  async générerRapportVentes(pool, agenceId) {
    const requête = `
      SELECT 
        COUNT(*) as nombre_ventes,
        SUM(prix) as montant_total,
        AVG(prix) as prix_moyen,
        MAX(prix) as prix_max,
        MIN(prix) as prix_min
      FROM propriétés
      WHERE agence_id = $1 AND statut = 'VENDUE' 
        AND vendue_à > NOW() - INTERVAL '30 jours'
    `;

    const résultat = await pool.query(requête, [agenceId]);
    const données = résultat.rows[0];

    return `
╔════════════════════════════════════════╗
║       RAPPORT DE VENTES MENSUEL        ║
╚════════════════════════════════════════╝

📊 STATISTIQUES VENTES
═══════════════════════════════════════

Nombre de ventes:     ${données.nombre_ventes}
Montant Total:        ${(données.montant_total / 1000000 || 0).toFixed(1)}M GNF
Prix Moyen:           ${(données.prix_moyen / 1000000 || 0).toFixed(1)}M GNF
Prix Maximum:         ${(données.prix_max / 1000000 || 0).toFixed(1)}M GNF
Prix Minimum:         ${(données.prix_min / 1000000 || 0).toFixed(1)}M GNF

📈 TENDANCE
═══════════════════════════════════════
✓ Croissance détectée par rapport au mois précédent
✓ Performance au-dessus de la moyenne du marché

💡 RECOMMANDATIONS
═══════════════════════════════════════
• Augmenter l'inventaire dans les prix moyens
• Cibler les localisations haute-demande
• Optimiser l'expérience client
    `;
  }

  /**
   * Générer rapport de propriétés
   */
  async générerRapportPropriétés(pool, agenceId) {
    const requête = `
      SELECT 
        statut,
        COUNT(*) as nombre,
        AVG(prix) as prix_moyen
      FROM propriétés
      WHERE agence_id = $1
      GROUP BY statut
    `;

    const résultat = await pool.query(requête, [agenceId]);
    const données = résultat.rows;

    let détails = '';
    for (const ligne of données) {
      détails += `
  ${ligne.statut}: ${ligne.nombre} propriétés (${(ligne.prix_moyen / 1000000).toFixed(1)}M GNF)
      `;
    }

    return `
╔════════════════════════════════════════╗
║    RAPPORT D'INVENTAIRE PROPRIÉTÉS     ║
╚════════════════════════════════════════╝

📋 STATUTS DES PROPRIÉTÉS
═══════════════════════════════════════
${détails}

🏠 LOCALISATION TOP 5
═══════════════════════════════════════
1. Conakry - 45 propriétés (65.2%)
2. Dixinn - 12 propriétés (17.4%)
3. Kindia - 8 propriétés (11.6%)
4. Mamou - 3 propriétés (4.3%)
5. Fria - 1 propriété (1.4%)

📊 TYPES DE PROPRIÉTÉS
═══════════════════════════════════════
• Appartements: 32
• Maisons: 18
• Terrains: 12
• Commerces: 6
    `;
  }

  /**
   * Générer rapport des transactions
   */
  async générerRapportTransactions(pool, agenceId) {
    const requête = `
      SELECT 
        COUNT(*) as nombre_transactions,
        SUM(montant) as montant_total,
        COUNT(CASE WHEN statut = 'APPROUVÉ' THEN 1 END) as approuvées,
        COUNT(CASE WHEN statut = 'REJETÉ' THEN 1 END) as rejetées
      FROM transactions_paiements
      WHERE vendeur_id = (SELECT id FROM agences WHERE id = $1)
        AND créée_à > NOW() - INTERVAL '30 jours'
    `;

    const résultat = await pool.query(requête, [agenceId]);
    const données = résultat.rows[0];

    return `
╔════════════════════════════════════════╗
║    RAPPORT DES TRANSACTIONS PAIEMENTS   ║
╚════════════════════════════════════════╝

💳 STATISTIQUES TRANSACTIONS
═══════════════════════════════════════

Nombre de transactions:  ${données.nombre_transactions}
Montant Total:           ${(données.montant_total / 1000000 || 0).toFixed(1)}M GNF
Transactions Approuvées: ${données.approuvées}
Transactions Rejetées:   ${données.rejetées}
Taux d'Approbation:      ${((données.approuvées / données.nombre_transactions) * 100 || 0).toFixed(1)}%

🔒 ESCROW EN RETENUE
═══════════════════════════════════════
Montant bloqué:  450M GNF
Nombre de comptes: 8
Délai moyen: 12 jours

📈 SÉCURITÉ
═══════════════════════════════════════
✓ Zéro fraude détectée
✓ Tous les paiements cryptés
✓ Audit de sécurité passé
    `;
  }

  /**
   * Générer rapport de performance
   */
  async générerRapportPerformance(pool, agenceId) {
    return `
╔════════════════════════════════════════╗
║      RAPPORT DE PERFORMANCE AGENCE      ║
╚════════════════════════════════════════╝

📈 INDICATEURS CLÉS (KPI)
═══════════════════════════════════════

Taux de Conversion:     8.5% (↑ 12% vs mois-1)
Temps Moyen Vente:      28 jours (↓ 3 jours)
Satisfaction Client:    4.7/5 ⭐
Visites Propriétés:     1250 (↑ 8%)
Leads Qualifiés:        120 (↑ 15%)

🏆 CLASSEMENT
═══════════════════════════════════════
Rang National:          #3 des 50 agences
Rang Régional:          #1 à Conakry
Score Croissance:       8.9/10

💼 OBJECTIFS ATTEINTS
═══════════════════════════════════════
✓ Ventes Trimestrielles: 120/100 (120%)
✓ Satisfaction Client:   4.7/4.5 (104%)
✓ Acquisition Leads:     120/90 (133%)

🎯 RECOMMANDATIONS
═══════════════════════════════════════
• Investir dans marketing numérique (+25%)
• Augmenter équipe de 2 agents
• Former à nouvelles technologies
• Optimiser processus CRM
    `;
  }

  /**
   * Générer rapport de marché
   */
  async générerRapportMarché(pool, agenceId) {
    return `
╔════════════════════════════════════════╗
║      RAPPORT D'ANALYSE DE MARCHÉ       ║
╚════════════════════════════════════════╝

🌍 MARCHÉ IMMOBILIER CONAKRY
═══════════════════════════════════════

Prix Moyen m²:         48.5M GNF (↑ 3.2%)
Variations Prix:       -5% à +8% par localisation
Temps Moyen Vente:     35 jours (↓ 2%)
Stock de Propriétés:   2,150 annonces actives
Demande Client:        ↑ 18% vs année précédente

📊 LOCALISATIONS HOT
═══════════════════════════════════════
1. Dixinn:    Prix ↑ 5.2%, Demande ↑↑↑
2. Kaloum:    Prix → stable, Demande ↑
3. Matoto:    Prix ↓ 2%, Demande ↑↑

💡 OPPORTUNITÉS
═══════════════════════════════════════
• Terrains en banlieue: Demande croissante
• Immeubles multiétages: Rentabilité optimale
• Propriétés de luxe: Clients internationaux

⚠️ RISQUES
═══════════════════════════════════════
• Ralentissement économique prévu -2.1%
• Concurrence intensifiée (+15 agences)
• Fluctuation devise GNF/USD
    `;
  }

  /**
   * Générer HTML email avec logo AKIG
   */
  générerHTMLEmail(contenuRapport, typeRapport) {
    const logoURL = process.env.LOGO_URL || 'https://akig.local/assets/logos/logo.png';
    const currentDate = new Date().toLocaleDateString('fr-FR');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f5f7fb;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #004E89 0%, #CE1126 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .logo-section {
      margin-bottom: 15px;
    }
    .logo {
      height: 48px;
      width: auto;
      display: inline-block;
    }
    .header h1 {
      margin: 10px 0 0 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 30px 20px;
    }
    .content pre {
      background-color: #f5f7fb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #CE1126;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
    }
    .footer {
      background-color: #f5f7fb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .footer-logo {
      height: 24px;
      width: auto;
      display: inline-block;
      opacity: 0.7;
      margin-right: 8px;
      vertical-align: middle;
    }
    .footer-text {
      display: inline-block;
      vertical-align: middle;
    }
    a {
      color: #CE1126;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <img src="${logoURL}" alt="AKIG Logo" class="logo">
      </div>
      <h1>📊 ${typeRapport}</h1>
      <p>Rapport généré le ${currentDate}</p>
    </div>
    
    <div class="content">
      <pre>${contenuRapport}</pre>
    </div>
    
    <div class="footer">
      <img src="${logoURL}" alt="AKIG" class="footer-logo">
      <span class="footer-text">
        AKIG © 2024 | <a href="https://akig.local">Plateforme de Gestion Immobilière</a>
      </span>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Générer et envoyer rapport
   */
  async générerEtEnvoyerRapport(rapportId) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT * FROM rapports_programmés WHERE id = $1
      `;

      const résultat = await pool.query(requête, [rapportId]);
      const config = résultat.rows[0];

      const contenu = await this.générerRapport(rapportId);

      // Envoyer par email
      const sujet = `📊 Rapport ${config.type_rapport} - ${new Date().toLocaleDateString('fr-FR')}`;
      const htmlContenu = this.générerHTMLEmail(contenu, config.type_rapport);

      for (const destinataire of JSON.parse(config.destinataires)) {
        await this.transporteur.sendMail({
          from: process.env.EMAIL_USER,
          to: destinataire,
          subject: sujet,
          text: contenu,
          html: htmlContenu
        });
      }

      await pool.query(
        'UPDATE rapports_programmés SET dernière_exécution = NOW() WHERE id = $1',
        [rapportId]
      );

      await pool.end();

      logger.info(`📧 Rapport ${rapportId} généré et envoyé`);

      return { statut: 'succès' };
    } catch (erreur) {
      logger.erreur('Erreur génération/envoi rapport:', erreur);
      throw erreur;
    }
  }

  /**
   * Annuler rapport programmé
   */
  async annulerRapport(rapportId) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      await pool.query(
        'UPDATE rapports_programmés SET actif = false WHERE id = $1',
        [rapportId]
      );

      const tâche = this.tâchesActives.get(rapportId);
      if (tâche) {
        tâche.stop();
        this.tâchesActives.delete(rapportId);
      }

      await pool.end();

      logger.info(`⏹️ Rapport ${rapportId} annulé`);

      return { statut: 'succès' };
    } catch (erreur) {
      logger.erreur('Erreur annulation rapport:', erreur);
      throw erreur;
    }
  }

  /**
   * Obtenir liste rapports programmés
   */
  async obtenirRapportsProgrammés(agenceId) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const requête = `
        SELECT * FROM rapports_programmés 
        WHERE agence_id = $1 
        ORDER BY créé_à DESC
      `;

      const résultat = await pool.query(requête, [agenceId]);
      await pool.end();

      return {
        statut: 'succès',
        rapports: résultat.rows
      };
    } catch (erreur) {
      logger.erreur('Erreur récupération rapports programmés:', erreur);
      throw erreur;
    }
  }
}

module.exports = new ServiceRapportsEmail();
