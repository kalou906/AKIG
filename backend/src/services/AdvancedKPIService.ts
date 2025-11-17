/**
 * AdvancedKPIService
 * 
 * Calcul de KPIs métier avancés:
 * - Temps moyen de résolution
 * - Taux de restitution des dépôts
 * - Satisfaction propriétaire (NPS)
 * - Rétention des locataires
 * - Revenue par agent
 * - Risk score portfolio
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';

export interface KPIMetrics {
  averageResolutionTime: number; // jours
  resolutionRate: number; // % contrats fermés sans dispute
  depositReturnRate: number; // % dépôts retournés vs retenus
  depositReturnTime: number; // jours moyens
  npsScore: number; // Net Promoter Score (-100 to 100)
  tenantRetentionRate: number; // % locataires qui renouvellent
  agentProductivity: number; // contrats/agent/mois
  revenuePerAgent: number; // GNF
  occupancyRate: number; // %
  portfolioRiskScore: number; // 0-100
  paymentCollectionRate: number; // %
  renewalRate: number; // % contrats qui se renouvellent
}

export interface DetailedKPIReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: KPIMetrics;
  trends: KPITrend[];
  benchmarks: Benchmark[];
  topPerformers: Performer[];
  improvements: ImprovementArea[];
}

export interface KPITrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  target: number;
  variance: number; // % vs target
}

export interface Benchmark {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformer: number;
  position: 'above' | 'at' | 'below';
}

export interface Performer {
  agent: string;
  siteId: string;
  metric: string;
  value: number;
  rank: number;
}

export interface ImprovementArea {
  area: string;
  currentScore: number;
  targetScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  estimatedImpact: string; // "Could improve NPS by 15%"
}

class AdvancedKPIService {
  private pool: Pool;
  private readonly KPI_TARGETS = {
    averageResolutionTime: 45, // jours max
    resolutionRate: 0.95, // 95% without disputes
    depositReturnRate: 0.92, // 92% fully returned
    npsScore: 50, // Net Promoter Score target
    tenantRetentionRate: 0.85, // 85% retention
    paymentCollectionRate: 0.95, // 95% collection
    renewalRate: 0.80, // 80% renewal
  };

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Calculer tous les KPIs pour une période
   */
  async calculateMetrics(
    startDate: Date,
    endDate: Date,
    siteId?: string
  ): Promise<KPIMetrics> {
    try {
      const [
        resolutionMetrics,
        depositMetrics,
        nps,
        retention,
        agentStats,
        occupancy,
        riskScore,
        paymentCollection,
        renewal,
      ] = await Promise.all([
        this.calculateResolutionMetrics(startDate, endDate, siteId),
        this.calculateDepositMetrics(startDate, endDate, siteId),
        this.calculateNPS(startDate, endDate, siteId),
        this.calculateRetentionRate(startDate, endDate, siteId),
        this.calculateAgentProductivity(startDate, endDate, siteId),
        this.calculateOccupancyRate(siteId),
        this.calculatePortfolioRiskScore(siteId),
        this.calculatePaymentCollection(startDate, endDate, siteId),
        this.calculateRenewalRate(startDate, endDate, siteId),
      ]);

      return {
        ...resolutionMetrics,
        ...depositMetrics,
        npsScore: nps,
        tenantRetentionRate: retention,
        ...agentStats,
        occupancyRate: occupancy,
        portfolioRiskScore: riskScore,
        paymentCollectionRate: paymentCollection,
        renewalRate: renewal,
      };
    } catch (error) {
      logger.error('Error calculating KPI metrics:', error);
      throw error;
    }
  }

  /**
   * KPI 1: Temps moyen de résolution & taux
   */
  private async calculateResolutionMetrics(
    startDate: Date,
    endDate: Date,
    siteId?: string
  ): Promise<{ averageResolutionTime: number; resolutionRate: number }> {
    let query = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_resolution_days,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as resolution_rate
      FROM contracts
      WHERE completed_at >= $1 AND completed_at <= $2
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` AND site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);

    return {
      averageResolutionTime: result.rows[0]?.avg_resolution_days || 0,
      resolutionRate: result.rows[0]?.resolution_rate || 0,
    };
  }

  /**
   * KPI 2: Taux de restitution des dépôts
   */
  private async calculateDepositMetrics(
    startDate: Date,
    endDate: Date,
    siteId?: string
  ): Promise<{ depositReturnRate: number; depositReturnTime: number }> {
    let query = `
      SELECT 
        SUM(CASE WHEN refund_status = 'full' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) as return_rate,
        AVG(EXTRACT(EPOCH FROM (refunded_at - contract_end_date)) / 86400) as avg_return_days
      FROM deposits
      WHERE refunded_at >= $1 AND refunded_at <= $2 AND refund_status IN ('full', 'partial', 'withheld')
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` AND site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);

    return {
      depositReturnRate: result.rows[0]?.return_rate || 0,
      depositReturnTime: result.rows[0]?.avg_return_days || 0,
    };
  }

  /**
   * KPI 3: Net Promoter Score (NPS)
   * Formule: % Promoters (score 9-10) - % Detractors (score 0-6)
   */
  private async calculateNPS(startDate: Date, endDate: Date, siteId?: string): Promise<number> {
    let query = `
      SELECT 
        SUM(CASE WHEN rating >= 9 THEN 1 ELSE 0 END) as promoters,
        SUM(CASE WHEN rating <= 6 THEN 1 ELSE 0 END) as detractors,
        COUNT(*) as total
      FROM surveys
      WHERE created_at >= $1 AND created_at <= $2 AND survey_type = 'nps'
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` AND site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);
    const row = result.rows[0];

    if (!row || row.total === 0) return 0;

    const nps = ((row.promoters - row.detractors) / row.total) * 100;
    return Math.round(nps);
  }

  /**
   * KPI 4: Taux de rétention locataires
   */
  private async calculateRetentionRate(startDate: Date, endDate: Date, siteId?: string): Promise<number> {
    let query = `
      SELECT 
        COUNT(DISTINCT CASE WHEN c2.id IS NOT NULL THEN t.id END)::float / 
        NULLIF(COUNT(DISTINCT t.id), 0) as retention_rate
      FROM tenants t
      LEFT JOIN contracts c1 ON t.id = c1.tenant_id AND c1.completed_at IS NULL
      LEFT JOIN contracts c2 ON t.id = c2.tenant_id 
        AND c2.created_at >= $1 AND c2.created_at <= $2
      WHERE c1.created_at < $1
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` AND t.site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);
    return result.rows[0]?.retention_rate || 0;
  }

  /**
   * KPI 5: Productivité agent & revenue
   */
  private async calculateAgentProductivity(
    startDate: Date,
    endDate: Date,
    siteId?: string
  ): Promise<{ agentProductivity: number; revenuePerAgent: number }> {
    let query = `
      SELECT 
        COUNT(*)::float / NULLIF(COUNT(DISTINCT agent_id), 0) as contracts_per_agent,
        SUM(monthly_rent * 12)::float / NULLIF(COUNT(DISTINCT agent_id), 0) as revenue_per_agent
      FROM contracts
      WHERE created_at >= $1 AND created_at <= $2
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` AND site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);

    return {
      agentProductivity: result.rows[0]?.contracts_per_agent || 0,
      revenuePerAgent: result.rows[0]?.revenue_per_agent || 0,
    };
  }

  /**
   * KPI 6: Taux d'occupation
   */
  private async calculateOccupancyRate(siteId?: string): Promise<number> {
    let query = `
      SELECT 
        SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END)::float / 
        NULLIF(COUNT(p.id), 0) as occupancy_rate
      FROM properties p
      LEFT JOIN contracts c ON p.id = c.property_id
    `;

    const params: any[] = [];

    if (siteId) {
      query += ` WHERE p.site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);
    return result.rows[0]?.occupancy_rate || 0;
  }

  /**
   * KPI 7: Risk score du portfolio
   * Basé sur: % impayés, litige, défauts, inactivité
   */
  private async calculatePortfolioRiskScore(siteId?: string): Promise<number> {
    let query = `
      SELECT 
        SUM(CASE WHEN p.status = 'missed' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(p.id), 0) * 100 as default_rate,
        SUM(CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END)::float / NULLIF(COUNT(DISTINCT c.id), 0) * 100 as dispute_rate,
        SUM(CASE WHEN c.activity_date < NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END)::float / 
          NULLIF(COUNT(DISTINCT c.id), 0) * 100 as inactive_rate
      FROM payments p
      JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN litigations l ON c.id = l.contract_id
    `;

    const params: any[] = [];

    if (siteId) {
      query += ` WHERE c.site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);
    const row = result.rows[0];

    // Risk score = weighted average
    const riskScore =
      (row.default_rate || 0) * 0.5 + // Défauts = 50% du risque
      (row.dispute_rate || 0) * 0.3 + // Disputes = 30%
      (row.inactive_rate || 0) * 0.2; // Inactivité = 20%

    return Math.min(100, Math.round(riskScore));
  }

  /**
   * KPI 8: Taux de collecte des paiements
   */
  private async calculatePaymentCollection(
    startDate: Date,
    endDate: Date,
    siteId?: string
  ): Promise<number> {
    let query = `
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)::float / 
        NULLIF(COUNT(*), 0) as collection_rate
      FROM payments
      WHERE due_date >= $1 AND due_date <= $2
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` AND site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);
    return result.rows[0]?.collection_rate || 0;
  }

  /**
   * KPI 9: Taux de renouvellement contrats
   */
  private async calculateRenewalRate(startDate: Date, endDate: Date, siteId?: string): Promise<number> {
    let query = `
      SELECT 
        COUNT(DISTINCT CASE WHEN c2.id IS NOT NULL THEN c1.id END)::float / 
        NULLIF(COUNT(DISTINCT c1.id), 0) as renewal_rate
      FROM contracts c1
      LEFT JOIN contracts c2 ON c1.tenant_id = c2.tenant_id 
        AND c2.created_at > c1.completed_at
        AND c2.created_at <= c1.completed_at + INTERVAL '90 days'
      WHERE c1.completed_at >= $1 AND c1.completed_at <= $2
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` AND c1.site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    const result = await this.pool.query(query, params);
    return result.rows[0]?.renewal_rate || 0;
  }

  /**
   * Générer rapport KPI détaillé
   */
  async generateDetailedReport(
    startDate: Date,
    endDate: Date,
    siteId?: string
  ): Promise<DetailedKPIReport> {
    const metrics = await this.calculateMetrics(startDate, endDate, siteId);

    // Calculer trends (vs période antérieure identique)
    const previousStartDate = new Date(startDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    const previousEndDate = new Date(endDate);
    previousEndDate.setMonth(previousEndDate.getMonth() - 1);

    const previousMetrics = await this.calculateMetrics(previousStartDate, previousEndDate, siteId);

    const trends = this.calculateTrends(metrics, previousMetrics);
    const benchmarks = await this.calculateBenchmarks(metrics, siteId);
    const topPerformers = await this.getTopPerformers(startDate, endDate, siteId);
    const improvements = this.identifyImprovementAreas(metrics, trends);

    return {
      period: { startDate, endDate },
      metrics,
      trends,
      benchmarks,
      topPerformers,
      improvements,
    };
  }

  /**
   * Calculer trends vs période antérieure
   */
  private calculateTrends(current: KPIMetrics, previous: KPIMetrics): KPITrend[] {
    return [
      {
        metric: 'Average Resolution Time',
        currentValue: current.averageResolutionTime,
        previousValue: previous.averageResolutionTime,
        percentageChange: this.calculatePercentageChange(
          current.averageResolutionTime,
          previous.averageResolutionTime
        ),
        trend:
          current.averageResolutionTime < previous.averageResolutionTime ? 'up' : 'down',
        target: this.KPI_TARGETS.averageResolutionTime,
        variance:
          ((current.averageResolutionTime - this.KPI_TARGETS.averageResolutionTime) /
            this.KPI_TARGETS.averageResolutionTime) *
          100,
      },
      {
        metric: 'NPS Score',
        currentValue: current.npsScore,
        previousValue: previous.npsScore,
        percentageChange: this.calculatePercentageChange(current.npsScore, previous.npsScore),
        trend: current.npsScore > previous.npsScore ? 'up' : 'down',
        target: this.KPI_TARGETS.npsScore,
        variance: current.npsScore - this.KPI_TARGETS.npsScore,
      },
      {
        metric: 'Occupancy Rate',
        currentValue: current.occupancyRate * 100,
        previousValue: previous.occupancyRate * 100,
        percentageChange: this.calculatePercentageChange(
          current.occupancyRate,
          previous.occupancyRate
        ),
        trend: current.occupancyRate > previous.occupancyRate ? 'up' : 'down',
        target: 95,
        variance: (current.occupancyRate * 100 - 95) / 95,
      },
    ];
  }

  /**
   * Calculer benchmarks vs industrie
   */
  private async calculateBenchmarks(metrics: KPIMetrics, siteId?: string): Promise<Benchmark[]> {
    // TODO: Intégrer données benchmark industrie (via API externe ou DB)
    // Pour maintenant: valeurs de référence génériques

    return [
      {
        metric: 'Average Resolution Time',
        yourValue: metrics.averageResolutionTime,
        industryAverage: 60,
        topPerformer: 30,
        position: metrics.averageResolutionTime < 60 ? 'above' : 'below',
      },
      {
        metric: 'NPS Score',
        yourValue: metrics.npsScore,
        industryAverage: 35,
        topPerformer: 70,
        position: metrics.npsScore > 35 ? 'above' : 'below',
      },
      {
        metric: 'Occupancy Rate',
        yourValue: metrics.occupancyRate * 100,
        industryAverage: 85,
        topPerformer: 98,
        position: metrics.occupancyRate > 0.85 ? 'above' : 'below',
      },
    ];
  }

  /**
   * Identifier top performers
   */
  private async getTopPerformers(
    startDate: Date,
    endDate: Date,
    siteId?: string
  ): Promise<Performer[]> {
    let query = `
      SELECT 
        a.name as agent,
        a.site_id,
        'Contracts Managed'::text as metric,
        COUNT(c.id)::numeric as value,
        ROW_NUMBER() OVER (ORDER BY COUNT(c.id) DESC) as rank
      FROM agents a
      LEFT JOIN contracts c ON a.id = c.agent_id AND c.created_at >= $1 AND c.created_at <= $2
    `;

    const params: any[] = [startDate, endDate];

    if (siteId) {
      query += ` WHERE a.site_id = $${params.length + 1}`;
      params.push(siteId);
    }

    query += ` GROUP BY a.id, a.name, a.site_id
               ORDER BY value DESC
               LIMIT 10`;

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      agent: row.agent,
      siteId: row.site_id,
      metric: row.metric,
      value: parseFloat(row.value),
      rank: row.rank,
    }));
  }

  /**
   * Identifier domaines d'amélioration
   */
  private identifyImprovementAreas(
    metrics: KPIMetrics,
    trends: KPITrend[]
  ): ImprovementArea[] {
    const areas: ImprovementArea[] = [];

    if (metrics.averageResolutionTime > this.KPI_TARGETS.averageResolutionTime) {
      areas.push({
        area: 'Contract Resolution Speed',
        currentScore: this.KPI_TARGETS.averageResolutionTime / metrics.averageResolutionTime,
        targetScore: 1.0,
        priority: metrics.averageResolutionTime > 60 ? 'high' : 'medium',
        recommendation: 'Streamline contract approval process, add more agents',
        estimatedImpact: 'Could reduce resolution time by 20-30%',
      });
    }

    if (metrics.npsScore < this.KPI_TARGETS.npsScore) {
      areas.push({
        area: 'Customer Satisfaction (NPS)',
        currentScore: metrics.npsScore,
        targetScore: this.KPI_TARGETS.npsScore,
        priority: metrics.npsScore < 0 ? 'critical' : 'high',
        recommendation: 'Improve agent training, enhance communication',
        estimatedImpact: 'Could improve NPS by 20-25 points',
      });
    }

    if (metrics.paymentCollectionRate < this.KPI_TARGETS.paymentCollectionRate) {
      areas.push({
        area: 'Payment Collection',
        currentScore: metrics.paymentCollectionRate,
        targetScore: this.KPI_TARGETS.paymentCollectionRate,
        priority: 'high',
        recommendation: 'Automated reminders, late fee policies',
        estimatedImpact: 'Could improve collection by 10-15%',
      });
    }

    return areas;
  }

  /**
   * Helper: calculer % de changement
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
}

export default AdvancedKPIService;
