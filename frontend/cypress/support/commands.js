// frontend/cypress/support/commands.js
// Add custom commands here

/**
 * Commande pour se connecter en tant que locataire
 */
Cypress.Commands.add('loginAsTenant', () => {
  cy.visit('/login');
  cy.get('input[name="email"]').type('tenant@example.com');
  cy.get('input[name="password"]').type('password123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

/**
 * Commande pour se connecter en tant que propriétaire
 */
Cypress.Commands.add('loginAsOwner', () => {
  cy.visit('/login');
  cy.get('input[name="email"]').type('owner@example.com');
  cy.get('input[name="password"]').type('password123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

/**
 * Commande pour se déconnecter
 */
Cypress.Commands.add('logout', () => {
  cy.get('button[data-testid="logout-btn"]').click();
  cy.url().should('include', '/login');
});

/**
 * Commande pour vérifier un message d'erreur
 */
Cypress.Commands.add('verifyError', (message) => {
  cy.get('[data-testid="error-message"]').should('contain', message);
});

/**
 * Commande pour vérifier un message de succès
 */
Cypress.Commands.add('verifySuccess', (message) => {
  cy.get('[data-testid="success-message"]').should('contain', message);
});
