// frontend/cypress/e2e/contracts.cy.js
describe('Gestion des contrats', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.loginAsOwner();
  });

  it('Affiche la liste des contrats', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('[data-testid="contracts-list"]').should('exist');
    cy.get('[data-testid="contract-item"]').should('have.length.greaterThan', 0);
  });

  it('Crée un nouveau contrat', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('button').contains('Nouveau Contrat').click();
    cy.get('input[name="property_name"]').type('Villa Mamadou');
    cy.get('input[name="tenant_name"]').type('Mariam Diallo');
    cy.get('input[name="start_date"]').type('2025-01-01');
    cy.get('input[name="end_date"]').type('2026-01-01');
    cy.get('input[name="monthly_rent"]').type('500000');
    cy.get('button').contains('Créer').click();
    cy.verifySuccess('Contrat créé');
  });

  it('Modifie le statut d\'un contrat', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('[data-testid="contract-item"]').first().click();
    cy.get('select[name="status"]').select('inactif');
    cy.get('button').contains('Enregistrer').click();
    cy.verifySuccess('Contrat mis à jour');
  });

  it('Affiche détails du contrat', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('[data-testid="contract-item"]').first().click();
    cy.get('[data-testid="contract-property"]').should('exist');
    cy.get('[data-testid="contract-tenant"]').should('exist');
    cy.get('[data-testid="contract-rent"]').should('exist');
    cy.get('[data-testid="contract-dates"]').should('exist');
  });

  it('Filtre les contrats actifs', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('select[name="status"]').select('actif');
    cy.get('[data-testid="contract-item"]').each(($contract) => {
      cy.wrap($contract).should('contain', 'Actif');
    });
  });

  it('Supprime un contrat', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('[data-testid="contract-item"]').first().within(() => {
      cy.get('button[data-testid="delete-btn"]').click();
    });
    cy.get('button').contains('Confirmer').click();
    cy.verifySuccess('Contrat supprimé');
  });
});

describe('Validation contrats', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.loginAsOwner();
  });

  it('Refuse création sans propriété', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('button').contains('Nouveau Contrat').click();
    cy.get('input[name="tenant_name"]').type('Mariam');
    cy.get('input[name="start_date"]').type('2025-01-01');
    cy.get('input[name="end_date"]').type('2026-01-01');
    cy.get('input[name="monthly_rent"]').type('500000');
    cy.get('button').contains('Créer').click();
    cy.verifyError('Propriété requise');
  });

  it('Refuse création avec date fin avant date début', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('button').contains('Nouveau Contrat').click();
    cy.get('input[name="property_name"]').type('Villa');
    cy.get('input[name="tenant_name"]').type('Mariam');
    cy.get('input[name="start_date"]').type('2026-01-01');
    cy.get('input[name="end_date"]').type('2025-01-01');
    cy.get('input[name="monthly_rent"]').type('500000');
    cy.get('button').contains('Créer').click();
    cy.verifyError('Date fin après date début');
  });

  it('Refuse loyer négatif', () => {
    cy.visit('http://localhost:3000/contracts');
    cy.get('button').contains('Nouveau Contrat').click();
    cy.get('input[name="property_name"]').type('Villa');
    cy.get('input[name="tenant_name"]').type('Mariam');
    cy.get('input[name="start_date"]').type('2025-01-01');
    cy.get('input[name="end_date"]').type('2026-01-01');
    cy.get('input[name="monthly_rent"]').type('-5000');
    cy.get('button').contains('Créer').click();
    cy.verifyError('Loyer invalide');
  });
});
