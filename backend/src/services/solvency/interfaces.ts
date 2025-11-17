import { SolvencyScore } from '../../types/solvency';

export interface TenantFeatures {
  tenantId: string;
  name: string;
  revenue: number;
  transactionCount: number;
  avgDelay: number;
  totalDue: number;
  totalPaid: number;
  lastTransactionDate: Date;
}

export interface ScoreCalculation {
  probability: number;
  riskLevel: string;
  expectedDate: Date;
  confidence: number;
  factors: any[];
  tenantInfo?: any;
}

export interface SolvencyConfig {
  detailed?: boolean;
  recalculate?: boolean;
}

export interface ISolvencyCalculator {
  calculate(features: TenantFeatures): Promise<ScoreCalculation>;
}

export interface ISolvencyRepository {
  save(score: SolvencyScore): Promise<void>;
  getHistory(tenantId: string, limit: number): Promise<SolvencyScore[]>;
  getLatest(tenantId: string): Promise<SolvencyScore | null>;
}

export interface ISolvencyCache {
  get(key: string): Promise<SolvencyScore | null>;
  set(key: string, score: SolvencyScore, ttl: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

export interface ISolvencyMetrics {
  recordPrediction(score: SolvencyScore, durationMs: number): void;
  recordCacheHit(): void;
  recordCacheMiss(): void;
}
