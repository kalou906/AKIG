// frontend/cypress/e2e/errorflow.cy.js
describe('Paiement refusé', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('Affiche message et ne génère pas de reçu', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="pay-om"]').first().click();
    cy.visit('http://localhost:3000/payment/failure');
    cy.contains('Paiement refusé').should('exist');
    cy.contains('Reçu').should('not.exist');
  });

  it('Affiche raison de refus de paiement', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="pay-invalid"]').click();
    cy.visit('http://localhost:3000/payment/failure');
    cy.get('[data-testid="error-reason"]').should('contain', 'Montant invalide');
  });

  it('Permet de retourner au tableau de bord après erreur', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/payment/failure');
    cy.get('button').contains('Retour au tableau').click();
    cy.url().should('include', '/dashboard');
  });
});

describe('Paiement réussi', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('Génère un reçu après paiement réussi', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="pay-valid"]').first().click();
    cy.get('input[name="amount"]').type('1000');
    cy.get('button').contains('Payer').click();
    cy.visit('http://localhost:3000/payment/success');
    cy.contains('Paiement confirmé').should('exist');
    cy.get('[data-testid="receipt-link"]').should('exist');
  });

  it('Affiche détails du paiement dans le reçu', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="pay-valid"]').first().click();
    cy.get('input[name="amount"]').type('1000');
    cy.get('button').contains('Payer').click();
    cy.visit('http://localhost:3000/payment/success');
    cy.get('[data-testid="receipt-amount"]').should('contain', '1000');
    cy.get('[data-testid="receipt-date"]').should('exist');
    cy.get('[data-testid="receipt-method"]').should('exist');
  });
});

describe('Validation de formulaire paiement', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('Refuse montant vide', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="pay-valid"]').first().click();
    cy.get('button').contains('Payer').click();
    cy.verifyError('Montant requis');
  });

  it('Refuse montant négatif', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="pay-valid"]').first().click();
    cy.get('input[name="amount"]').type('-500');
    cy.get('button').contains('Payer').click();
    cy.verifyError('Montant invalide');
  });

  it('Refuse montant supérieur au solde dû', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="pay-valid"]').first().click();
    cy.get('input[name="amount"]').type('999999');
    cy.get('button').contains('Payer').click();
    cy.verifyError('Montant supérieur au solde');
  });
});

describe('Navigation paiements', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('Affiche liste des factures', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="invoice-list"]').should('exist');
    cy.get('[data-testid="invoice-item"]').should('have.length.greaterThan', 0);
  });

  it('Filtre les factures payées', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('select[name="status"]').select('paid');
    cy.get('[data-testid="invoice-item"]').each(($invoice) => {
      cy.wrap($invoice).should('contain', 'Payée');
    });
  });

  it('Télécharge reçu en PDF', () => {
    cy.loginAsTenant();
    cy.visit('http://localhost:3000/invoices');
    cy.get('[data-testid="download-receipt"]').first().click();
    // Vérifie que le fichier a été téléchargé
    cy.readFile('cypress/downloads/receipt.pdf').should('exist');
  });
});
