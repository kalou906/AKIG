import { DatabaseError, ValidationError } from '../../utils/errors';
import { TenantFeatures, SolvencyConfig, ISolvencyCalculator, ISolvencyRepository, ISolvencyCache, ISolvencyMetrics } from './interfaces';
import { SolvencyScore } from '../../types/solvency';
const db = require('../../db');

export class SolvencyService {
  constructor(
    private calculator: ISolvencyCalculator,
    private repository: ISolvencyRepository,
    private cache: ISolvencyCache,
    private metrics: ISolvencyMetrics,
  ) {}

  async calculateScore(
    tenantId: string,
    config: SolvencyConfig = { detailed: false, recalculate: false }
  ): Promise<SolvencyScore> {
    const startTime = Date.now();
    const cacheKey = `solvency:${tenantId}:${config.detailed ? 'detailed' : 'simple'}`;
    try {
      if (!config.recalculate) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.metrics.recordCacheHit();
          console.debug('Cache hit', { tenantId });
          return cached;
        }
      }
      this.metrics.recordCacheMiss();
      const features = await this.fetchTenantFeatures(tenantId);
      if (!this.hasSufficientData(features)) {
        throw new ValidationError(`Données insuffisantes pour le tenant ${tenantId}`);
      }
      const calculation = await this.calculator.calculate(features);
      const score = this.buildScore(tenantId, calculation, config);
      await this.repository.save(score);
      await this.cache.set(cacheKey, score, 300);
      this.triggerRiskAlerts(score).catch((err) => console.error('Alerting failed', { tenantId, error: (err as any)?.message }));
      const durationMs = Date.now() - startTime;
      this.metrics.recordPrediction(score, durationMs);
      console.info('Score calculated successfully', {
        tenantId,
        riskLevel: score.risk_level,
        durationMs,
      });
      return score;
    } catch (error) {
      const e: any = error;
      console.error('Score calculation failed', { tenantId, error: e?.message });
      throw e instanceof DatabaseError ? e : new DatabaseError(e?.message || 'Erreur');
    }
  }

  async getScoreHistory(
    tenantId: string,
    options: { limit?: number; fromDate?: Date } = {}
  ): Promise<SolvencyScore[]> {
    return this.repository.getHistory(tenantId, options.limit || 50);
  }

  async updateScore(tenantId: string): Promise<SolvencyScore> {
    await this.cache.invalidate(`solvency:${tenantId}:*`);
    return this.calculateScore(tenantId, { recalculate: true });
  }

  private async fetchTenantFeatures(tenantId: string): Promise<TenantFeatures> {
    const query = `
      WITH tenant_stats AS (
        SELECT 
          t.id,
          t.name,
          t.revenue,
          COUNT(tr.id) as transaction_count,
          AVG(tr.delay_days) as avg_delay,
          SUM(tr.amount_due) as total_due,
          SUM(tr.amount_paid) as total_paid,
          MAX(tr.due_date) as last_transaction_date
        FROM tenants t
        LEFT JOIN transactions tr ON tr.client_id = t.id
        WHERE t.id = $1
        GROUP BY t.id
      )
      SELECT * FROM tenant_stats
    `;
    const result = await db.query(query, [tenantId]);
    const row = result.rows[0] || {};
    return {
      tenantId: row.id,
      name: row.name,
      revenue: Number(row.revenue || 0),
      transactionCount: Number(row.transaction_count || 0),
      avgDelay: Number(row.avg_delay || 0),
      totalDue: Number(row.total_due || 0),
      totalPaid: Number(row.total_paid || 0),
      lastTransactionDate: row.last_transaction_date ? new Date(row.last_transaction_date) : new Date(0),
    };
  }

  private hasSufficientData(features: TenantFeatures): boolean {
    return features.transactionCount >= 3;
  }

  private buildScore(
    tenantId: string,
    calculation: any,
    config: SolvencyConfig
  ): SolvencyScore {
    return {
      tenant_id: tenantId,
      payment_probability: calculation.probability,
      risk_level: calculation.riskLevel,
      badge: this.getBadge(calculation.riskLevel),
      color: this.getColor(calculation.riskLevel),
      expected_payment_date: calculation.expectedDate.toISOString(),
      confidence_score: calculation.confidence,
      factors: calculation.factors,
      tenant_info: config.detailed ? calculation.tenantInfo : undefined,
      calculated_at: new Date().toISOString(),
    };
  }

  private async triggerRiskAlerts(score: SolvencyScore): Promise<void> {
    if (score.risk_level === 'CRITICAL') {
      // TODO: enqueue alert job if needed (BullMQ)
      void score;
    }
  }

  private getBadge(level: string): string {
    const badges: Record<string, string> = {
      EXCELLENT: '🟢',
      GOOD: '🟡',
      MEDIUM: '🟠',
      RISKY: '🔴',
      CRITICAL: '⚫',
      UNKNOWN: '⚪',
    };
    return badges[level] || '⚪';
  }

  private getColor(level: string): string {
    const colors: Record<string, string> = {
      EXCELLENT: '#10b981',
      GOOD: '#f59e0b',
      MEDIUM: '#f97316',
      RISKY: '#ef4444',
      CRITICAL: '#000000',
      UNKNOWN: '#9ca3af',
    };
    return colors[level] || '#9ca3af';
  }
}
