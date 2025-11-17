const request = require('supertest');

const REQUIRED_ENV = ['TEST_JWT', 'TEST_DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(
    `[premiumDashboard.e2e] Variables manquantes (${missingEnv.join(', ')}). Tests ignorés.`
  );

  describe.skip('Premium dashboards', () => {
    it('skipped due to missing env', () => {});
  });
} else {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const app = require('../src/index');

  /**
   * E2E Test multi-années + export PDF (backend routes)
   * Nécessite une base remplie (2015-2025)
   */

  describe('Premium dashboards', () => {
    it('should return multi-year stats', async () => {
    const response = await request(app)
      .get('/api/premium/stats?startYear=2015&endYear=2025')
      .set('Authorization', `Bearer ${process.env.TEST_JWT}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totals');
    expect(Array.isArray(response.body.yearlyBreakdown)).toBe(true);
  });

    it('should generate PDF export', async () => {
      const response = await request(app)
        .get('/api/pdf/rapports-premium?startYear=2015&endYear=2025')
        .set('Authorization', `Bearer ${process.env.TEST_JWT}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('application/pdf');
    });
  });
}
