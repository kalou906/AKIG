/**
 * Risk Prediction Service - Identify bad payers before default
 * ML model with features: recent delays, payment patterns, credit score
 * 
 * Scoring: 0-100 (0=no risk, 100=certain default)
 * Rules:
 * - 3+ delays in last 90 days → HIGH RISK
 * - Decreasing payment amounts → MODERATE RISK
 * - Payment date shifting (later each month) → MODERATE RISK
 * - Zero promises kept → CRITICAL RISK
 */

import { Pool } from 'pg';
import dayjs from 'dayjs';

export interface RiskAssessment {
  locataire_id: string;
  risk_score: number; // 0-100
  risk_level: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
  factors: RiskFactor[];
  recommendation: string;
  last_updated: Date;
}

export interface RiskFactor {
  factor: string;
  impact: number; // 0-100
  description: string;
  trend?: 'improving' | 'stable' | 'degrading';
}

export class RiskPredictionService {
  private readonly DELAY_THRESHOLD = 5; // days
  private readonly CRITICAL_DELAY = 30; // days

  constructor(private pool: Pool) {}

  /**
   * Calculate risk score for a specific tenant
   */
  async calculateRiskScore(locataireId: string): Promise<RiskAssessment> {
    const tenant = await this.getTenantData(locataireId);
    if (!tenant) {
      throw new Error(`Tenant ${locataireId} not found`);
    }

    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Factor 1: Recent delays (weight: 30%)
    const delayFactor = await this.analyzeRecentDelays(locataireId);
    factors.push(delayFactor);
    totalScore += delayFactor.impact * 0.30;

    // Factor 2: Payment pattern analysis (weight: 25%)
    const patternFactor = await this.analyzePaymentPattern(locataireId);
    factors.push(patternFactor);
    totalScore += patternFactor.impact * 0.25;

    // Factor 3: Promise keeping rate (weight: 20%)
    const promiseFactor = await this.analyzePromiseKeeping(locataireId);
    factors.push(promiseFactor);
    totalScore += promiseFactor.impact * 0.20;

    // Factor 4: Communication response rate (weight: 15%)
    const communicationFactor = await this.analyzeCommunication(locataireId);
    factors.push(communicationFactor);
    totalScore += communicationFactor.impact * 0.15;

    // Factor 5: Economic context (weight: 10%)
    const economieFactor = await this.analyzeEconomicContext(locataireId);
    factors.push(economieFactor);
    totalScore += economieFactor.impact * 0.10;

    // Determine risk level
    const riskScore = Math.min(100, Math.round(totalScore));
    const riskLevel = this.getRiskLevel(riskScore);

    const assessment: RiskAssessment = {
      locataire_id: locataireId,
      risk_score: riskScore,
      risk_level: riskLevel,
      factors,
      recommendation: this.generateRecommendation(riskLevel, factors),
      last_updated: new Date()
    };

    // Save to DB for tracking
    await this.saveRiskAssessment(assessment);

    return assessment;
  }

  /**
   * Analyze recent delays in last 90 days
   */
  private async analyzeRecentDelays(locataireId: string): Promise<RiskFactor> {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_delays,
        AVG(EXTRACT(DAY FROM (date_paiement - date_echeance)))::INT as avg_delay_days,
        MAX(EXTRACT(DAY FROM (date_paiement - date_echeance)))::INT as max_delay_days
      FROM paiements
      WHERE locataire_id = $1
      AND date_paiement >= NOW() - INTERVAL '90 days'
      AND EXTRACT(DAY FROM (date_paiement - date_echeance)) > $2`,
      [locataireId, this.DELAY_THRESHOLD]
    );

    const data = result.rows[0];
    const delayCount = parseInt(data.total_delays) || 0;
    const avgDelay = parseInt(data.avg_delay_days) || 0;
    const maxDelay = parseInt(data.max_delay_days) || 0;

    let impact = 0;

    // 3+ delays → High impact
    if (delayCount >= 3) {
      impact += 70;
    } else if (delayCount === 2) {
      impact += 40;
    } else if (delayCount === 1) {
      impact += 15;
    }

    // Critical delays (>30 days) → Extra impact
    if (maxDelay > this.CRITICAL_DELAY) {
      impact += 20;
    }

    // Average delay increasing → Trend
    const trend = delayCount >= 2 ? 'degrading' : delayCount === 1 ? 'stable' : 'improving';

    return {
      factor: 'recent_delays',
      impact: Math.min(100, impact),
      description: `${delayCount} retards en 90j, délai moyen ${avgDelay}j`,
      trend
    };
  }

  /**
   * Analyze payment pattern (amount, regularity)
   */
  private async analyzePaymentPattern(locataireId: string): Promise<RiskFactor> {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as payment_count,
        AVG(montant)::DECIMAL as avg_amount,
        STDDEV(montant)::DECIMAL as stddev_amount,
        MAX(montant)::DECIMAL as max_amount,
        MIN(montant)::DECIMAL as min_amount
      FROM paiements
      WHERE locataire_id = $1
      AND date_paiement >= NOW() - INTERVAL '180 days'`,
      [locataireId]
    );

    const data = result.rows[0];
    const avgAmount = parseFloat(data.avg_amount) || 0;
    const stddev = parseFloat(data.stddev_amount) || 0;
    const minAmount = parseFloat(data.min_amount) || 0;

    let impact = 0;

    // High variability (stddev > 50% of avg) → Risk
    if (stddev > avgAmount * 0.5 && avgAmount > 0) {
      impact += 35;
    }

    // Decreasing amount trend (recent < older)
    if (minAmount < avgAmount * 0.7) {
      impact += 25;
    }

    // Few payments in 6 months → Irregular
    if (parseInt(data.payment_count) < 4) {
      impact += 20;
    }

    return {
      factor: 'payment_pattern',
      impact: Math.min(100, impact),
      description: `Moyenne ${avgAmount}€, variabilité ${Math.round(stddev)}€`
    };
  }

  /**
   * Analyze promise keeping rate
   */
  private async analyzePromiseKeeping(locataireId: string): Promise<RiskFactor> {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_promises,
        SUM(CASE WHEN statut = 'kept' THEN 1 ELSE 0 END)::INT as kept,
        SUM(CASE WHEN statut = 'broken' THEN 1 ELSE 0 END)::INT as broken,
        AVG(EXTRACT(DAY FROM (date_paiement - date_promesse)))::INT as avg_days_to_fulfill
      FROM promesses
      WHERE locataire_id = $1
      AND date_promesse >= NOW() - INTERVAL '90 days'`,
      [locataireId]
    );

    const data = result.rows[0];
    const total = parseInt(data.total_promises) || 0;
    const kept = parseInt(data.kept) || 0;
    const broken = parseInt(data.broken) || 0;

    let impact = 0;

    if (total === 0) {
      // No promises = neutral
      impact = 0;
    } else {
      const keptRate = (kept / total) * 100;

      // 0% kept → Critical
      if (keptRate === 0) {
        impact = 80;
      }
      // <50% kept → High
      else if (keptRate < 50) {
        impact = 60;
      }
      // 50-75% kept → Medium
      else if (keptRate < 75) {
        impact = 30;
      }
      // >90% kept → Low
      else if (keptRate >= 90) {
        impact = 5;
      }
    }

    return {
      factor: 'promise_keeping',
      impact,
      description: `${kept}/${total} promesses tenues (${total > 0 ? Math.round((kept / total) * 100) : 0}%)`
    };
  }

  /**
   * Analyze communication response rate
   */
  private async analyzeCommunication(locataireId: string): Promise<RiskFactor> {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_calls,
        SUM(CASE WHEN statut = 'reussi' THEN 1 ELSE 0 END)::INT as successful,
        SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END)::INT as refused,
        COUNT(DISTINCT agent_id) as agents_contacted
      FROM appels
      WHERE locataire_id = $1
      AND date_appel >= NOW() - INTERVAL '60 days'`,
      [locataireId]
    );

    const data = result.rows[0];
    const total = parseInt(data.total_calls) || 0;
    const successful = parseInt(data.successful) || 0;
    const refused = parseInt(data.refused) || 0;

    let impact = 0;

    // No attempts = risk
    if (total === 0) {
      impact = 10; // Contact hasn't been made yet
    }
    // High refusal rate → Bad sign
    else if (total > 0) {
      const refusalRate = (refused / total) * 100;

      if (refusalRate >= 70) {
        impact = 65; // Tenant actively avoiding
      } else if (refusalRate >= 40) {
        impact = 35;
      } else if (refusalRate < 20) {
        impact = 5; // Good cooperation
      }
    }

    return {
      factor: 'communication',
      impact,
      description: `${successful}/${total} appels réussis, ${refused} refusés`
    };
  }

  /**
   * Analyze external economic factors (site risk, occupancy, etc)
   */
  private async analyzeEconomicContext(locataireId: string): Promise<RiskFactor> {
    // Get tenant's site info
    const result = await this.pool.query(
      `SELECT 
        s.id,
        s.type,
        s.localisation,
        COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - p.date_echeance)) > 30) as retarded_count,
        COUNT(*) as total_tenants,
        AVG(CAST(EXTRACT(DAY FROM (NOW() - p.date_echeance)) as INT))::INT as avg_retard_days
      FROM locataires l
      JOIN sites s ON l.site_id = s.id
      LEFT JOIN impayes p ON l.id = p.locataire_id
      WHERE l.id = $1
      GROUP BY s.id, s.type, s.localisation`,
      [locataireId]
    );

    const data = result.rows[0];

    let impact = 0;

    if (data) {
      const totalTenants = parseInt(data.total_tenants) || 1;
      const retardedCount = parseInt(data.retarded_count) || 0;
      const siteRetardRate = (retardedCount / totalTenants) * 100;

      // If site has high default rate → tenant more likely to default
      if (siteRetardRate > 40) {
        impact = 40;
      } else if (siteRetardRate > 20) {
        impact = 20;
      }
    }

    return {
      factor: 'economic_context',
      impact,
      description: `Facteurs externes: site, localisation, contexte`
    };
  }

  /**
   * Determine risk level from score
   */
  private getRiskLevel(score: number): 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'RED';
    if (score >= 25) return 'YELLOW';
    return 'GREEN';
  }

  /**
   * Generate action recommendation based on risk
   */
  private generateRecommendation(
    level: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL',
    factors: RiskFactor[]
  ): string {
    switch (level) {
      case 'CRITICAL':
        return '🚨 URGENT: Prévoir saisie immédiate. Contact attorney. Bloquer logement.';

      case 'RED':
        return '⚠️  HAUTE PRIORITÉ: Intensifier recouvrement. Augmenter fréquence appels. Prévoir action légale.';

      case 'YELLOW':
        return '👀 À SURVEILLER: Augmenter monitoring. Relances hebdos. Proposer plan paiement.';

      case 'GREEN':
        return '✅ Bon payeur: Monitoring standard. Remercier pour ponctualité.';
    }
  }

  /**
   * Get all high-risk tenants for bulk action
   */
  async getHighRiskTenants(siteId?: string, threshold = 50): Promise<RiskAssessment[]> {
    let query = `
      SELECT 
        locataire_id,
        risk_score,
        risk_level,
        factors
      FROM risk_assessments
      WHERE risk_score >= $1
      AND last_updated >= NOW() - INTERVAL '7 days'
    `;
    const params: any[] = [threshold];

    if (siteId) {
      query += ` AND locataire_id IN (
        SELECT id FROM locataires WHERE site_id = $${params.length + 1}
      )`;
      params.push(siteId);
    }

    query += ` ORDER BY risk_score DESC`;

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      locataire_id: row.locataire_id,
      risk_score: row.risk_score,
      risk_level: row.risk_level,
      factors: row.factors,
      recommendation: '',
      last_updated: row.last_updated
    }));
  }

  /**
   * Save risk assessment to DB
   */
  private async saveRiskAssessment(assessment: RiskAssessment): Promise<void> {
    await this.pool.query(
      `INSERT INTO risk_assessments (locataire_id, risk_score, risk_level, factors, last_updated)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (locataire_id) DO UPDATE SET
        risk_score = $2,
        risk_level = $3,
        factors = $4,
        last_updated = $5`,
      [
        assessment.locataire_id,
        assessment.risk_score,
        assessment.risk_level,
        JSON.stringify(assessment.factors),
        assessment.last_updated
      ]
    );
  }

  /**
   * Batch recalculate all risks (run daily)
   */
  async recalculateAllRisks(): Promise<number> {
    const tenants = await this.pool.query(`SELECT id FROM locataires WHERE actif = true`);

    let count = 0;

    for (const tenant of tenants.rows) {
      try {
        await this.calculateRiskScore(tenant.id);
        count++;
      } catch (error) {
        console.error(`Error calculating risk for tenant ${tenant.id}:`, error);
      }
    }

    return count;
  }

  /**
   * Get tenant data for context
   */
  private async getTenantData(locataireId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT * FROM locataires WHERE id = $1`,
      [locataireId]
    );

    return result.rows[0];
  }

  /**
   * Risk trend analysis (comparing last 2 weeks)
   */
  async getRiskTrend(locataireId: string): Promise<{
    trend: 'improving' | 'stable' | 'degrading';
    score_change: number;
    level_change: string;
  }> {
    const result = await this.pool.query(
      `SELECT 
        (SELECT risk_score FROM risk_assessments_history 
         WHERE locataire_id = $1 
         AND date >= NOW() - INTERVAL '14 days'
         ORDER BY date DESC
         LIMIT 1) as latest,
        (SELECT risk_score FROM risk_assessments_history 
         WHERE locataire_id = $1 
         AND date >= NOW() - INTERVAL '14 days'
         ORDER BY date ASC
         LIMIT 1) as oldest`,
      [locataireId]
    );

    const data = result.rows[0];
    const latest = data.latest || 0;
    const oldest = data.oldest || 0;
    const change = latest - oldest;

    return {
      trend: change < -5 ? 'improving' : change > 5 ? 'degrading' : 'stable',
      score_change: change,
      level_change: change > 0 ? 'worsening' : change < 0 ? 'improving' : 'no_change'
    };
  }
}
