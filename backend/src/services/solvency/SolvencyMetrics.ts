import { ISolvencyMetrics } from './interfaces';
import { Counter, Histogram, Gauge } from 'prom-client';
import { SolvencyScore } from '../../types/solvency';

export class SolvencyMetrics implements ISolvencyMetrics {
  private predictionsCounter = new Counter({
    name: 'solvency_predictions_total',
    help: 'Total solvency predictions by risk level',
    labelNames: ['risk_level', 'tenant_id'],
  });

  private predictionDuration = new Histogram({
    name: 'solvency_prediction_duration_seconds',
    help: 'Prediction processing time',
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  });

  private cacheHitCounter = new Counter({
    name: 'solvency_cache_hits_total',
    help: 'Cache hit count',
  });

  private cacheMissCounter = new Counter({
    name: 'solvency_cache_misses_total',
    help: 'Cache miss count',
  });

  private latestScoreGauge = new Gauge({
    name: 'solvency_latest_score',
    help: 'Latest solvency score',
    labelNames: ['tenant_id', 'risk_level'],
  });

  recordPrediction(score: SolvencyScore, durationMs: number): void {
    this.predictionsCounter.inc({
      risk_level: score.risk_level,
      tenant_id: score.tenant_id,
    });
    this.predictionDuration.observe(durationMs / 1000);
    this.latestScoreGauge.set(
      { tenant_id: score.tenant_id, risk_level: score.risk_level },
      score.payment_probability
    );
  }

  recordCacheHit(): void {
    this.cacheHitCounter.inc();
  }

  recordCacheMiss(): void {
    this.cacheMissCounter.inc();
  }
}
