# Tests E2E avec Cypress

Ce dossier contient les tests end-to-end (E2E) pour l'application frontend AKIG.

## Installation

```bash
npm install --save-dev cypress
```

## Structure

```
cypress/
├── e2e/                    # Tests E2E
│   ├── errorflow.cy.js     # Tests paiements et erreurs
│   ├── contracts.cy.js     # Tests gestion contrats
│   └── dashboard.cy.js     # Tests tableau de bord
├── support/
│   ├── commands.js         # Commandes personnalisées
│   ├── e2e.js              # Configuration support
│   └── ...
└── cypress.config.js       # Configuration Cypress
```

## Exécuter les tests

### Mode interactif (Cypress UI)
```bash
npm run cypress:open
```

### Mode headless (CLI)
```bash
npm run cypress:run
```

### Tests spécifiques
```bash
npm run cypress:run -- --spec "cypress/e2e/errorflow.cy.js"
npm run cypress:run -- --spec "cypress/e2e/contracts.cy.js"
npm run cypress:run -- --spec "cypress/e2e/dashboard.cy.js"
```

## Commandes personnalisées

### `cy.loginAsTenant()`
Connecte un utilisateur locataire
```javascript
cy.loginAsTenant();
```

### `cy.loginAsOwner()`
Connecte un utilisateur propriétaire
```javascript
cy.loginAsOwner();
```

### `cy.logout()`
Déconnecte l'utilisateur
```javascript
cy.logout();
```

### `cy.verifyError(message)`
Vérifie qu'un message d'erreur est affiché
```javascript
cy.verifyError('Montant requis');
```

### `cy.verifySuccess(message)`
Vérifie qu'un message de succès est affiché
```javascript
cy.verifySuccess('Contrat créé');
```

## Tests inclus

### Paiements (errorflow.cy.js)
- ✅ Affichage du message "Paiement refusé"
- ✅ Validation des montants
- ✅ Génération des reçus
- ✅ Navigation après erreur/succès

### Contrats (contracts.cy.js)
- ✅ Affichage liste des contrats
- ✅ Création nouveau contrat
- ✅ Modification statut
- ✅ Suppression contrat
- ✅ Validations de formulaire

### Dashboard (dashboard.cy.js)
- ✅ Affichage des statistiques
- ✅ Navigation vers pages principales
- ✅ Gestion authentification
- ✅ Redirection non-authentifiés

## Best Practices

1. **Data-testid**: Tous les éléments interactifs doivent avoir un attribut `data-testid`
```jsx
<button data-testid="pay-valid">Payer</button>
```

2. **Attendre les éléments**: Utiliser `cy.get()` avec patience
```javascript
cy.get('[data-testid="invoice-list"]').should('exist');
```

3. **Vérifier URLs**: Après navigation
```javascript
cy.url().should('include', '/dashboard');
```

4. **Commandes personnalisées**: Pour login/logout et actions répétitives
```javascript
cy.loginAsTenant();
cy.verifyError('Erreur');
```

## Configuration

Fichier `cypress.config.js`:
- **baseUrl**: `http://localhost:3000`
- **Framework**: React
- **Bundler**: Webpack

## Prérequis

- Application React lancée sur `http://localhost:3000`
- Backend API disponible sur `http://localhost:4002`
- Base de données PostgreSQL configurée
