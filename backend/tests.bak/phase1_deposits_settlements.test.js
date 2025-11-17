/**
 * 🧪 PHASE 1 TESTS - Deposits & Settlements
 * File: backend/tests/deposits_settlements.test.js
 */

const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/db');
const DepositService = require('../src/services/DepositService');
const SettlementService = require('../src/services/SettlementService');

describe('PHASE 1 - Deposits & Settlements', () => {
  let testToken;
  let testContractId;
  let testDepositId;
  let testSettlementId;

  beforeAll(async () => {
    // Création du token de test
    testToken = 'test_token_jwt';
    
    // Créer un contrat de test
    const contractResult = await pool.query(
      `INSERT INTO rental_contracts (property_id, tenant_id, contract_number, monthly_rent, start_date, end_date)
       VALUES (1, 1, 'TEST-001', 1000.00, '2025-01-01', '2026-01-01')
       RETURNING id`
    );
    testContractId = contractResult.rows[0].id;
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await pool.query('DELETE FROM security_deposits WHERE contract_id = $1', [testContractId]);
    await pool.query('DELETE FROM rental_contracts WHERE id = $1', [testContractId]);
    await pool.end();
  });

  // ========== DEPOSITS TESTS ==========
  describe('Deposits API', () => {
    test('POST /api/deposits/manage - Créer un dépôt', async () => {
      const response = await request(app)
        .post('/api/deposits/manage')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          contract_id: testContractId,
          property_id: 1,
          tenant_id: 1,
          deposit_amount: 2000,
          payment_date: '2025-01-01',
          status: 'active',
          notes: 'Dépôt initial'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deposit_amount).toBe('2000.00');
      
      testDepositId = response.body.data.id;
    });

    test('GET /api/deposits - Lister les dépôts', async () => {
      const response = await request(app)
        .get('/api/deposits?status=active')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/deposits/:id/details - Obtenir détails du dépôt', async () => {
      const response = await request(app)
        .get(`/api/deposits/${testDepositId}/details`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deposit_amount).toBe('2000.00');
    });

    test('POST /api/deposits/:id/movement - Enregistrer un mouvement', async () => {
      const response = await request(app)
        .post(`/api/deposits/${testDepositId}/movement`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          movement_type: 'deduct',
          amount: 50,
          reason: 'cleaning',
          description: 'Nettoyage après départ',
          reference_date: '2026-01-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.movement_type).toBe('deduct');
      expect(response.body.data.amount).toBe('50');
    });

    test('GET /api/deposits/:id/deductions - Obtenir les déductions', async () => {
      const response = await request(app)
        .get(`/api/deposits/${testDepositId}/deductions`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deductions.length).toBeGreaterThan(0);
    });

    test('POST /api/deposits/:id/return - Rembourser un dépôt', async () => {
      const response = await request(app)
        .post(`/api/deposits/${testDepositId}/return`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          return_date: '2026-01-15',
          deductions: [
            { amount: 50, type: 'cleaning', description: 'Nettoyage' }
          ],
          method: 'bank_transfer',
          notes: 'Remboursement final'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deposit.status).toBe('returned');
      expect(response.body.data.refund_amount).toBe(1950);
    });
  });

  // ========== SETTLEMENTS TESTS ==========
  describe('Settlements API', () => {
    test('POST /api/settlements/annual - Effectuer un règlement annuel', async () => {
      const response = await request(app)
        .post('/api/settlements/annual')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          contract_id: testContractId,
          settlement_year: 2025,
          charges: [
            {
              type: 'water',
              provisioning_paid: 120,
              actual_cost: 150
            },
            {
              type: 'electricity',
              provisioning_paid: 240,
              actual_cost: 280
            }
          ],
          settlement_date: '2026-01-15',
          notes: 'Règlement 2025'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.totals.balance).toBe(70); // 150-120 + 280-240
      expect(response.body.data.charges_breakdown.length).toBe(2);

      testSettlementId = response.body.data.settlement_id;
    });

    test('GET /api/settlements/:contractId/report - Obtenir rapport de règlement', async () => {
      const response = await request(app)
        .get(`/api/settlements/${testContractId}/report?year=2025`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.settlement.settlement_year).toBe(2025);
      expect(response.body.data.charges_breakdown.length).toBeGreaterThan(0);
    });

    test('GET /api/settlements/:contractId/list - Lister les règlements', async () => {
      const response = await request(app)
        .get(`/api/settlements/${testContractId}/list?year=2025`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/settlements/:contractId/statement - Générer un décompte', async () => {
      const response = await request(app)
        .get(`/api/settlements/${testContractId}/statement?year=2025`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toContain('2025');
      expect(response.body.data.charges_details).toBeDefined();
    });

    test('PATCH /api/settlements/:id/approve - Approuver un règlement', async () => {
      const response = await request(app)
        .patch(`/api/settlements/${testSettlementId}/approve`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          approved_by: 'manager_user',
          approval_date: '2026-01-20',
          notes: 'Approuvé après vérification'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('approved');
    });
  });

  // ========== SERVICE TESTS ==========
  describe('DepositService', () => {
    test('manageDeposit should create deposit', async () => {
      const deposit = await DepositService.manageDeposit({
        contract_id: testContractId,
        deposit_amount: 1500,
        payment_date: '2025-01-10',
        status: 'active',
        notes: 'Test dépôt service'
      });

      expect(deposit).toBeDefined();
      expect(deposit.deposit_amount).toBe('1500.00');
    });

    test('recordMovement should register deposit movement', async () => {
      const deposits = await DepositService.listDeposits({ status: 'active' });
      if (deposits.length > 0) {
        const depositId = deposits[0].id;
        
        const movement = await DepositService.recordMovement(depositId, {
          movement_type: 'hold',
          amount: 100,
          reason: 'potential_damage',
          description: 'Inspection damage'
        });

        expect(movement).toBeDefined();
        expect(movement.movement_type).toBe('hold');
      }
    });

    test('getDepositDetails should return full deposit info', async () => {
      const deposits = await DepositService.listDeposits({ status: 'active' });
      if (deposits.length > 0) {
        const details = await DepositService.getDepositDetails(deposits[0].id);
        
        expect(details).toBeDefined();
        expect(details.movements).toBeDefined();
        expect(Array.isArray(details.movements)).toBe(true);
      }
    });
  });

  describe('SettlementService', () => {
    test('calculateProvisioning should calculate charges', async () => {
      const provision = await SettlementService.calculateProvisioning(testContractId, {
        charge_type: 'water',
        monthly_amount: 15,
        start_date: '2025-01-01'
      });

      expect(provision).toBeDefined();
      expect(provision.charge_type).toBe('water');
      expect(provision.calculations).toBeDefined();
    });

    test('listSettlements should return settlements', async () => {
      const settlements = await SettlementService.listSettlements(testContractId);
      
      expect(Array.isArray(settlements)).toBe(true);
    });
  });
});
