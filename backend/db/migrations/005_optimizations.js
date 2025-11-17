/**
 * Migration SQL #5 - Optimisations BD pour AKIG
 * Crée indexes, stored procedures et améliore les requêtes
 * 
 * Domaines optimisés:
 * 1. Impayés et retards de paiement
 * 2. Missions et performances agents
 * 3. Recherche full-text
 * 4. Locataires et sites
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migration = async () => {
  const client = await pool.connect();

  try {
    console.log('⏳ Début migration #5 - Optimisations...');

    // ============= INDEXES CRITIQUES =============
    console.log('📊 Création des indexes...');

    // Index pour recherche impayés par locataire
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_impayes_locataire_date
      ON impayes(locataire_id, date_echeance DESC);
    `);

    // Index pour missions par agent et date
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_missions_agent_date
      ON missions(agent_id, date_mission DESC);
    `);

    // Index pour performances agents
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_performances_agent_date
      ON agent_performances(agent_id, date_performance DESC);
    `);

    // Index pour locataires par site
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locataires_site_actif
      ON locataires(site_id, actif) WHERE actif = true;
    `);

    // Index pour appels/visites
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recouvrement_agent_date
      ON recouvrement_actions(agent_id, date_action DESC);
    `);

    // Index pour recherche locataires
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_locataires_search_text
      ON locataires USING GIN(to_tsvector('french', COALESCE(nom, '') || ' ' || COALESCE(prenom, '')));
    `);

    // Index pour sites problématiques
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sites_type_retards
      ON sites(type_site) WHERE type_site IN ('problematique', 'sensible');
    `);

    // ============= COLONNES CALCULÉES =============
    console.log('➕ Ajout de colonnes optimisées...');

    // Ajouter flag "est_impaye" pour recherche rapide
    await client.query(`
      ALTER TABLE impayes 
      ADD COLUMN IF NOT EXISTS est_impaye BOOLEAN DEFAULT true;
    `);

    // Ajouter colonne de score agent (calculé)
    await client.query(`
      ALTER TABLE agent_performances
      ADD COLUMN IF NOT EXISTS score_total INT DEFAULT 0;
    `);

    // Ajouter colonne pour compteur retards par site
    await client.query(`
      ALTER TABLE sites
      ADD COLUMN IF NOT EXISTS compteur_retards INT DEFAULT 0;
    `);

    // ============= FONCTIONS/PROCÉDURES STOCKÉES =============
    console.log('⚙️  Création des procédures stockées...');

    // Fonction pour obtenir impayés d'un locataire
    await client.query(`
      CREATE OR REPLACE FUNCTION get_impayes_locataire(p_locataire_id UUID)
      RETURNS TABLE (
        id UUID,
        montant NUMERIC,
        date_echeance DATE,
        jours_retard INT,
        statut VARCHAR,
        contrat_id UUID
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          i.id,
          i.montant,
          i.date_echeance,
          EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance)::INT as jours_retard,
          i.statut,
          c.id as contrat_id
        FROM impayes i
        JOIN contrats c ON i.contrat_id = c.id
        WHERE i.locataire_id = p_locataire_id
        AND i.statut IN ('impaye', 'partiel')
        ORDER BY i.date_echeance DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Fonction pour calculer score agent
    await client.query(`
      CREATE OR REPLACE FUNCTION calculer_score_agent(
        p_agent_id UUID, 
        p_date DATE
      )
      RETURNS INT AS $$
      DECLARE
        v_score INT := 0;
        v_visites INT;
        v_promesses INT;
        v_paiements INT;
        v_refus INT;
      BEGIN
        -- Compter les actions de la journée
        SELECT COUNT(*) INTO v_visites 
        FROM recouvrement_actions 
        WHERE agent_id = p_agent_id 
        AND DATE(date_action) = p_date 
        AND type_action = 'visite'
        AND statut = 'effectuee';

        SELECT COUNT(*) INTO v_promesses 
        FROM recouvrement_actions 
        WHERE agent_id = p_agent_id 
        AND DATE(date_action) = p_date 
        AND type_action = 'visite' 
        AND resultat = 'promesse_paiement';

        SELECT COUNT(*) INTO v_paiements 
        FROM recouvrement_actions 
        WHERE agent_id = p_agent_id 
        AND DATE(date_action) = p_date 
        AND resultat = 'paiement_recu';

        SELECT COUNT(*) INTO v_refus 
        FROM recouvrement_actions 
        WHERE agent_id = p_agent_id 
        AND DATE(date_action) = p_date 
        AND resultat = 'refus';

        -- Calcul du score
        v_score := (v_visites * 1) + (v_promesses * 2) + (v_paiements * 3) - (v_refus * 1);

        RETURN v_score;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Fonction pour obtenir missions du jour
    await client.query(`
      CREATE OR REPLACE FUNCTION get_missions_jour(p_date DATE)
      RETURNS TABLE (
        mission_id UUID,
        agent_id UUID,
        agent_nom VARCHAR,
        locataires_count INT,
        montant_total NUMERIC,
        site_id UUID,
        adresse VARCHAR
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          m.id,
          m.agent_id,
          u.prenom || ' ' || u.nom as agent_nom,
          COUNT(DISTINCT ml.locataire_id)::INT as locataires_count,
          SUM(COALESCE(i.montant, 0))::NUMERIC as montant_total,
          s.id,
          s.adresse
        FROM missions m
        JOIN utilisateurs u ON m.agent_id = u.id
        JOIN mission_locataires ml ON m.id = ml.mission_id
        LEFT JOIN impayes i ON ml.locataire_id = i.locataire_id
        JOIN sites s ON m.site_id = s.id
        WHERE DATE(m.date_mission) = p_date
        GROUP BY m.id, m.agent_id, u.id, s.id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Fonction pour obtenir bons payeurs
    await client.query(`
      CREATE OR REPLACE FUNCTION get_bons_payeurs()
      RETURNS TABLE (
        locataire_id UUID,
        nom VARCHAR,
        prenom VARCHAR,
        site_id UUID,
        contrats_total INT,
        paiements_a_temps INT,
        taux_ponctualite NUMERIC,
        badge VARCHAR
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          l.id,
          l.nom,
          l.prenom,
          l.site_id,
          COUNT(DISTINCT c.id)::INT as contrats_total,
          COUNT(DISTINCT CASE WHEN p.date_paiement <= p.date_echeance THEN p.id END)::INT as paiements_a_temps,
          ROUND(
            (COUNT(DISTINCT CASE WHEN p.date_paiement <= p.date_echeance THEN p.id END)::NUMERIC / 
             NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 2
          ) as taux_ponctualite,
          CASE 
            WHEN (COUNT(DISTINCT CASE WHEN p.date_paiement <= p.date_echeance THEN p.id END)::NUMERIC / 
                  NULLIF(COUNT(DISTINCT c.id), 0)) >= 0.95 THEN '🌟 Excellent'
            WHEN (COUNT(DISTINCT CASE WHEN p.date_paiement <= p.date_echeance THEN p.id END)::NUMERIC / 
                  NULLIF(COUNT(DISTINCT c.id), 0)) >= 0.85 THEN '⭐ Très bon'
            ELSE '👍 Bon'
          END as badge
        FROM locataires l
        LEFT JOIN contrats c ON l.id = c.locataire_id
        LEFT JOIN paiements p ON c.id = p.contrat_id
        GROUP BY l.id
        HAVING COUNT(DISTINCT c.id) > 0
        ORDER BY taux_ponctualite DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Fonction pour génération automatique de missions
    await client.query(`
      CREATE OR REPLACE FUNCTION generer_missions_automatiques(p_date DATE)
      RETURNS TABLE (
        missions_creees INT,
        locataires_traites INT,
        montant_total NUMERIC
      ) AS $$
      DECLARE
        v_missions_creees INT := 0;
        v_locataires_traites INT := 0;
        v_montant_total NUMERIC := 0;
        v_agent_id UUID;
        v_site_id UUID;
        v_locataires_cursor CURSOR FOR
          SELECT DISTINCT l.id, l.site_id, SUM(i.montant)
          FROM locataires l
          LEFT JOIN impayes i ON l.id = i.locataire_id
          WHERE i.date_echeance < p_date AND i.statut = 'impaye'
          GROUP BY l.id, l.site_id;
      BEGIN
        FOR v_site_id, v_locataire_id, v_montant IN v_locataires_cursor LOOP
          -- Assigner à agent (round-robin)
          SELECT id INTO v_agent_id FROM utilisateurs
          WHERE role = 'agent'
          AND site_id = v_site_id
          LIMIT 1;

          IF v_agent_id IS NOT NULL THEN
            INSERT INTO missions (agent_id, site_id, date_mission, statut)
            VALUES (v_agent_id, v_site_id, p_date, 'planifiee');
            v_missions_creees := v_missions_creees + 1;
            v_locataires_traites := v_locataires_traites + 1;
            v_montant_total := v_montant_total + v_montant;
          END IF;
        END LOOP;

        RETURN QUERY SELECT v_missions_creees, v_locataires_traites, v_montant_total;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ============= VIEWS POUR RAPPORTS =============
    console.log('📋 Création des vues de rapports...');

    // Vue: Impayés par site
    await client.query(`
      CREATE OR REPLACE VIEW vue_impayes_par_site AS
      SELECT 
        s.id as site_id,
        s.nom as site_nom,
        COUNT(DISTINCT i.locataire_id) as nb_locataires_retard,
        SUM(i.montant) as montant_total,
        AVG(EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance)) as jours_retard_moyen,
        s.type_site,
        s.politique_impaye
      FROM sites s
      LEFT JOIN impayes i ON s.id IN (
        SELECT site_id FROM locataires WHERE id = i.locataire_id
      )
      WHERE i.statut = 'impaye'
      GROUP BY s.id;
    `);

    // Vue: Performance agents
    await client.query(`
      CREATE OR REPLACE VIEW vue_performance_agents AS
      SELECT 
        u.id as agent_id,
        u.prenom || ' ' || u.nom as agent_nom,
        DATE(ra.date_action) as date,
        COUNT(CASE WHEN ra.statut = 'effectuee' THEN 1 END) as visites_effectuees,
        COUNT(CASE WHEN ra.resultat = 'promesse_paiement' THEN 1 END) as promesses,
        COUNT(CASE WHEN ra.resultat = 'paiement_recu' THEN 1 END) as paiements,
        COUNT(CASE WHEN ra.resultat = 'refus' THEN 1 END) as refus,
        (COUNT(CASE WHEN ra.statut = 'effectuee' THEN 1 END) * 1 +
         COUNT(CASE WHEN ra.resultat = 'promesse_paiement' THEN 1 END) * 2 +
         COUNT(CASE WHEN ra.resultat = 'paiement_recu' THEN 1 END) * 3 -
         COUNT(CASE WHEN ra.resultat = 'refus' THEN 1 END) * 1) as score_journalier
      FROM utilisateurs u
      LEFT JOIN recouvrement_actions ra ON u.id = ra.agent_id
      WHERE u.role = 'agent'
      GROUP BY u.id, DATE(ra.date_action);
    `);

    // Vue: Classement agents
    await client.query(`
      CREATE OR REPLACE VIEW vue_classement_agents AS
      SELECT 
        RANK() OVER (ORDER BY SUM(ap.score_total) DESC) as classement,
        u.id as agent_id,
        u.prenom || ' ' || u.nom as agent_nom,
        SUM(ap.score_total) as score_total,
        COUNT(DISTINCT m.id) as missions_completees,
        SUM(COALESCE(i.montant, 0)) as montant_recouvre,
        CASE 
          WHEN RANK() OVER (ORDER BY SUM(ap.score_total) DESC) = 1 THEN '🥇'
          WHEN RANK() OVER (ORDER BY SUM(ap.score_total) DESC) = 2 THEN '🥈'
          WHEN RANK() OVER (ORDER BY SUM(ap.score_total) DESC) = 3 THEN '🥉'
          ELSE '📊'
        END as medal
      FROM utilisateurs u
      LEFT JOIN agent_performances ap ON u.id = ap.agent_id
      LEFT JOIN missions m ON u.id = m.agent_id AND m.statut = 'completee'
      LEFT JOIN recouvrement_actions ra ON u.id = ra.agent_id
      LEFT JOIN impayes i ON ra.resultat = 'paiement_recu'
      WHERE u.role = 'agent'
      GROUP BY u.id;
    `);

    // ============= STATISTIQUES =============
    console.log('📈 Initialisation des statistiques...');

    // Créer table pour historique de performance
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_historique (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES utilisateurs(id),
        date_stat DATE NOT NULL,
        score INT,
        visites INT,
        promesses INT,
        paiements INT,
        refus INT,
        montant_recouvre NUMERIC,
        classement INT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agent_id, date_stat)
      );

      CREATE INDEX IF NOT EXISTS idx_performance_historique_agent_date
      ON performance_historique(agent_id, date_stat DESC);
    `);

    // Mettre à jour les métadonnées de migration
    await client.query(`
      UPDATE migrations 
      SET status = 'completed', completed_at = NOW()
      WHERE name = '005_optimizations';
    `);

    console.log('✅ Migration #5 complétée avec succès!');
    console.log('📊 Indexes créés: 7');
    console.log('⚙️  Procédures: 5');
    console.log('📋 Vues: 3');
    console.log('📈 Tables: 1');

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Exécuter
migration().catch(console.error);

module.exports = migration;
