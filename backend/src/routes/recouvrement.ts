/**
 * Routes Recouvrement - AKIG
 * 
 * Module principal pour:
 * - Enregistrement des appels
 * - Enregistrement des visites
 * - Suivi des promesses
 * - Historique complet
 * 
 * Utilisation: POST /api/recouvrement/...
 */

import express, { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { authenticate, authorize } from '../middleware/auth';
import CacheService, { CACHE_KEYS } from '../services/cache.service';
import { invalidateCacheMiddleware } from '../middleware/caching.middleware';

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ==================== APPELS TÉLÉPHONIQUES ====================

/**
 * POST /api/recouvrement/appel
 * Enregistrer un appel téléphonique avec un locataire
 * 
 * Body:
 * {
 *   locataire_id: UUID,
 *   agent_id: UUID,
 *   date_appel: datetime,
 *   duree_minutes: number,
 *   resultat: 'accepte' | 'refuse' | 'pas_disponible' | 'numero_invalide',
 *   promesse_paiement: date,
 *   montant_promis: number,
 *   notes: string
 * }
 */
router.post(
  '/appel',
  authenticate,
  authorize(['secretaire', 'chef_equipe', 'admin']),
  invalidateCacheMiddleware('recouvrement:actions:*', 'perf:agent:*'),
  async (req: Request, res: Response) => {
    const {
      locataire_id,
      agent_id,
      date_appel,
      duree_minutes,
      resultat,
      promesse_paiement,
      montant_promis,
      notes,
    } = req.body;

    try {
      const id = uuidv4();
      const action_id = uuidv4();

      // Enregistrer l'action
      const query = `
        INSERT INTO recouvrement_actions (
          id, agent_id, locataire_id, type_action, date_action, 
          statut, resultat, duree_minutes, promesse_paiement, 
          montant_promis, notes, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *;
      `;

      const result = await pool.query(query, [
        action_id,
        agent_id,
        locataire_id,
        'appel',
        new Date(date_appel),
        'effectuee',
        resultat,
        duree_minutes,
        promesse_paiement ? new Date(promesse_paiement) : null,
        montant_promis || null,
        notes,
        (req.user as any)?.id,
      ]);
      // Si promesse, créer entrée promesse_paiement
      if (promesse_paiement) {
        await pool.query(`
          INSERT INTO promesses_paiement (
            locataire_id, agent_id, date_promesse, date_paiement_prevue,
            montant, type_contact, notes, status
          )
          VALUES ($1, $2, NOW(), $3, $4, $5, $6, 'en_attente')
        `, [
          locataire_id,
          agent_id,
          new Date(promesse_paiement),
          montant_promis,
          'appel',
          `Appel: ${notes}`,
        ]);
      }

      // Invalider cache recouvrement
      await CacheService.invalidatePattern('recouvrement:actions:*');

      res.status(201).json({
        success: true,
        message: 'Appel enregistré avec succès',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erreur enregistrement appel:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== VISITES ====================

/**
 * POST /api/recouvrement/visite
 * Enregistrer une visite terrain
 */
router.post(
  '/visite',
  authenticate,
  authorize(['agent', 'chef_equipe', 'admin']),
  invalidateCacheMiddleware('recouvrement:actions:*', 'perf:agent:*', 'missions:*'),
  async (req: Request, res: Response) => {
    const {
      locataire_id,
      agent_id,
      mission_id,
      date_visite,
      duree_minutes,
      statut, // 'effectuee' | 'absent' | 'refusee'
      resultat, // 'paiement_recu' | 'promesse_paiement' | 'refus'
      montant_recouvre,
      promesse_paiement,
      montant_promis,
      photos,
      notes,
    } = req.body;

    try {
      const action_id = uuidv4();

      const query = `
        INSERT INTO recouvrement_actions (
          id, agent_id, locataire_id, mission_id, type_action, 
          date_action, statut, resultat, duree_minutes, 
          montant_recouvre, promesse_paiement, montant_promis,
          photos, notes, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING *;
      `;

      const result = await pool.query(query, [
        action_id,
        agent_id,
        locataire_id,
        mission_id,
        'visite',
        new Date(date_visite),
        statut,
        resultat,
        duree_minutes,
        montant_recouvre || null,
        promesse_paiement ? new Date(promesse_paiement) : null,
        montant_promis || null,
        JSON.stringify(photos || []),
        notes,
        (req.user as any)?.id,
      ]);

      // Si paiement reçu, mettre à jour impayé
      if (resultat === 'paiement_recu' && montant_recouvre) {
        await pool.query(`
          UPDATE impayes 
          SET statut = 'partiel', montant_paye = montant_paye + $1
          WHERE locataire_id = $2 AND statut = 'impaye'
          LIMIT 1
        `, [montant_recouvre, locataire_id]);
      }

      // Si promesse, enregistrer
      if (promesse_paiement) {
        await pool.query(`
          INSERT INTO promesses_paiement (
            locataire_id, agent_id, date_promesse, date_paiement_prevue,
            montant, type_contact, status
          )
          VALUES ($1, $2, NOW(), $3, $4, $5, 'en_attente')
        `, [locataire_id, agent_id, new Date(promesse_paiement), montant_promis, 'visite']);
      }

      // Invalider cache
      await CacheService.invalidatePattern('recouvrement:actions:*');
      await CacheService.invalidatePattern('perf:agent:*');

      res.status(201).json({
        success: true,
        message: 'Visite enregistrée avec succès',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erreur enregistrement visite:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== PROMESSES ====================

/**
 * GET /api/recouvrement/promesses
 * Lister les promesses de paiement
 */
router.get(
  '/promesses',
  authenticate,
  authorize(['secretaire', 'chef_equipe', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { statut = 'en_attente', limit = 50, offset = 0 } = req.query;

      const query = `
        SELECT 
          pp.*,
          l.nom as locataire_nom,
          l.prenom as locataire_prenom,
          u.prenom || ' ' || u.nom as agent_nom,
          COUNT(*) OVER() as total
        FROM promesses_paiement pp
        LEFT JOIN locataires l ON pp.locataire_id = l.id
        LEFT JOIN utilisateurs u ON pp.agent_id = u.id
        WHERE pp.status = $1
        ORDER BY pp.date_paiement_prevue ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [statut, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          total: result.rows[0]?.total || 0,
          limit,
          offset,
        },
      });
    } catch (error) {
      console.error('Erreur récupération promesses:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * PUT /api/recouvrement/promesses/:id
 * Mettre à jour statut de promesse
 */
router.put(
  '/promesses/:id',
  authenticate,
  authorize(['secretaire', 'chef_equipe', 'admin']),
  invalidateCacheMiddleware('recouvrement:actions:*'),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    try {
      const query = `
        UPDATE promesses_paiement 
        SET status = $1, notes = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [status, notes, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Promesse introuvable' });
      }

      await CacheService.invalidatePattern('recouvrement:actions:*');

      res.json({
        success: true,
        message: 'Promesse mise à jour',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erreur MAJ promesse:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== HISTORIQUE RECOUVREMENT ====================

/**
 * GET /api/recouvrement/historique/:locataire_id
 * Récupérer historique complet d'un locataire
 */
router.get(
  '/historique/:locataire_id',
  authenticate,
  authorize(['secretaire', 'agent', 'chef_equipe', 'admin']),
  async (req: Request, res: Response) => {
    const { locataire_id } = req.params;

    try {
      const query = `
        SELECT 
          ra.*,
          u.prenom || ' ' || u.nom as agent_nom,
          l.nom as locataire_nom,
          l.prenom as locataire_prenom
        FROM recouvrement_actions ra
        LEFT JOIN utilisateurs u ON ra.agent_id = u.id
        LEFT JOIN locataires l ON ra.locataire_id = l.id
        WHERE ra.locataire_id = $1
        ORDER BY ra.date_action DESC
      `;

      const result = await pool.query(query, [locataire_id]);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Erreur historique:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ==================== STATISTIQUES QUOTIDIENNES ====================

/**
 * GET /api/recouvrement/stats/daily
 * Statistiques du jour
 */
router.get(
  '/stats/daily',
  authenticate,
  authorize(['chef_equipe', 'admin']),
  async (req: Request, res: Response) => {
    const today = dayjs().format('YYYY-MM-DD');

    try {
      const query = `
        SELECT 
          COUNT(DISTINCT agent_id) as agents_actifs,
          COUNT(CASE WHEN statut = 'effectuee' THEN 1 END) as appels_visites_effectues,
          COUNT(CASE WHEN resultat = 'promesse_paiement' THEN 1 END) as promesses_obtenues,
          COUNT(CASE WHEN resultat = 'paiement_recu' THEN 1 END) as paiements_recus,
          SUM(COALESCE(montant_recouvre, 0)) as montant_total_recouvre,
          COUNT(CASE WHEN resultat = 'refus' THEN 1 END) as refus
        FROM recouvrement_actions
        WHERE DATE(date_action) = $1
      `;

      const result = await pool.query(query, [today]);

      res.json({
        success: true,
        date: today,
        stats: result.rows[0],
      });
    } catch (error) {
      console.error('Erreur stats:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

export default router;
