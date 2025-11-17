// frontend/cypress/e2e/dashboard.cy.js
describe('Tableau de bord', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.loginAsTenant();
  });

  it('Affiche les statistiques du dashboard', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-testid="stat-active-contracts"]').should('exist');
    cy.get('[data-testid="stat-pending-payments"]').should('exist');
    cy.get('[data-testid="stat-monthly-revenue"]').should('exist');
  });

  it('Affiche le nombre de contrats actifs', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-testid="stat-active-contracts"]')
      .invoke('text')
      .should('match', /\d+/);
  });

  it('Affiche le montant des paiements en attente', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-testid="stat-pending-payments"]')
      .invoke('text')
      .should('match', /\d+/);
  });

  it('Affiche le revenu mensuel', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-testid="stat-monthly-revenue"]')
      .invoke('text')
      .should('match', /\d+/);
  });

  it('Contient les graphiques', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-testid="chart-revenue"]').should('exist');
    cy.get('[data-testid="chart-payments"]').should('exist');
  });

  it('Affiche les raccourcis vers les pages principales', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('a').contains('Contrats').should('exist');
    cy.get('a').contains('Paiements').should('exist');
    cy.get('a').contains('Rapports').should('exist');
  });
});

describe('Navigation depuis dashboard', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.loginAsTenant();
  });

  it('Navigue vers contrats', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('a').contains('Contrats').click();
    cy.url().should('include', '/contracts');
  });

  it('Navigue vers paiements', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('a').contains('Paiements').click();
    cy.url().should('include', '/payments');
  });

  it('Navigue vers rapports', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('a').contains('Rapports').click();
    cy.url().should('include', '/reports');
  });
});

describe('Authentification dashboard', () => {
  it('Redirige vers login si pas authentifié', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.url().should('include', '/login');
  });

  it('Affiche dashboard si authentifié', () => {
    cy.visit('http://localhost:3000');
    cy.loginAsTenant();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard-content"]').should('exist');
  });

  it('Déconnexion fonctionne', () => {
    cy.visit('http://localhost:3000');
    cy.loginAsTenant();
    cy.logout();
    cy.url().should('include', '/login');
  });
});
