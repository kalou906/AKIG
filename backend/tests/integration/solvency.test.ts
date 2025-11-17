import { CalculateSolvencyUseCase } from '../../src/domain/use-cases/calculate-solvency';

describe('CalculateSolvencyUseCase', () => {
  it('should calculate correct score for tenant', async () => {
    const db: any = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [
          { date_paiement: '2024-01-15', date_echeance: '2024-01-10' }
        ] })
        .mockResolvedValueOnce({ rows: [ { loyer: 1000, duree: 12 } ] })
        .mockResolvedValueOnce({ rows: [ { total: 0 } ] })
    };
    const useCase = new CalculateSolvencyUseCase(db);
    const result = await useCase.execute(123);
    expect(result.score).toBe(0);
    expect(result.details.penalties).toBe(0);
  });
});
