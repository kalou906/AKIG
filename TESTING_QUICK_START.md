# 🚀 Quick Start Guide - Running Tests

## Prerequisites

- Node.js 16+ installed
- PostgreSQL running (for backend tests)
- Both frontend and backend running for E2E tests

## ⚡ Quick Commands

### Backend Tests (No database required for unit tests)
```bash
cd backend
npm install
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- payments        # Specific suite
```

### Frontend Tests (Requires both frontend + backend running)

#### Setup
```bash
cd frontend
npm install
npm install --save-dev cypress
```

#### Run Tests
```bash
npm run cypress:run                  # All E2E tests
npm run cypress:open                 # Interactive UI
npm run cypress:run -- --headed      # Visible browser
npm run cypress:run -- --spec "cypress/e2e/errorflow.cy.js"
```

## 📋 Full Test Suite Execution

### 1️⃣ Setup Environment

```bash
# Terminal 1: Backend
cd backend
npm install
npm test                    # Unit & integration tests pass ✅

# Terminal 2: Start backend server
cd backend
npm run dev                 # Starts on http://localhost:4002

# Terminal 3: Start frontend dev server
cd frontend
npm start                   # Starts on http://localhost:3000

# Terminal 4: Run E2E tests
cd frontend
npm run cypress:run
```

### 2️⃣ Backend Tests Results

```
PASS  tests/payments.errors.unit.test.js
  validatePayment
    ✓ refuse un paiement < 0
    ✓ refuse une facture invalide
    ✓ accepte un paiement valide
    ✓ refuse un montant manquant
    ✓ refuse un montant invalide (non numérique)
    ✓ accepte un paiement avec statut facture valide (pending)
    ✓ accepte un paiement avec statut facture valide (partial)
    ✓ refuse un statut facture invalide
    ✓ refuse un objet paiement null
    ✓ refuse un objet paiement undefined

PASS  tests/sync.conflict.unit.test.js
  resolveConflict
    ✓ signale conflit non résolu si champs critiques divergent
    ✓ inclut les champs en conflit dans la réponse
    ✓ résout les conflits si champs critiques sont identiques
    ... (15 more tests)

PASS  tests/invoices.int.test.js
  POST /api/payments - Validations de champs
    ✓ refuse paiement sans token
    ✓ refuse paiement si montant manquant
    ... (7 more tests)

Test Suites: 3 passed, 3 total
Tests:       38 passed, 38 total ✅
```

### 3️⃣ Frontend E2E Tests Results

```
Paiement refusé
  ✓ Affiche message et ne génère pas de reçu
  ✓ Affiche raison de refus de paiement
  ✓ Permet de retourner au tableau de bord après erreur

Paiement réussi
  ✓ Génère un reçu après paiement réussi
  ✓ Affiche détails du paiement dans le reçu

Validation de formulaire paiement
  ✓ Refuse montant vide
  ✓ Refuse montant négatif
  ✓ Refuse montant supérieur au solde dû

Navigation paiements
  ✓ Affiche liste des factures
  ✓ Filtre les factures payées
  ✓ Télécharge reçu en PDF

Gestion des contrats
  ✓ Affiche la liste des contrats
  ✓ Crée un nouveau contrat
  ✓ Modifie le statut d'un contrat
  ... (more tests)

Tableau de bord
  ✓ Affiche les statistiques du dashboard
  ✓ Affiche le nombre de contrats actifs
  ... (more tests)

Passing tests: 30+ ✅
```

## 🔍 Debugging Failed Tests

### Backend - Single Test
```bash
cd backend
npm test -- payments.errors.unit.test.js -t "refuse un paiement"
```

### Frontend - Single Test
```bash
cd frontend
npm run cypress:run -- --spec "cypress/e2e/errorflow.cy.js" -t "Affiche message"
```

### Frontend - Interactive Debugging
```bash
cd frontend
npm run cypress:open
# Select test file, browser, and debug step by step
```

## 📊 Generate Coverage Reports

### Backend Coverage
```bash
cd backend
npm test -- --coverage

# View report
open coverage/lcov-report/index.html
```

### Frontend Coverage (Setup required)
```bash
cd frontend
npm test -- --coverage --watchAll=false
```

## ✅ Verification Checklist

Before committing code:

- [ ] `cd backend && npm test` - All 38 tests pass
- [ ] Backend server running: `npm run dev`
- [ ] Frontend server running: `npm start`
- [ ] `cd frontend && npm run cypress:run` - All E2E tests pass
- [ ] No console errors in browser
- [ ] No console errors in terminals

## 🐛 Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout in `cypress.config.js`:
```javascript
module.exports = defineConfig({
  e2e: {
    requestTimeout: 10000,
    responseTimeout: 10000,
  }
});
```

### Issue: Database connection error
**Solution**: Ensure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start

# Windows
net start postgresql-x64-15
```

### Issue: Cypress can't find elements
**Solution**: Ensure `data-testid` attributes are in React components:
```jsx
<button data-testid="pay-valid">Pay</button>
```

### Issue: Tests fail intermittently
**Solution**: Run tests in headless mode for consistency:
```bash
npm run cypress:run  # Instead of --headed
```

## 📝 Test Output Files

Tests generate these files:
- `backend/coverage/` - Code coverage report
- `frontend/cypress/videos/` - Test recordings
- `frontend/cypress/screenshots/` - Failure screenshots
- `frontend/cypress/downloads/` - Downloaded files

## 🚀 CI/CD Ready

These tests are ready for automated pipelines:

```bash
# GitHub Actions / GitLab CI / Jenkins
npm test && npm run cypress:run
```

---

**Need help?** Check the detailed documentation:
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- Tests: `TEST_STRATEGY.md`
- Config: `TEST_CONFIG.md`
