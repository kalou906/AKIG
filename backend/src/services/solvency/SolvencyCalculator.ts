import { ISolvencyCalculator, TenantFeatures, ScoreCalculation } from './interfaces';

export class SolvencyCalculator implements ISolvencyCalculator {
  async calculate(features: TenantFeatures): Promise<ScoreCalculation> {
    // Exemple simple : score basé sur le retard moyen
    const probability = features.avgDelay < 10 ? 0.9 : 0.5;
    const riskLevel = probability > 0.8 ? 'EXCELLENT' : (probability > 0.6 ? 'GOOD' : (probability > 0.4 ? 'MEDIUM' : (probability > 0.2 ? 'RISKY' : 'CRITICAL')));
    return {
      probability,
      riskLevel,
      expectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      confidence: 0.8,
      factors: [
        features.avgDelay > 15 ? { type: 'HIGH_DELAY', severity: 'HIGH', message: `Retard moyen: ${features.avgDelay.toFixed(1)} jours` } : null
      ].filter(Boolean),
      tenantInfo: {
        name: features.name,
        totalRevenue: features.revenue,
        transactionCount: features.transactionCount,
      },
    };
  }
}
