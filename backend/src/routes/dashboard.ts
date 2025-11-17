/**
 * Routes Tableau de Bord Propriétaires - AKIG
 * 
 * Module pour:
 * - Vue des sites et impayés
 * - Fenêtre de paiement
 * - Bons payeurs
 * - Statistiques et rapports
 * 
 * Utilisation: GET /api/dashboard/...
 */

import express, { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import dayjs from 'dayjs';
import CacheService, { CACHE_KEYS } from '../services/cache.service';

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ==================== TABLEAU DE BORD GLOBAL ====================

/**
 * GET /api/dashboard/resume
 * Résumé global du propriétaire
 */
router.get(
  '/resume',
  async (req: Request, res: Response) => {
    const { periode = 'mois' } = req.query; // jour, semaine, mois, annee

    try {
      const cacheKey = `dashboard:resume:${periode}`;
      let resume = await CacheService.get(cacheKey);

      if (!resume) {
        const query = `
          SELECT 
            COUNT(DISTINCT s.id) as nb_sites,
            COUNT(DISTINCT l.id) as nb_locataires,
            COUNT(DISTINCT i.id) as nb_impayes,
            SUM(i.montant) as montant_impayes,
            COUNT(DISTINCT CASE WHEN i.statut = 'impaye' THEN i.id END) as impayes_non_payes,
            COUNT(DISTINCT CASE WHEN i.statut = 'partiel' THEN i.id END) as impayes_partiels,
            SUM(COALESCE(p.montant, 0)) as montant_paye_periode,
            COUNT(DISTINCT p.id) as nb_paiements,
            ROUND(
              (COUNT(DISTINCT CASE WHEN p.date_paiement <= p.date_echeance THEN p.id END)::NUMERIC / 
               NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 2
            ) as taux_ponctualite_pct
          FROM sites s
          LEFT JOIN locataires l ON s.id = l.site_id
          LEFT JOIN contrats c ON l.id = c.locataire_id
          LEFT JOIN impayes i ON c.id = i.contrat_id
          LEFT JOIN paiements p ON c.id = p.contrat_id
          WHERE DATE(p.created_at) >= 
            CASE 
              WHEN $1 = 'jour' THEN CURRENT_DATE
              WHEN $1 = 'semaine' THEN CURRENT_DATE - INTERVAL '7 days'
              WHEN $1 = 'mois' THEN CURRENT_DATE - INTERVAL '30 days'
              ELSE CURRENT_DATE - INTERVAL '365 days'
            END
        `;

        const result = await pool.query(query, [periode]);
        resume = result.rows[0] as any;

        await CacheService.set(cacheKey, resume, 60 * 60); // 1h cache
      }

      res.json({
        success: true,
        periode,
        resume: {
          nb_sites: parseInt((resume as any)?.nb_sites),
          nb_locataires: parseInt((resume as any)?.nb_locataires),
          impayes: {
            total: parseInt((resume as any)?.nb_impayes),
            montant_total: parseFloat((resume as any)?.montant_impayes),
            non_payes: parseInt((resume as any)?.impayes_non_payes),
            partiels: parseInt((resume as any)?.impayes_partiels),
          },
          paiements: {
            montant_periode: parseFloat((resume as any)?.montant_paye_periode),
            nombre: parseInt((resume as any)?.nb_paiements),
            taux_ponctualite: parseFloat((resume as any)?.taux_ponctualite_pct),
          },
        },
      });
    } catch (error) {
      console.error('Erreur résumé dashboard:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== SITES ====================

/**
 * GET /api/dashboard/sites
 * Liste de tous les sites avec statistiques
 */
router.get(
  '/sites',
  async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          s.id,
          s.nom,
          s.adresse,
          s.type_site,
          s.politique_impaye,
          s.fenetre_paiement_debut,
          s.fenetre_paiement_fin,
          COUNT(DISTINCT l.id) as nb_locataires,
          COUNT(DISTINCT i.id) as nb_impayes,
          SUM(i.montant) as montant_impayes,
          AVG(EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance))::INT as jours_retard_moyen,
          CASE 
            WHEN s.type_site = 'sensible' THEN '⚠️  Sensible'
            WHEN s.type_site = 'problematique' THEN '🔴 Problématique'
            ELSE '✅ Normal'
          END as statut_label
        FROM sites s
        LEFT JOIN locataires l ON s.id = l.site_id
        LEFT JOIN impayes i ON l.id = i.locataire_id AND i.statut = 'impaye'
        GROUP BY s.id
        ORDER BY nb_impayes DESC
      `;

      const result = await pool.query(query);

      const sites = result.rows.map(row => ({
        id: row.id,
        nom: row.nom,
        adresse: row.adresse,
        type: row.type_site,
        politique: row.politique_impaye,
        fenetre_paiement: {
          debut: row.fenetre_paiement_debut,
          fin: row.fenetre_paiement_fin,
        },
        locataires: {
          total: parseInt(row.nb_locataires),
          en_retard: parseInt(row.nb_impayes),
        },
        impayes: {
          nombre: parseInt(row.nb_impayes),
          montant_total: parseFloat(row.montant_impayes || 0),
          jours_retard_moyen: row.jours_retard_moyen,
        },
        statut: row.statut_label,
      }));

      res.json({
        success: true,
        total: sites.length,
        sites,
      });
    } catch (error) {
      console.error('Erreur sites dashboard:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/dashboard/sites/:id
 * Détails d'un site
 */
router.get(
  '/sites/:id',
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const cacheKey = CACHE_KEYS.SITE_STATS(id);
      let siteStats = await CacheService.get(cacheKey);

      if (!siteStats) {
        const query = `
          SELECT 
            s.*,
            COUNT(DISTINCT l.id) as nb_locataires,
            COUNT(DISTINCT CASE WHEN i.statut = 'impaye' THEN i.id END) as nb_impayes,
            SUM(COALESCE(i.montant, 0)) as montant_impayes_total,
            COUNT(DISTINCT CASE WHEN EXTRACT(DAY FROM CURRENT_DATE - i.date_echeance) > 60 THEN i.id END) as impayes_critiques,
            SUM(COALESCE(p.montant, 0)) as montant_paye_mois,
            COUNT(DISTINCT p.id) as nb_paiements_mois
          FROM sites s
          LEFT JOIN locataires l ON s.id = l.site_id
          LEFT JOIN impayes i ON l.id = i.locataire_id
          LEFT JOIN paiements p ON i.contrat_id = p.contrat_id 
            AND DATE(p.created_at) >= CURRENT_DATE - INTERVAL '30 days'
          WHERE s.id = $1
          GROUP BY s.id
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Site introuvable' });
        }

        siteStats = result.rows[0] as any;
        await CacheService.set(cacheKey, siteStats, 30 * 60); // 30 min cache
      }

      res.json({
        success: true,
        site: {
          id: (siteStats as any)?.id,
          nom: (siteStats as any)?.nom,
          adresse: (siteStats as any)?.adresse,
          type: (siteStats as any)?.type_site,
          politique: (siteStats as any)?.politique_impaye,
          fenetre_paiement: {
            debut: (siteStats as any)?.fenetre_paiement_debut,
            fin: (siteStats as any)?.fenetre_paiement_fin,
          },
          stats: {
            locataires_total: parseInt((siteStats as any)?.nb_locataires),
            impayes: parseInt((siteStats as any)?.nb_impayes),
            impayes_critiques: parseInt((siteStats as any)?.impayes_critiques),
            montant_impayes: parseFloat((siteStats as any)?.montant_impayes_total || 0),
            montant_paye_mois: parseFloat((siteStats as any)?.montant_paye_mois || 0),
            paiements_mois: parseInt((siteStats as any)?.nb_paiements_mois),
          },
        },
      });
    } catch (error) {
      console.error('Erreur site détail:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== BONS PAYEURS ====================

/**
 * GET /api/dashboard/bons-payeurs
 * Liste des bons payeurs (top clients)
 */
router.get(
  '/bons-payeurs',
  async (req: Request, res: Response) => {
    const { limit = 50 } = req.query;

    try {
      const cacheKey = CACHE_KEYS.BONS_PAYEURS();
      let bonPayeurs = await CacheService.get(cacheKey);

      if (!bonPayeurs) {
        const query = `
          SELECT * FROM get_bons_payeurs()
          LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        bonPayeurs = result.rows as any[];

        await CacheService.set(cacheKey, bonPayeurs, 60 * 60); // 1h cache
      }

      res.json({
        success: true,
        total: (bonPayeurs as any).length,
        bons_payeurs: (bonPayeurs as any[]).map((row: any) => ({
          locataire_id: row.locataire_id,
          nom: `${row.prenom} ${row.nom}`,
          site_id: row.site_id,
          contrats: parseInt(row.contrats_total),
          paiements_ponctuel: parseInt(row.paiements_a_temps),
          taux_ponctualite: parseFloat(row.taux_ponctualite),
          badge: row.badge,
        })),
      });
    } catch (error) {
      console.error('Erreur bons payeurs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== RAPPORT JOURNALIER ====================

/**
 * GET /api/dashboard/rapport/jour
 * Rapport de fin de journée
 */
router.get(
  '/rapport/jour',
  async (req: Request, res: Response) => {
    const { date } = req.query;
    const rapportDate = date ? dayjs(date as string).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

    try {
      const query = `
        SELECT 
          DATE(m.date_mission) as date,
          COUNT(DISTINCT m.id) as missions_planifiees,
          COUNT(DISTINCT CASE WHEN m.statut = 'completee' THEN m.id END) as missions_completees,
          COUNT(DISTINCT ra.id) as actions_effectuees,
          COUNT(DISTINCT CASE WHEN ra.resultat = 'paiement_recu' THEN ra.id END) as paiements_recus,
          COUNT(DISTINCT CASE WHEN ra.resultat = 'promesse_paiement' THEN ra.id END) as promesses,
          COUNT(DISTINCT CASE WHEN ra.resultat = 'refus' THEN ra.id END) as refus,
          SUM(COALESCE(ra.montant_recouvre, 0)) as montant_recouvre
        FROM missions m
        LEFT JOIN recouvrement_actions ra ON m.id = ra.mission_id
        WHERE DATE(m.date_mission) = $1
        GROUP BY DATE(m.date_mission)
      `;

      const result = await pool.query(query, [rapportDate]);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          date: rapportDate,
          rapport: {
            missions_planifiees: 0,
            missions_completees: 0,
            actions_effectuees: 0,
            paiements_recus: 0,
            promesses: 0,
            refus: 0,
            montant_recouvre: 0,
            taux_completion: 0,
          },
        });
      }

      const data = result.rows[0];
      const tauxCompletion = data.missions_planifiees > 0 
        ? Math.round((parseInt(data.missions_completees) / parseInt(data.missions_planifiees)) * 100)
        : 0;

      res.json({
        success: true,
        date: rapportDate,
        rapport: {
          missions_planifiees: parseInt(data.missions_planifiees),
          missions_completees: parseInt(data.missions_completees),
          actions_effectuees: parseInt(data.actions_effectuees),
          paiements_recus: parseInt(data.paiements_recus),
          promesses: parseInt(data.promesses),
          refus: parseInt(data.refus),
          montant_recouvre: parseFloat(data.montant_recouvre || 0),
          taux_completion: tauxCompletion,
        },
      });
    } catch (error) {
      console.error('Erreur rapport jour:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== ALERTES AUTOMATIQUES ====================

/**
 * GET /api/dashboard/alertes
 * Alertes automatiques et notifications
 */
router.get(
  '/alertes',
  async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          'Impayes critiques' as type,
          COUNT(*) as nombre,
          'critical' as severity,
          'Retard > 60 jours'::TEXT as description
        FROM impayes 
        WHERE statut = 'impaye'
        AND EXTRACT(DAY FROM CURRENT_DATE - date_echeance) > 60

        UNION ALL

        SELECT 
          'Promesses non honorées',
          COUNT(*),
          'warning',
          'Dépassé la date promise'
        FROM promesses_paiement
        WHERE status = 'en_attente'
        AND date_paiement_prevue < CURRENT_DATE

        UNION ALL

        SELECT 
          'Sites sensibles avec retards',
          COUNT(DISTINCT s.id),
          'info',
          'Attention requise'
        FROM sites s
        LEFT JOIN locataires l ON s.id = l.site_id
        LEFT JOIN impayes i ON l.id = i.locataire_id
        WHERE s.type_site = 'sensible'
        AND i.statut = 'impaye'
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        alertes: result.rows.map(row => ({
          type: row.type,
          nombre: parseInt(row.nombre),
          severity: row.severity,
          description: row.description,
        })),
      });
    } catch (error) {
      console.error('Erreur alertes:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

export default router;
