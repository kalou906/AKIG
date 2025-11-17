import db from '../db';
import { User } from '../models/types';

export class BillingService {
  constructor() {}

  async generateMonthlyInvoices(month: string): Promise<void> {
    // Récupération tous les contrats actifs
    const contrats = await db.query(
      `SELECT * FROM contracts WHERE status = $1 AND to_char(start_date, 'YYYY-MM') <= $2`,
      ['active', month]
    );
    // Génération par lot pour éviter timeout
    const batches = [];
    for (let i = 0; i < contrats.rows.length; i += 50) {
      batches.push(contrats.rows.slice(i, i + 50));
    }
    for (const batch of batches) {
      await Promise.all(
        batch.map((contrat: any) =>
          this.createFacture(
            { id: 'system', role: 'PDG' } as User,
            {
              locataireId: contrat.tenant_id,
              proprietaireId: contrat.owner_id,
              montant: contrat.loyer,
              dateEcheance: this.getLastDayOfMonth(month)
            }
          )
        )
      );
    }
  }

  async calculatePenalties(month: string): Promise<void> {
    await db.query(`
      INSERT INTO penalties (locataire_id, amount, status, created_at)
      SELECT 
        f.tenant_id,
        (f.amount * 0.10 * GREATEST(DATE_PART('day', NOW() - f.due_date), 0)) as amount,
        'pending',
        NOW()
      FROM factures f
      WHERE f.status = 'impaye' 
        AND f.due_date < NOW() - INTERVAL '7 days'
        AND to_char(f.due_date, 'YYYY-MM') = $1
      ON CONFLICT (locataire_id) DO UPDATE SET amount = EXCLUDED.amount
    `, [month]);
  }

  private getLastDayOfMonth(month: string): string {
    const [year, m] = month.split('-').map(Number);
    return new Date(year, m, 0).toISOString().slice(0, 10);
  }

  private async createFacture(user: User, data: any) {
    // TODO: Implémenter la création de facture réelle
    return Promise.resolve();
  }
}
