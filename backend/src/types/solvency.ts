export type RiskLevel = 'EXCELLENT' | 'GOOD' | 'MEDIUM' | 'RISKY' | 'CRITICAL' | 'UNKNOWN';

export interface ScoreFactors {
  type: 'HIGH_DELAY' | 'LOW_PAYMENT_PROBABILITY' | 'INSUFFICIENT_DATA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  total_revenue: number;
  created_at: Date;
}

export interface SolvencyScore {
  tenant_id: string;
  payment_probability: number;
  risk_level: RiskLevel;
  badge: string;
  color: string;
  expected_payment_date: string;
  confidence_score: number;
  factors: ScoreFactors[];
  tenant_info?: {
    name: string;
    total_revenue: number;
    payment_history_months: number;
  };
  calculated_at: string;
}
