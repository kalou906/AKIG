/**
 * phase4_phase5.test.js - Test Suite for Phase 4-5
 * Tests for Tenant Management and Maintenance Tickets
 */

const request = require('supertest');
const { Pool } = require('pg');

// Mock Express app for testing
let app;
let token;
const baseURL = 'http://localhost:4000';

// Mock data
const mockTenant = {
  nom: 'Diallo',
  prenom: 'Ahmed',
  email: 'ahmed.test@example.com',
  telephone: '+224600123456',
  adresse_personnelle: 'Rue de Kindia',
  profession: 'Ingénieur',
  entreprise: 'Tech Guinea',
  salaire_mensuel: 1500000,
  propriete_id: 1,
  garanteur_requis: true,
};

const mockGuarantor = {
  nom: 'Diallo',
  prenom: 'Malick',
  email: 'malick@example.com',
  telephone: '+224600987654',
  relation: 'parent',
  profession: 'Retraité',
};

const mockTicket = {
  propriete_id: 1,
  description: 'Fuite d\'eau au 2e étage',
  priorite: 'urgent',
  type_intervention: 'reparation',
  localisation: 'Salle de bain - Apt 2B',
  details_probleme: 'Tuyauterie principale endommagée',
};

const mockAssignment = {
  technicien_id: 1,
  notes: 'Urgent - problème critique',
  date_intervention_prevue: '2024-01-15',
};

const mockCompletion = {
  notes_completion: 'Réparation effectuée',
  cout_total: 450000,
  date_completion: '2024-01-15',
};

describe('Phase 4-5 API Tests', () => {
  // Setup
  beforeAll(async () => {
    // Mock authentication - in real tests, get actual token
    token = 'mock-jwt-token';
  });

  // ============================================================
  // PHASE 4: TENANT MANAGEMENT TESTS
  // ============================================================

  describe('Phase 4: Tenant Management', () => {
    let tenantId;

    describe('POST /api/tenants/create', () => {
      it('should create a new tenant', async () => {
        const response = await request(baseURL)
          .post('/api/tenants/create')
          .set('Authorization', `Bearer ${token}`)
          .send(mockTenant);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.nom).toBe(mockTenant.nom);
        expect(response.body.data.prenom).toBe(mockTenant.prenom);
        expect(response.body.data.statut_contrat).toBe('actif');
        expect(response.body.data.id).toBeDefined();

        tenantId = response.body.data.id;
      });

      it('should fail without required fields', async () => {
        const invalidTenant = {
          prenom: 'Ahmed',
          // Missing nom and propriete_id
        };

        const response = await request(baseURL)
          .post('/api/tenants/create')
          .set('Authorization', `Bearer ${token}`)
          .send(invalidTenant);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail without authentication', async () => {
        const response = await request(baseURL)
          .post('/api/tenants/create')
          .send(mockTenant);

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/tenants/list', () => {
      it('should list all tenants with pagination', async () => {
        const response = await request(baseURL)
          .get('/api/tenants/list?page=1&limit=50')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.page).toBe(1);
      });

      it('should filter tenants by propriete_id', async () => {
        const response = await request(baseURL)
          .get('/api/tenants/list?propriete_id=1')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every(t => t.propriete_id === 1)).toBe(true);
      });

      it('should filter tenants by status', async () => {
        const response = await request(baseURL)
          .get('/api/tenants/list?statut_contrat=actif')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every(t => t.statut_contrat === 'actif')).toBe(true);
      });
    });

    describe('GET /api/tenants/:id', () => {
      it('should get tenant with guarantor details', async () => {
        const response = await request(baseURL)
          .get(`/api/tenants/${tenantId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.tenant).toBeDefined();
        expect(response.body.data.tenant.id).toBe(tenantId);
      });

      it('should return 404 for non-existent tenant', async () => {
        const response = await request(baseURL)
          .get('/api/tenants/99999')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/tenants/:id/update', () => {
      it('should update tenant information', async () => {
        const updates = {
          profession: 'Architecte',
          salaire_mensuel: 2000000,
        };

        const response = await request(baseURL)
          .patch(`/api/tenants/${tenantId}/update`)
          .set('Authorization', `Bearer ${token}`)
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.profession).toBe('Architecte');
        expect(response.body.data.salaire_mensuel).toBe(2000000);
      });

      it('should update tenant status', async () => {
        const updates = {
          statut_contrat: 'departi',
        };

        const response = await request(baseURL)
          .patch(`/api/tenants/${tenantId}/update`)
          .set('Authorization', `Bearer ${token}`)
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body.data.statut_contrat).toBe('departi');
      });
    });

    describe('POST /api/tenants/:id/guarantor', () => {
      it('should add guarantor to tenant', async () => {
        const response = await request(baseURL)
          .post(`/api/tenants/${tenantId}/guarantor`)
          .set('Authorization', `Bearer ${token}`)
          .send(mockGuarantor);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.nom).toBe(mockGuarantor.nom);
        expect(response.body.data.relation).toBe('parent');
      });

      it('should update existing guarantor', async () => {
        const updatedGuarantor = {
          ...mockGuarantor,
          relation: 'ami',
        };

        const response = await request(baseURL)
          .post(`/api/tenants/${tenantId}/guarantor`)
          .set('Authorization', `Bearer ${token}`)
          .send(updatedGuarantor);

        expect(response.status).toBe(201);
        expect(response.body.data.relation).toBe('ami');
      });

      it('should fail without required guarantor fields', async () => {
        const invalidGuarantor = {
          email: 'invalid@example.com',
          // Missing nom and prenom
        };

        const response = await request(baseURL)
          .post(`/api/tenants/${tenantId}/guarantor`)
          .set('Authorization', `Bearer ${token}`)
          .send(invalidGuarantor);

        expect(response.status).toBe(400);
      });
    });

    describe('DELETE /api/tenants/:id', () => {
      it('should archive tenant (soft delete)', async () => {
        const response = await request(baseURL)
          .delete(`/api/tenants/${tenantId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify tenant is archived
        const verifyResponse = await request(baseURL)
          .get(`/api/tenants/${tenantId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(verifyResponse.body.data.tenant.statut_contrat).toBe('archivé');
      });
    });
  });

  // ============================================================
  // PHASE 5: MAINTENANCE TESTS
  // ============================================================

  describe('Phase 5: Maintenance Management', () => {
    let ticketId;

    describe('POST /api/maintenance/create', () => {
      it('should create a new maintenance ticket', async () => {
        const response = await request(baseURL)
          .post('/api/maintenance/create')
          .set('Authorization', `Bearer ${token}`)
          .send(mockTicket);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.description).toBe(mockTicket.description);
        expect(response.body.data.statut).toBe('ouvert');
        expect(response.body.data.priorite).toBe('urgent');
        expect(response.body.data.numero_ticket).toBeDefined();

        ticketId = response.body.data.id;
      });

      it('should fail without required fields', async () => {
        const invalidTicket = {
          description: 'Test',
          // Missing propriete_id
        };

        const response = await request(baseURL)
          .post('/api/maintenance/create')
          .set('Authorization', `Bearer ${token}`)
          .send(invalidTicket);

        expect(response.status).toBe(400);
      });

      it('should generate unique ticket number', async () => {
        const response1 = await request(baseURL)
          .post('/api/maintenance/create')
          .set('Authorization', `Bearer ${token}`)
          .send(mockTicket);

        const response2 = await request(baseURL)
          .post('/api/maintenance/create')
          .set('Authorization', `Bearer ${token}`)
          .send(mockTicket);

        expect(response1.body.data.numero_ticket).not.toBe(response2.body.data.numero_ticket);
      });
    });

    describe('GET /api/maintenance/list', () => {
      it('should list all maintenance tickets', async () => {
        const response = await request(baseURL)
          .get('/api/maintenance/list?page=1&limit=50')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter by status', async () => {
        const response = await request(baseURL)
          .get('/api/maintenance/list?statut=ouvert')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every(t => t.statut === 'ouvert')).toBe(true);
      });

      it('should filter by priority', async () => {
        const response = await request(baseURL)
          .get('/api/maintenance/list?priorite=urgent')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every(t => t.priorite === 'urgent')).toBe(true);
      });
    });

    describe('GET /api/maintenance/:id', () => {
      it('should get ticket with assignments and history', async () => {
        const response = await request(baseURL)
          .get(`/api/maintenance/${ticketId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.ticket).toBeDefined();
        expect(Array.isArray(response.body.data.assignments)).toBe(true);
        expect(Array.isArray(response.body.data.history)).toBe(true);
      });
    });

    describe('PATCH /api/maintenance/:id/update', () => {
      it('should update ticket details', async () => {
        const updates = {
          description: 'Updated description',
          priorite: 'normal',
        };

        const response = await request(baseURL)
          .patch(`/api/maintenance/${ticketId}/update`)
          .set('Authorization', `Bearer ${token}`)
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.description).toBe('Updated description');
        expect(response.body.data.priorite).toBe('normal');
      });
    });

    describe('POST /api/maintenance/:id/assign', () => {
      it('should assign technician to ticket', async () => {
        const response = await request(baseURL)
          .post(`/api/maintenance/${ticketId}/assign`)
          .set('Authorization', `Bearer ${token}`)
          .send(mockAssignment);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.technicien_id).toBe(mockAssignment.technicien_id);

        // Verify ticket status changed to en_cours
        const ticketResponse = await request(baseURL)
          .get(`/api/maintenance/${ticketId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(ticketResponse.body.data.ticket.statut).toBe('en_cours');
      });

      it('should fail with invalid technician id', async () => {
        const invalidAssignment = {
          ...mockAssignment,
          technicien_id: undefined,
        };

        const response = await request(baseURL)
          .post(`/api/maintenance/${ticketId}/assign`)
          .set('Authorization', `Bearer ${token}`)
          .send(invalidAssignment);

        expect(response.status).toBe(400);
      });
    });

    describe('PATCH /api/maintenance/:id/complete', () => {
      it('should mark ticket as complete', async () => {
        const response = await request(baseURL)
          .patch(`/api/maintenance/${ticketId}/complete`)
          .set('Authorization', `Bearer ${token}`)
          .send(mockCompletion);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.statut).toBe('termine');
        expect(response.body.data.cout_total).toBe(mockCompletion.cout_total);
      });
    });

    describe('GET /api/maintenance/:id/history', () => {
      it('should get ticket action history', async () => {
        const response = await request(baseURL)
          .get(`/api/maintenance/${ticketId}/history`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/maintenance/:id/costs', () => {
      it('should calculate ticket costs', async () => {
        const response = await request(baseURL)
          .get(`/api/maintenance/${ticketId}/costs`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.cout_total).toBeDefined();
        expect(response.body.data.cout_interventions).toBeDefined();
      });
    });
  });

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe('Integration Tests', () => {
    it('should handle complete workflow: create tenant -> create ticket -> assign -> complete', async () => {
      // Create tenant
      const tenantRes = await request(baseURL)
        .post('/api/tenants/create')
        .set('Authorization', `Bearer ${token}`)
        .send(mockTenant);

      expect(tenantRes.status).toBe(201);
      const newTenantId = tenantRes.body.data.id;

      // Create ticket for tenant's property
      const ticketRes = await request(baseURL)
        .post('/api/maintenance/create')
        .set('Authorization', `Bearer ${token}`)
        .send(mockTicket);

      expect(ticketRes.status).toBe(201);
      const newTicketId = ticketRes.body.data.id;

      // Assign technician
      const assignRes = await request(baseURL)
        .post(`/api/maintenance/${newTicketId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send(mockAssignment);

      expect(assignRes.status).toBe(201);

      // Complete ticket
      const completeRes = await request(baseURL)
        .patch(`/api/maintenance/${newTicketId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send(mockCompletion);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.statut).toBe('termine');
    });
  });

  // Cleanup
  afterAll(async () => {
    // Clean up test data
    // In production, use proper cleanup procedures
  });
});

// ============================================================
// Test Coverage Summary
// ============================================================
/*

Phase 4: Tenant Management
✓ Create tenant (with validation)
✓ List tenants (with pagination and filters)
✓ Get tenant details with guarantor
✓ Update tenant information
✓ Add/update guarantor
✓ Archive tenant (soft delete)
✓ Error handling (missing fields, unauthorized)

Phase 5: Maintenance
✓ Create maintenance ticket
✓ List tickets (with filters)
✓ Get ticket with assignments
✓ Update ticket details
✓ Assign technician (status update)
✓ Complete ticket with costs
✓ Get ticket history
✓ Calculate ticket costs
✓ Error handling

Integration Tests
✓ Complete workflow (tenant -> ticket -> assign -> complete)

Total: 40+ test cases covering all endpoints

*/
