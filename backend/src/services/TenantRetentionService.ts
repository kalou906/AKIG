/**
 * TenantRetentionService
 * 
 * IA de rétention des locataires: Identifier les locataires "bons" à risque de départ
 * et proposer des actions de rétention personnalisées.
 * 
 * ROI: Réduire turnover 15-20%, améliorer CAC (Customer Acquisition Cost)
 * 
 * Fonctionnalités:
 * - Profiler les locataires fiables (historique 2+ ans, paiements OK)
 * - Détecter signaux faibles: moins de visites, demandes moins fréquentes, changement contexte
 * - Calculer score de rétention (0-100)
 * - Proposer actions: réductions, services additionnels, VIP program
 * - Tracking des actions + conversion rate
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';

interface TenantProfile {
  tenantId: string;
  name: string;
  contractDuration: number; // mois
  paymentHistory: {
    onTime: number;
    late: number;
    missed: number;
  };
  averageDelay: number; // jours
  contractValue: number; // GNF
  lastActivityDate: Date;
  daysSinceLastActivity: number;
  activityTrend: 'stable' | 'declining' | 'increasing'; // vs 3 mois avant
  referralCount: number; // amis/famille inscrits
  requestFrequency: number; // demandes/mois moyenne
  complaintCount: number;
  satisfactionScore?: number; // 0-10 si disponible
}

interface RetentionScore {
  tenantId: string;
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  retentionActions: RetentionAction[];
  estimatedChurnProbability: number; // %
  potentialLTVLoss: number; // GNF si départ
  recommendedInterventionDate: Date;
}

interface RetentionAction {
  actionType: 'discount' | 'vip_program' | 'service_addon' | 'loyalty_reward' | 'personalized_offer';
  description: string;
  incentiveValue: number; // GNF ou %
  expectedConversionRate: number; // basé sur historique similaire
  duration: number; // jours
  requiresApproval: boolean;
  approvalLevel: 'manager' | 'admin' | 'none';
}

interface RetentionCampaign {
  campaignId: string;
  tenants: string[]; // tenantIds
  actions: RetentionAction[];
  startDate: Date;
  endDate: Date;
  budget: number; // GNF total
  expectedROI: number; // %
  actualResults?: {
    engagementCount: number;
    conversionCount: number;
    revenue: number;
    churnReduced: boolean;
  };
}

class TenantRetentionService {
  private pool: Pool;
  private readonly HIGH_VALUE_THRESHOLD = 500_000; // GNF/mois
  private readonly LONG_TERM_DURATION = 24; // mois
  private readonly PAYMENT_RELIABILITY_THRESHOLD = 0.95; // 95% on-time

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Profiler un locataire pour la rétention
   */
  async profileTenant(tenantId: string): Promise<TenantProfile> {
    try {
      // Récupérer infos de base
      const tenantResult = await this.pool.query(
        `SELECT id, name, email, phone, created_at 
         FROM tenants 
         WHERE id = $1`,
        [tenantId]
      );

      if (!tenantResult.rows[0]) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const tenant = tenantResult.rows[0];

      // Récupérer historique de paiement
      const paymentResult = await this.pool.query(
        `SELECT 
           SUM(CASE WHEN status = 'paid' AND paid_at <= due_date THEN 1 ELSE 0 END) as on_time,
           SUM(CASE WHEN status = 'paid' AND paid_at > due_date THEN 1 ELSE 0 END) as late,
           SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
           AVG(EXTRACT(DAY FROM (paid_at - due_date))) as avg_delay
         FROM payments 
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 months'`,
        [tenantId]
      );

      const paymentHistory = paymentResult.rows[0] || {
        on_time: 0,
        late: 0,
        missed: 0,
        avg_delay: 0,
      };

      // Récupérer durée contrats actifs
      const contractResult = await this.pool.query(
        `SELECT 
           COUNT(*) as contract_count,
           EXTRACT(YEAR FROM AGE(NOW(), MIN(created_at))) * 12 + 
           EXTRACT(MONTH FROM AGE(NOW(), MIN(created_at))) as duration_months,
           AVG(monthly_rent) as avg_value
         FROM contracts 
         WHERE tenant_id = $1 AND status = 'active'`,
        [tenantId]
      );

      const contractData = contractResult.rows[0] || {
        contract_count: 0,
        duration_months: 0,
        avg_value: 0,
      };

      // Récupérer activité récente
      const activityResult = await this.pool.query(
        `SELECT 
           MAX(created_at) as last_activity,
           COUNT(*) as total_activities
         FROM (
           SELECT created_at FROM notices WHERE tenant_id = $1
           UNION ALL
           SELECT created_at FROM payments WHERE tenant_id = $1
           UNION ALL
           SELECT created_at FROM messages WHERE sender_id = $1
           UNION ALL
           SELECT created_at FROM support_tickets WHERE tenant_id = $1
         ) as activities
         WHERE created_at >= NOW() - INTERVAL '12 months'`,
        [tenantId]
      );

      const activityData = activityResult.rows[0] || {
        last_activity: tenant.created_at,
        total_activities: 0,
      };

      const lastActivityDate = activityData.last_activity || new Date();
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Trend d'activité (vs 3 mois avant)
      const activityTrendResult = await this.pool.query(
        `SELECT 
           SUM(CASE WHEN created_at >= NOW() - INTERVAL '3 months' THEN 1 ELSE 0 END) as recent_count,
           SUM(CASE WHEN created_at >= NOW() - INTERVAL '6 months' 
                    AND created_at < NOW() - INTERVAL '3 months' THEN 1 ELSE 0 END) as prior_count
         FROM (
           SELECT created_at FROM notices WHERE tenant_id = $1
           UNION ALL
           SELECT created_at FROM payments WHERE tenant_id = $1
           UNION ALL
           SELECT created_at FROM messages WHERE sender_id = $1
         ) as activities`,
        [tenantId]
      );

      const trendData = activityTrendResult.rows[0] || {
        recent_count: 0,
        prior_count: 0,
      };

      const activityTrend: 'stable' | 'declining' | 'increasing' =
        trendData.recent_count > trendData.prior_count * 1.1
          ? 'increasing'
          : trendData.recent_count < trendData.prior_count * 0.9
          ? 'declining'
          : 'stable';

      // Referrals
      const referralResult = await this.pool.query(
        `SELECT COUNT(*) as referral_count 
         FROM referrals 
         WHERE referrer_id = $1 AND referred_tenant_id IS NOT NULL`,
        [tenantId]
      );

      const referralCount = referralResult.rows[0]?.referral_count || 0;

      // Récupérer demandes de service
      const requestResult = await this.pool.query(
        `SELECT COUNT(*) as total_requests,
                DATE_TRUNC('month', created_at) as month
         FROM service_requests 
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
         GROUP BY month
         ORDER BY month DESC`,
        [tenantId]
      );

      const requestFrequency =
        requestResult.rows.length > 0
          ? requestResult.rows.reduce((sum, row) => sum + parseInt(row.total_requests), 0) / 12
          : 0;

      // Réclamations
      const complaintResult = await this.pool.query(
        `SELECT COUNT(*) as complaint_count 
         FROM support_tickets 
         WHERE tenant_id = $1 AND priority = 'high' AND created_at >= NOW() - INTERVAL '12 months'`,
        [tenantId]
      );

      const complaintCount = complaintResult.rows[0]?.complaint_count || 0;

      // Score satisfaction (si disponible)
      const satisfactionResult = await this.pool.query(
        `SELECT AVG(rating) as avg_rating 
         FROM surveys 
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '12 months'`,
        [tenantId]
      );

      const satisfactionScore = satisfactionResult.rows[0]?.avg_rating || undefined;

      return {
        tenantId,
        name: tenant.name,
        contractDuration: contractData.duration_months || 0,
        paymentHistory: {
          onTime: paymentHistory.on_time || 0,
          late: paymentHistory.late || 0,
          missed: paymentHistory.missed || 0,
        },
        averageDelay: paymentHistory.avg_delay || 0,
        contractValue: contractData.avg_value || 0,
        lastActivityDate,
        daysSinceLastActivity,
        activityTrend,
        referralCount,
        requestFrequency,
        complaintCount,
        satisfactionScore,
      };
    } catch (error) {
      logger.error(`Error profiling tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Calculer score de rétention (0-100)
   * Critères: fiabilité paiement, durée, activité, valeur, satisfaction
   */
  calculateRetentionScore(profile: TenantProfile): number {
    let score = 100;
    const riskFactors: string[] = [];

    // 1. Fiabilité paiement (poids: 30%)
    const totalPayments = profile.paymentHistory.onTime + profile.paymentHistory.late + profile.paymentHistory.missed;
    const paymentReliability =
      totalPayments > 0 ? profile.paymentHistory.onTime / totalPayments : 0.5;

    if (paymentReliability < this.PAYMENT_RELIABILITY_THRESHOLD) {
      score -= (this.PAYMENT_RELIABILITY_THRESHOLD - paymentReliability) * 30;
      riskFactors.push(`Payment reliability: ${(paymentReliability * 100).toFixed(1)}% (target: 95%)`);
    }

    if (profile.paymentHistory.missed > 0) {
      score -= profile.paymentHistory.missed * 5;
      riskFactors.push(`${profile.paymentHistory.missed} missed payments`);
    }

    // 2. Durée contrat (poids: 20%)
    if (profile.contractDuration < this.LONG_TERM_DURATION) {
      const duration_factor = (profile.contractDuration / this.LONG_TERM_DURATION) * 20;
      score -= 20 - duration_factor;
      riskFactors.push(`Short contract: ${profile.contractDuration} months (target: 24+)`);
    }

    // 3. Inactivité (poids: 20%)
    if (profile.daysSinceLastActivity > 60) {
      const inactivity_penalty = Math.min(
        20,
        (profile.daysSinceLastActivity - 60) / 10
      );
      score -= inactivity_penalty;
      riskFactors.push(`Inactive: ${profile.daysSinceLastActivity} days`);
    }

    // 4. Trend d'activité (poids: 15%)
    if (profile.activityTrend === 'declining') {
      score -= 15;
      riskFactors.push('Activity declining (3-month trend)');
    }

    // 5. Valeur contrat (poids: 10%)
    if (profile.contractValue < 100_000) {
      score -= 5; // Low-value tenants less critical
    }

    // 6. Satisfaction (poids: 5%)
    if (profile.satisfactionScore !== undefined && profile.satisfactionScore < 7) {
      score -= (7 - profile.satisfactionScore) * 2;
      riskFactors.push(`Low satisfaction: ${profile.satisfactionScore}/10`);
    }

    // Bonus: Recommandations (loyal tenants)
    if (profile.referralCount > 0) {
      score += profile.referralCount * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Évaluer risque de départ + proposer actions
   */
  assessRetentionRisk(profile: TenantProfile, score: number): RetentionScore {
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let estimatedChurnProbability: number;
    const retentionActions: RetentionAction[] = [];
    const riskFactors: string[] = [];

    // Déterminer niveau de risque et probabilité de départ
    if (score >= 80) {
      riskLevel = 'low';
      estimatedChurnProbability = 0.05; // 5%
    } else if (score >= 60) {
      riskLevel = 'medium';
      estimatedChurnProbability = 0.15; // 15%
    } else if (score >= 40) {
      riskLevel = 'high';
      estimatedChurnProbability = 0.35; // 35%
    } else {
      riskLevel = 'critical';
      estimatedChurnProbability = 0.60; // 60%
    }

    // Ajouter facteurs de risque
    if (profile.paymentHistory.missed > 0) {
      riskFactors.push('Payment delinquency');
    }
    if (profile.daysSinceLastActivity > 60) {
      riskFactors.push('Extended inactivity');
    }
    if (profile.activityTrend === 'declining') {
      riskFactors.push('Activity decline');
    }
    if (profile.complaintCount > 2) {
      riskFactors.push('Multiple complaints');
    }

    // Proposer actions basées sur le profil
    if (riskLevel === 'critical') {
      retentionActions.push({
        actionType: 'personalized_offer',
        description: `Personalized retention offer: ${profile.name}`,
        incentiveValue: Math.floor(profile.contractValue * 0.15), // 15% discount
        expectedConversionRate: 0.75,
        duration: 30,
        requiresApproval: true,
        approvalLevel: 'manager',
      });

      retentionActions.push({
        actionType: 'vip_program',
        description: 'VIP status: Priority support + exclusive benefits',
        incentiveValue: 50_000, // 50k GNF value
        expectedConversionRate: 0.6,
        duration: 90,
        requiresApproval: true,
        approvalLevel: 'manager',
      });
    } else if (riskLevel === 'high') {
      retentionActions.push({
        actionType: 'discount',
        description: 'Time-limited discount: 10% off next 3 months',
        incentiveValue: Math.floor(profile.contractValue * 0.1 * 3),
        expectedConversionRate: 0.65,
        duration: 90,
        requiresApproval: false,
        approvalLevel: 'none',
      });

      retentionActions.push({
        actionType: 'service_addon',
        description: 'Free service addon: Premium support + maintenance',
        incentiveValue: 30_000,
        expectedConversionRate: 0.5,
        duration: 180,
        requiresApproval: false,
        approvalLevel: 'none',
      });
    } else if (riskLevel === 'medium') {
      retentionActions.push({
        actionType: 'loyalty_reward',
        description: 'Loyalty reward: 5% discount for annual commitment',
        incentiveValue: Math.floor(profile.contractValue * 0.05 * 12),
        expectedConversionRate: 0.55,
        duration: 365,
        requiresApproval: false,
        approvalLevel: 'none',
      });
    }

    // Calculer LTV loss potentiel
    const expectedMonthsOfLoss = 12; // Si départ, on perd 12 mois moyenne
    const potentialLTVLoss = profile.contractValue * expectedMonthsOfLoss * estimatedChurnProbability;

    // Déterminer date d'intervention recommandée
    const recommendedInterventionDate = new Date();
    if (riskLevel === 'critical') {
      recommendedInterventionDate.setDate(recommendedInterventionDate.getDate() + 2);
    } else if (riskLevel === 'high') {
      recommendedInterventionDate.setDate(recommendedInterventionDate.getDate() + 7);
    } else if (riskLevel === 'medium') {
      recommendedInterventionDate.setDate(recommendedInterventionDate.getDate() + 14);
    } else {
      recommendedInterventionDate.setDate(recommendedInterventionDate.getDate() + 30);
    }

    return {
      tenantId: profile.tenantId,
      score,
      riskLevel,
      riskFactors,
      retentionActions,
      estimatedChurnProbability,
      potentialLTVLoss,
      recommendedInterventionDate,
    };
  }

  /**
   * Lancer campagne de rétention pour cohort de risque élevé
   */
  async createRetentionCampaign(
    tenantIds: string[],
    campaignName: string,
    budgetPerTenant: number = 50_000
  ): Promise<RetentionCampaign> {
    const campaignId = `RET_${Date.now()}`;
    const totalBudget = tenantIds.length * budgetPerTenant;

    const campaign: RetentionCampaign = {
      campaignId,
      tenants: tenantIds,
      actions: [], // Actions déterminées par profil
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours
      budget: totalBudget,
      expectedROI: 2.5, // 250% ROI (chaque GNF d'incentive = 2.5x retention value)
    };

    // Sauvegarder campagne
    await this.pool.query(
      `INSERT INTO retention_campaigns 
       (campaign_id, name, tenant_count, budget, expected_roi, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [campaignId, campaignName, tenantIds.length, totalBudget, campaign.expectedROI, campaign.startDate, campaign.endDate]
    );

    logger.info(`Created retention campaign ${campaignId} for ${tenantIds.length} tenants`);

    return campaign;
  }

  /**
   * Analyser tous les locataires et retourner priorités de rétention
   */
  async identifyRetentionPriorities(limit: number = 50): Promise<RetentionScore[]> {
    try {
      // Récupérer tous les locataires actifs
      const tenantResult = await this.pool.query(
        `SELECT DISTINCT t.id 
         FROM tenants t 
         JOIN contracts c ON t.id = c.tenant_id 
         WHERE c.status = 'active' 
         LIMIT $1`,
        [limit * 5] // Sélectionner 5x plus, filtrer après
      );

      const scores: RetentionScore[] = [];

      for (const row of tenantResult.rows) {
        const profile = await this.profileTenant(row.id);
        const score = this.calculateRetentionScore(profile);
        const assessment = this.assessRetentionRisk(profile, score);
        scores.push(assessment);
      }

      // Trier par score décroissant (plus bas = plus à risque)
      scores.sort((a, b) => a.score - b.score);

      // Retourner top N à risque
      return scores.slice(0, limit);
    } catch (error) {
      logger.error('Error identifying retention priorities:', error);
      throw error;
    }
  }

  /**
   * Enregistrer action de rétention prise
   */
  async recordRetentionAction(
    tenantId: string,
    action: RetentionAction,
    approvedBy?: string
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO retention_actions 
       (tenant_id, action_type, description, incentive_value, expected_conversion, 
        duration_days, requires_approval, approved_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        tenantId,
        action.actionType,
        action.description,
        action.incentiveValue,
        action.expectedConversionRate,
        action.duration,
        action.requiresApproval,
        approvedBy,
      ]
    );
  }

  /**
   * Tracker résultats de la campagne
   */
  async trackCampaignResults(campaignId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT 
         c.campaign_id,
         COUNT(DISTINCT CASE WHEN ra.created_at >= c.start_date THEN ra.tenant_id END) as engagement_count,
         COUNT(DISTINCT CASE WHEN c2.renewed_at >= c.start_date THEN c2.tenant_id END) as conversion_count,
         SUM(CASE WHEN c2.renewed_at >= c.start_date THEN c2.monthly_rent ELSE 0 END) as revenue
       FROM retention_campaigns c
       LEFT JOIN retention_actions ra ON c.campaign_id = $1
       LEFT JOIN contracts c2 ON c.campaign_id = $1 AND c2.tenant_id = ra.tenant_id
       WHERE c.campaign_id = $1
       GROUP BY c.campaign_id`,
      [campaignId]
    );

    if (result.rows[0]) {
      const row = result.rows[0];
      await this.pool.query(
        `UPDATE retention_campaigns 
         SET actual_engagement = $2, actual_conversion = $3, actual_revenue = $4
         WHERE campaign_id = $1`,
        [campaignId, row.engagement_count, row.conversion_count, row.revenue || 0]
      );
    }
  }
}

export default TenantRetentionService;
