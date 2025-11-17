// ============================================================================
// src/routes/agents-expert.js - Gestion agents + Scoring performance avancé
// ============================================================================

const express = require('express');
const { requireRole, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/agents-expert/scoreboard?agency_id=1
 * Scoreboard agents: performance encaissements, délais, satisfaction
 * Rôles: MANAGER, ADMIN
 */
router.get('/scoreboard', authMiddleware, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const pool = req.app.get('pool');
  const { agency_id } = req.query;

  try {
    if (!agency_id) {
      return res.status(400).json({ error: 'agency_id required' });
    }

    const query = `
      SELECT 
        a.id,
        u.name as agent_name,
        u.email,
        u.role,
        a.zone,
        a.goals,
        a.score,
        a.active,
        COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0)::bigint as total_collected,
        COUNT(CASE WHEN p.status = 'PAID' THEN 1 END)::int as payments_ok,
        COUNT(CASE WHEN p.status = 'LATE' THEN 1 END)::int as late_count,
        COUNT(CASE WHEN p.status = 'PARTIAL' THEN 1 END)::int as partial_count,
        ROUND(
          COUNT(CASE WHEN p.status = 'PAID' THEN 1 END)::float 
          / NULLIF(COUNT(p.id), 0) * 100
        )::int as success_rate_percent,
        ROUND(AVG(EXTRACT(DAY FROM p.paid_date - p.due_date)))::int as avg_days_delay,
        COUNT(DISTINCT c.id)::int as contracts_managed
      FROM agents a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN properties pr ON pr.agency_id = $1
      LEFT JOIN contracts c ON c.property_id = pr.id
      LEFT JOIN payments p ON p.contract_id = c.id AND p.paid_date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE a.active = true AND u.agency_id = $1
      GROUP BY a.id, u.name, u.email, u.role, a.zone, a.goals, a.score, a.active
      ORDER BY total_collected DESC
    `;

    const result = await pool.query(query, [agency_id]);

    const agents = result.rows.map(r => {
      const monthlyTarget = r.goals?.monthly_target || 50000000;
      const achievementPercent = monthlyTarget > 0 
        ? Math.round((Number(r.total_collected) / monthlyTarget) * 100)
        : 0;

      return {
        id: r.id,
        name: r.agent_name,
        email: r.email,
        role: r.role,
        zone: r.zone,
        active: r.active,
        performance: {
          total_collected: Number(r.total_collected),
          payments_ok: r.payments_ok,
          late_count: r.late_count,
          partial_count: r.partial_count,
          success_rate_percent: r.success_rate_percent,
          avg_days_delay: r.avg_days_delay,
          contracts_managed: r.contracts_managed
        },
        targets: {
          monthly_target: monthlyTarget,
          current_achievement: Number(r.total_collected),
          achievement_percent: achievementPercent,
          status: achievementPercent >= 100 ? 'OBJECTIF_ATTEINT' : 
                  achievementPercent >= 80 ? 'BON' : 
                  achievementPercent >= 50 ? 'MOYEN' : 'INSUFFISANT'
        },
        score: Number(r.score)
      };
    });

    res.json({
      agency_id,
      count: agents.length,
      agents,
      summary: {
        total_collected: agents.reduce((sum, a) => sum + a.performance.total_collected, 0),
        avg_success_rate: agents.length > 0 
          ? Math.round(agents.reduce((sum, a) => sum + a.performance.success_rate_percent, 0) / agents.length)
          : 0,
        on_target_count: agents.filter(a => a.targets.achievement_percent >= 100).length,
        top_agent: agents[0] || null
      }
    });
  } catch (err) {
    console.error('[AGENTS] Scoreboard error:', err.message);
    res.status(500).json({ error: 'Failed to get scoreboard', details: err.message });
  }
});

/**
 * POST /api/agents-expert/:id/score
 * Mettre à jour score agent (gamification)
 * Rôles: MANAGER, ADMIN
 */
router.post('/:id/score', authMiddleware, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const pool = req.app.get('pool');
  const { id } = req.params;
  const { delta, reason } = req.body;

  try {
    if (!delta) {
      return res.status(400).json({ error: 'delta required' });
    }

    const result = await pool.query(
      `UPDATE agents
       SET score = score + $1
       WHERE id = $2
       RETURNING id, score`,
      [delta, id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      ok: true,
      agent_id: result.rows[0].id,
      new_score: result.rows[0].score,
      reason
    });
  } catch (err) {
    console.error('[AGENTS] Score update error:', err.message);
    res.status(500).json({ error: 'Failed to update score', details: err.message });
  }
});

module.exports = router;
