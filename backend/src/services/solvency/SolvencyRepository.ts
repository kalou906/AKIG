import { ISolvencyRepository } from './interfaces';
import { SolvencyScore } from '../../types/solvency';
const db = require('../../db');

export class SolvencyRepository implements ISolvencyRepository {

  async save(score: SolvencyScore): Promise<void> {
    const query = `
      INSERT INTO solvency_scores (
        tenant_id, payment_probability, risk_level, badge, color,
        expected_payment_date, confidence_score, factors, tenant_info, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await db.query(query, [
      score.tenant_id,
      score.payment_probability,
      score.risk_level,
      score.badge,
      score.color,
      score.expected_payment_date,
      score.confidence_score,
      JSON.stringify(score.factors),
      score.tenant_info ? JSON.stringify(score.tenant_info) : null,
      score.calculated_at,
    ]);
  }

  async getHistory(tenantId: string, limit: number): Promise<SolvencyScore[]> {
    const query = `
      SELECT * FROM solvency_scores
      WHERE tenant_id = $1
      ORDER BY calculated_at DESC
      LIMIT $2
    `;
    const result = await db.query(query, [tenantId, limit]);
    return result.rows.map(this.deserialize);
  }

  async getLatest(tenantId: string): Promise<SolvencyScore | null> {
    const query = `
      SELECT * FROM solvency_scores
      WHERE tenant_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [tenantId]);
    return result.rows[0] ? this.deserialize(result.rows[0]) : null;
  }

  private deserialize(row: any): SolvencyScore {
    return {
      ...row,
      factors: JSON.parse(row.factors),
      tenant_info: row.tenant_info ? JSON.parse(row.tenant_info) : undefined,
    };
  }
}
