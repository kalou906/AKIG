/**
 * Routes Missions & Agents - AKIG
 * 
 * Module pour:
 * - Génération automatique de missions
 * - Assignation aux agents
 * - Suivi du planning journalier
 * - Performances et scores
 * - Classement des agents
 * 
 * Utilisation: POST/GET /api/agents/...
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import pool from '../db';
import CacheService, { CACHE_KEYS } from '../services/cache.service';

const router = Router();

// ==================== MISSIONS ====================

/**
 * POST /api/agents/missions/generer
 * Générer automatiquement les missions du jour
 * 
 * Analyse les impayés et crée des missions
 */
router.post(
  '/missions/generer',
  async (req: Request, res: Response) => {
    const date = dayjs().format('YYYY-MM-DD');

    try {
      // Appeler fonction stockée
      const result = await pool.query(`
        SELECT * FROM generer_missions_automatiques($1::DATE);
      `, [date]);

      const { missions_creees, locataires_traites, montant_total } = result.rows[0];

      // Invalider cache missions
      await CacheService.invalidatePattern('missions:*');

      res.json({
        success: true,
        message: `${missions_creees} missions générées`,
        data: {
          date,
          missions_creees,
          locataires_traites,
          montant_total: parseFloat(montant_total),
        },
      });
    } catch (error) {
      console.error('Erreur génération missions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/agents/missions/jour
 * Lister les missions du jour
 */
router.get(
  '/missions/jour',
  async (req: Request, res: Response) => {
    const date = dayjs().format('YYYY-MM-DD');

    try {
      const cacheKey = CACHE_KEYS.MISSIONS_BY_DATE(date);
      let missions = await CacheService.get(cacheKey);

      if (!missions) {
        const result = await pool.query(`
          SELECT * FROM get_missions_jour($1::DATE);
        `, [date]);

        missions = result.rows as any[];
        await CacheService.set(cacheKey, missions, 5 * 60); // 5 min cache
      }

      res.json({
        success: true,
        date,
        total: (missions as any[]).length,
        data: missions,
      });
    } catch (error) {
      console.error('Erreur missions jour:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/agents/:id/missions
 * Lister les missions d'un agent
 */
router.get(
  '/:id/missions',
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date, statut } = req.query;

    try {
      let query = `
        SELECT 
          m.*,
          COUNT(DISTINCT ml.locataire_id) as nb_locataires,
          SUM(COALESCE(i.montant, 0)) as montant_total,
          s.nom as site_nom,
          s.adresse
        FROM missions m
        JOIN sites s ON m.site_id = s.id
        LEFT JOIN mission_locataires ml ON m.id = ml.mission_id
        LEFT JOIN impayes i ON ml.locataire_id = i.locataire_id
        WHERE m.agent_id = $1
      `;

      const params: any[] = [id];

      if (date) {
        query += ` AND DATE(m.date_mission) = $${params.length + 1}`;
        params.push(date);
      }

      if (statut) {
        query += ` AND m.statut = $${params.length + 1}`;
        params.push(statut);
      }

      query += ` GROUP BY m.id, s.id ORDER BY m.date_mission DESC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        agent_id: id,
        total: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      console.error('Erreur missions agent:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * PUT /api/agents/missions/:id
 * Mettre à jour une mission (changement statut, etc)
 */
router.put(
  '/missions/:id',
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { statut, notes } = req.body;

    try {
      const query = `
        UPDATE missions 
        SET statut = $1, notes = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [statut, notes, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Mission introuvable' });
      }

      // Invalider cache
      await CacheService.invalidatePattern('missions:*');
      await CacheService.invalidatePattern('perf:agent:*');

      res.json({
        success: true,
        message: 'Mission mise à jour',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erreur MAJ mission:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== PERFORMANCES ====================

/**
 * GET /api/agents/:id/performance
 * Récupérer performance d'un agent
 */
router.get(
  '/:id/performance',
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date } = req.query;

    try {
      const queryDate = date || dayjs().format('YYYY-MM-DD');

      const query = `
        SELECT 
          u.id, u.prenom || ' ' || u.nom as nom,
          vpa.visites_effectuees,
          vpa.promesses,
          vpa.paiements,
          vpa.refus,
          vpa.score_journalier as score,
          (vpa.visites_effectuees * 1 + vpa.promesses * 2 + vpa.paiements * 3 - vpa.refus * 1) as score_calc
        FROM utilisateurs u
        LEFT JOIN vue_performance_agents vpa ON u.id = vpa.agent_id
        WHERE u.id = $1 AND DATE(vpa.date) = $2
      `;

      const result = await pool.query(query, [id, queryDate]);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          agent_id: id,
          date: queryDate,
          data: {
            visites_effectuees: 0,
            promesses: 0,
            paiements: 0,
            refus: 0,
            score: 0,
          },
        });
      }

      res.json({
        success: true,
        agent_id: id,
        date: queryDate,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erreur performance:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/agents/classement/jour
 * Classement des agents - TOP 10
 */
router.get(
  '/classement/jour',
  async (req: Request, res: Response) => {
    const today = dayjs().format('YYYY-MM-DD');

    try {
      const cacheKey = CACHE_KEYS.CLASSEMENT_AGENTS(today);
      let classement = await CacheService.get(cacheKey);

      if (!classement) {
        const query = `
          SELECT 
            classement,
            agent_id,
            agent_nom,
            score_total,
            missions_completees,
            montant_recouvre,
            medal
          FROM vue_classement_agents
          ORDER BY classement ASC
          LIMIT 10
        `;

        const result = await pool.query(query);
        classement = result.rows;

        await CacheService.set(cacheKey, classement, 60 * 60); // 1h cache
      }

      res.json({
        success: true,
        date: today,
        data: classement,
      });
    } catch (error) {
      console.error('Erreur classement:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/agents/classement/mois
 * Classement mensuel
 */
router.get(
  '/classement/mois',
  async (req: Request, res: Response) => {
    const month = dayjs().format('YYYY-MM');

    try {
      const query = `
        SELECT 
          u.id as agent_id,
          u.prenom || ' ' || u.nom as agent_nom,
          SUM(COALESCE(ap.score_total, 0)) as score_total,
          COUNT(DISTINCT m.id) as missions,
          SUM(COALESCE(i.montant, 0)) as montant_recouvre,
          RANK() OVER (ORDER BY SUM(COALESCE(ap.score_total, 0)) DESC) as classement
        FROM utilisateurs u
        LEFT JOIN agent_performances ap ON u.id = ap.agent_id 
          AND TO_CHAR(ap.date_performance, 'YYYY-MM') = $1
        LEFT JOIN missions m ON u.id = m.agent_id 
          AND TO_CHAR(m.date_mission, 'YYYY-MM') = $1
        LEFT JOIN recouvrement_actions ra ON u.id = ra.agent_id 
          AND TO_CHAR(ra.date_action, 'YYYY-MM') = $1
        LEFT JOIN impayes i ON ra.resultat = 'paiement_recu'
        WHERE u.role = 'agent'
        GROUP BY u.id
        ORDER BY score_total DESC
      `;

      const result = await pool.query(query, [month]);

      res.json({
        success: true,
        period: month,
        data: result.rows,
      });
    } catch (error) {
      console.error('Erreur classement mois:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/agents/performance/graphique
 * Données pour graphique historique de performance
 */
router.get(
  '/performance/graphique',
  async (req: Request, res: Response) => {
    const { agent_id, days = 30 } = req.query;

    try {
      const query = `
        SELECT 
          date_stat as date,
          score as score_journalier,
          visites,
          promesses,
          paiements,
          refus,
          montant_recouvre
        FROM performance_historique
        WHERE agent_id = $1
        AND date_stat >= CURRENT_DATE - INTERVAL '1 day' * $2
        ORDER BY date_stat ASC
      `;

      const result = await pool.query(query, [agent_id, days]);

      res.json({
        success: true,
        agent_id,
        period_days: days,
        data: result.rows,
      });
    } catch (error) {
      console.error('Erreur graphique performance:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

export default router;
