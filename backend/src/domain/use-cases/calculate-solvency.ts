// Use-case métier : calcul de la solvabilité d'un locataire
import { Pool } from 'pg';

export class CalculateSolvencyUseCase {
  constructor(private db: Pool) {}

  // Idempotent & Pure
  async execute(locataireId: number): Promise<{ score: number; details: any }> {
    // Récupération paiements et contrat actif
    const payments = await this.db.query(
      'SELECT date_paiement, date_echeance FROM paiements WHERE locataire_id = $1',
      [locataireId]
    );
    const contract = await this.db.query(
      'SELECT loyer, duree FROM contracts WHERE tenant_id = $1 AND status = $2 LIMIT 1',
      [locataireId, 'active']
    );
    if (!contract.rows.length) throw new Error('Contrat introuvable');

    // Calcul du score (paiements à l'heure)
    const paidOnTime = payments.rows.filter(
      (p: any) => new Date(p.date_paiement) <= new Date(p.date_echeance)
    ).length;
    const score = payments.rows.length
      ? Math.round((paidOnTime / payments.rows.length) * 100)
      : 0;

    // Pénalités en attente
    const penalties = await this.db.query(
      'SELECT SUM(amount) as total FROM penalties WHERE locataire_id = $1 AND status = $2',
      [locataireId, 'pending']
    );

    return {
      score,
      details: {
        totalPaid: payments.rows.length,
        totalDue: contract.rows[0].loyer * contract.rows[0].duree,
        penalties: Number(penalties.rows[0]?.total || 0)
      }
    };
  }
}
