// ============================================================================
// src/routes/ai-predictions.js - IA: Prédictions de paiements + Actions prescriptives
// ============================================================================

const express = require('express');
const { requireRole, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/ai/predictions/tenants?agency_id=1
 * Prédiction IA: probabilité de paiement pour tous les locataires
 * Basée sur: historique paiements, retards, durée séjour
 * Rôles: MANAGER, ADMIN
 */
router.get('/tenants', authMiddleware, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const pool = req.app.get('pool');
  const { agency_id } = req.query;

  try {
    if (!agency_id) {
      return res.status(400).json({ error: 'agency_id required' });
    }

    const query = `
      SELECT 
        t.id,
        t.name,
        t.phone,
        t.email,
        COALESCE(COUNT(p.id), 0)::int as total_payments,
        COALESCE(
          SUM(CASE WHEN p.status = 'PAID' THEN 1 ELSE 0 END)::float / 
          NULLIF(COUNT(p.id), 0), 
          0.5
        ) as pay_ratio,
        COALESCE(
          SUM(CASE WHEN p.status = 'LATE' THEN 1 ELSE 0 END)::float / 
          NULLIF(COUNT(p.id), 0),
          0
        ) as late_ratio,
        COALESCE(
          SUM(CASE WHEN p.status = 'PARTIAL' THEN 1 ELSE 0 END)::float / 
          NULLIF(COUNT(p.id), 0),
          0
        ) as partial_ratio,
        t.risk_score
      FROM tenants t
      LEFT JOIN contracts c ON c.tenant_id = t.id
      LEFT JOIN payments p ON p.contract_id = c.id
      WHERE t.agency_id = $1
      GROUP BY t.id, t.name, t.phone, t.email, t.risk_score
    `;

    const result = await pool.query(query, [agency_id]);

    // Calculer probabilité pour chaque locataire
    const predictions = result.rows.map(row => {
      const payRatio = row.pay_ratio || 0.5;
      const lateRatio = row.late_ratio || 0;
      const partialRatio = row.partial_ratio || 0;

      // Baseline: 0.7 * pay_ratio + 0.2 * (1 - late_ratio) + 0.1 * (1 - partial_ratio)
      const probability = Math.max(0.05, Math.min(0.95, 
        0.7 * payRatio + 
        0.2 * (1 - lateRatio) + 
        0.1 * (1 - partialRatio)
      ));

      return {
        tenant_id: row.id,
        tenant_name: row.name,
        phone: row.phone,
        email: row.email,
        probability: parseFloat(probability.toFixed(2)),
        probability_percent: Math.round(probability * 100),
        risk_factors: {
          pay_ratio: parseFloat(payRatio.toFixed(2)),
          late_ratio: parseFloat(lateRatio.toFixed(2)),
          partial_ratio: parseFloat(partialRatio.toFixed(2)),
          total_payments: row.total_payments
        },
        risk_score: Number(row.risk_score),
        risk_level: getRiskLevel(probability),
        model_version: 'baseline_v1',
        created_at: new Date().toISOString()
      };
    });

    // Trier par probabilité croissante (risques élevés en premier)
    predictions.sort((a, b) => a.probability - b.probability);

    res.json({
      agency_id,
      count: predictions.length,
      at_risk: predictions.filter(p => p.probability < 0.6).length,
      predictions
    });
  } catch (err) {
    console.error('[AI] Predictions error:', err.message);
    res.status(500).json({ error: 'Failed to generate predictions', details: err.message });
  }
});

/**
 * GET /api/ai/predictions/tenant/:id
 * Prédiction détaillée pour un locataire spécifique
 */
router.get('/tenant/:id', authMiddleware, requireRole('AGENT', 'MANAGER', 'COMPTABLE'), async (req, res) => {
  const pool = req.app.get('pool');
  const { id } = req.params;

  try {
    const tenantQuery = `
      SELECT 
        t.id, t.name, t.phone, t.email, t.guarantor, t.risk_score,
        COUNT(p.id) as total_payments,
        SUM(CASE WHEN p.status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN p.status = 'LATE' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN p.status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_count,
        AVG(EXTRACT(DAY FROM p.paid_date - p.due_date)) as avg_days_late
      FROM tenants t
      LEFT JOIN contracts c ON c.tenant_id = t.id
      LEFT JOIN payments p ON p.contract_id = c.id
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const tenantResult = await pool.query(tenantQuery, [id]);

    if (!tenantResult.rowCount) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];

    // Calcul probabilité
    const payRatio = tenant.total_payments > 0 
      ? Number(tenant.paid_count) / Number(tenant.total_payments) 
      : 0.5;
    const lateRatio = tenant.total_payments > 0 
      ? Number(tenant.late_count) / Number(tenant.total_payments) 
      : 0;
    const partialRatio = tenant.total_payments > 0 
      ? Number(tenant.partial_count) / Number(tenant.total_payments) 
      : 0;

    const probability = Math.max(0.05, Math.min(0.95,
      0.7 * payRatio + 
      0.2 * (1 - lateRatio) + 
      0.1 * (1 - partialRatio)
    ));

    // Actions prescriptives basées sur probabilité
    const actions = getNextActions(probability, tenant.late_count);

    res.json({
      tenant_id: id,
      tenant_name: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      guarantor: tenant.guarantor,
      probability: parseFloat(probability.toFixed(2)),
      probability_percent: Math.round(probability * 100),
      risk_level: getRiskLevel(probability),
      statistics: {
        total_payments: Number(tenant.total_payments),
        paid_count: Number(tenant.paid_count),
        late_count: Number(tenant.late_count),
        partial_count: Number(tenant.partial_count),
        avg_days_late: tenant.avg_days_late ? Math.round(Number(tenant.avg_days_late)) : 0
      },
      risk_factors: {
        pay_ratio: parseFloat(payRatio.toFixed(2)),
        late_ratio: parseFloat(lateRatio.toFixed(2)),
        partial_ratio: parseFloat(partialRatio.toFixed(2)),
        risk_score: Number(tenant.risk_score)
      },
      recommended_actions: actions,
      model_version: 'baseline_v1'
    });
  } catch (err) {
    console.error('[AI] Tenant prediction error:', err.message);
    res.status(500).json({ error: 'Failed to get prediction', details: err.message });
  }
});

/**
 * POST /api/ai/predictions/save
 * Sauvegarder prédictions pour tracking historique
 * Rôles: MANAGER, ADMIN
 */
router.post('/save', authMiddleware, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const pool = req.app.get('pool');
  const { tenant_id, probability, risk_factors } = req.body;

  try {
    if (!tenant_id || probability === undefined) {
      return res.status(400).json({ error: 'tenant_id and probability required' });
    }

    if (probability < 0 || probability > 1) {
      return res.status(400).json({ error: 'probability must be between 0 and 1' });
    }

    // Générer période (30 jours)
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const result = await pool.query(
      `INSERT INTO tenant_payment_predictions 
       (tenant_id, period_start, period_end, probability, risk_factors, model_version)
       VALUES ($1, $2, $3, $4, $5, 'baseline_v1')
       RETURNING *`,
      [
        tenant_id,
        periodStart.toISOString().slice(0, 10),
        periodEnd.toISOString().slice(0, 10),
        probability,
        JSON.stringify(risk_factors || {})
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[AI] Save prediction error:', err.message);
    res.status(500).json({ error: 'Failed to save prediction', details: err.message });
  }
});

/**
 * Déterminer niveau de risque
 */
function getRiskLevel(probability) {
  if (probability >= 0.8) return 'LOW';
  if (probability >= 0.6) return 'MEDIUM';
  if (probability >= 0.4) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Déterminer actions prescriptives basées sur probabilité
 */
function getNextActions(probability, lateCount = 0) {
  const actions = [];

  if (probability >= 0.8) {
    actions.push({
      type: 'Informatif',
      priority: 'LOW',
      action: 'Aucune relance nécessaire',
      description: 'Locataire fiable. Maintenir suivi standard.'
    });
  } else if (probability >= 0.6) {
    actions.push({
      type: 'Préventif',
      priority: 'MEDIUM',
      action: 'WhatsApp/SMS 5 jours avant échéance',
      description: 'Rappel courtois de la date d\'échéance',
      timing: 'J-5'
    });
  } else if (probability >= 0.4) {
    actions.push(
      {
        type: 'Proactif',
        priority: 'HIGH',
        action: 'SMS J-7 + WhatsApp J-5 + Appel J-3',
        description: 'Séquence d\'escalade de contact',
        timing: 'Multi-canaux'
      },
      {
        type: 'Financier',
        priority: 'HIGH',
        action: 'Proposer échéancier si non-paiement à J+3',
        description: 'Négociation plan de paiement',
        condition: 'Si paiement non reçu à J+3'
      }
    );
  } else {
    // Probabilité < 0.4: CRITIQUE
    actions.push(
      {
        type: 'Urgent',
        priority: 'CRITICAL',
        action: 'Appel immédiat + Visite terrain',
        description: 'Intervention directe requise',
        timing: 'Immédiat'
      },
      {
        type: 'Légal',
        priority: 'CRITICAL',
        action: 'Préparer dossier recouvrement',
        description: 'Consulter avocat si paiement non reçu à J+15',
        condition: 'Si défaut paiement prolongé'
      }
    );
  }

  // Ajouter alerte si historique de retards
  if (lateCount && lateCount > 3) {
    actions.push({
      type: 'Alerte',
      priority: 'HIGH',
      action: 'Pattern de retards détecté',
      description: `${lateCount} retards enregistrés. Pattern confirmé.`
    });
  }

  return actions;
}

module.exports = router;
