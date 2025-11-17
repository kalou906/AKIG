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

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const pool = require('../db');
const CacheService = require('../services/cache.service');

const router = express.Router();

// ==================== MISSIONS ====================

/**
 * POST /api/agents/missions/generer
 * Générer automatiquement les missions du jour
 * 
 * Analyse les impayés et crée des missions
 */
router.post('/missions/generer', async (req, res) => {
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
});

/**
 * GET /api/agents/missions/jour
 * Lister les missions du jour
 */
router.get('/missions/jour', async (req, res) => {
  const date = dayjs().format('YYYY-MM-DD');

  try {
    const cacheKey = CacheService.CACHE_KEYS.MISSIONS_BY_DATE(date);
    let missions = await CacheService.get(cacheKey);

    if (!missions) {
      const result = await pool.query(`
        SELECT * FROM get_missions_jour($1::DATE);
      `, [date]);

      missions = result.rows;
      await CacheService.set(cacheKey, missions, 5 * 60); // 5 min cache
    }

    res.json({
      success: true,
      date,
      total: missions.length,
      data: missions,
    });
  } catch (error) {
    console.error('Erreur missions jour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/agents/:id/missions
 * Lister les missions d'un agent
 */
router.get('/:id/missions', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, statut } = req.query;

    let query = `
      SELECT m.*, l.name as locataire_name
      FROM missions m
      LEFT JOIN locataires l ON m.locataire_id = l.id
      WHERE m.agent_id = $1
    `;
    const params = [id];

    if (date) {
      query += ` AND DATE(m.created_at) = $2`;
      params.push(date);
    }

    if (statut) {
      query += ` AND m.statut = $${params.length + 1}`;
      params.push(statut);
    }

    query += ` ORDER BY m.created_at DESC`;

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
});

/**
 * PUT /api/agents/missions/:id
 * Mettre à jour une mission
 */
router.put('/missions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, notes } = req.body;

    const result = await pool.query(`
      UPDATE missions
      SET statut = $1, notes = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `, [statut, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission introuvable' });
    }

    // Invalider cache
    await CacheService.invalidatePattern('missions:*');

    res.json({
      success: true,
      message: 'Mission mise à jour',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur mise à jour mission:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/agents/:id/performance
 * Récupérer les performances d'un agent
 */
router.get('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let query = `
      SELECT 
        a.id,
        a.name,
        COUNT(m.id) as total_missions,
        SUM(CASE WHEN m.statut = 'completed' THEN 1 ELSE 0 END) as missions_completees,
        SUM(CASE WHEN m.statut = 'pending' THEN 1 ELSE 0 END) as missions_en_attente,
        ROUND(100.0 * SUM(CASE WHEN m.statut = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(m.id), 0), 2) as taux_completion,
        AVG(CAST(m.montant AS DECIMAL)) as montant_moyen
      FROM agents a
      LEFT JOIN missions m ON a.id = m.agent_id
      WHERE a.id = $1
    `;
    const params = [id];

    if (date) {
      query += ` AND DATE(m.created_at) = $2`;
      params.push(date);
    }

    query += ` GROUP BY a.id, a.name;`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        agent_id: id,
        date: date || dayjs().format('YYYY-MM-DD'),
        data: {
          visites_effectuees: 0,
          promesses: 0,
          contrats_signes: 0,
          montant_collecte: 0,
          score: 0,
        },
      });
    }

    res.json({
      success: true,
      agent_id: id,
      date: date || dayjs().format('YYYY-MM-DD'),
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur performance agent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/agents/classement/jour
 * Classement des agents du jour
 */
router.get('/classement/jour', async (req, res) => {
  const date = dayjs().format('YYYY-MM-DD');

  try {
    const cacheKey = `agents:classement:${date}`;
    let ranking = await CacheService.get(cacheKey);

    if (!ranking) {
      const result = await pool.query(`
        SELECT 
          a.id,
          a.name,
          COUNT(m.id) as total_missions,
          SUM(CASE WHEN m.statut = 'completed' THEN 1 ELSE 0 END) as missions_completees,
          ROUND(100.0 * SUM(CASE WHEN m.statut = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(m.id), 0), 2) as taux_completion,
          ROW_NUMBER() OVER (ORDER BY SUM(CASE WHEN m.statut = 'completed' THEN 1 ELSE 0 END) DESC) as rang
        FROM agents a
        LEFT JOIN missions m ON a.id = m.agent_id AND DATE(m.created_at) = $1
        GROUP BY a.id, a.name
        ORDER BY rang;
      `, [date]);

      ranking = result.rows;
      await CacheService.set(cacheKey, ranking, 10 * 60); // 10 min cache
    }

    res.json({
      success: true,
      date,
      data: ranking,
    });
  } catch (error) {
    console.error('Erreur classement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
