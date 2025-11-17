# Test Strategy for AKIG Application

## Overview

The AKIG application uses a multi-layered testing strategy:

1. **Unit Tests** - Backend services (Jest)
2. **Integration Tests** - API endpoints (Supertest)
3. **E2E Tests** - User workflows (Cypress)

## Backend Testing

### Unit Tests (`backend/tests/*.unit.test.js`)

**Location**: `backend/tests/`

**Coverage**:
- `payments.errors.unit.test.js` - Payment validation logic (10 tests)
- `sync.conflict.unit.test.js` - Sync and conflict resolution (18 tests)

**Run**:
```bash
npm test
npm test -- --watch
```

### Integration Tests (`backend/tests/*.int.test.js`)

**Location**: `backend/tests/`

**Coverage**:
- `invoices.int.test.js` - API endpoints for payments and invoices (10 tests)

**Run**:
```bash
npm test invoices.int.test.js
```

## Frontend Testing

### E2E Tests (Cypress)

**Location**: `frontend/cypress/e2e/`

**Test Suites**:

1. **Error Flow** (`errorflow.cy.js`)
   - Payment failure scenarios
   - Form validation
   - Receipt generation
   - Error messaging

2. **Contracts** (`contracts.cy.js`)
   - Contract CRUD operations
   - Status management
   - Form validation
   - Filtering

3. **Dashboard** (`dashboard.cy.js`)
   - Statistics display
   - Navigation
   - Authentication
   - Data refresh

**Run**:
```bash
npm run cypress:open          # Interactive mode
npm run cypress:run           # Headless mode
npm run cypress:run -- --spec "cypress/e2e/errorflow.cy.js"
```

## Test Data Requirements

For tests to work correctly:

1. **Backend**: PostgreSQL database with test schema
2. **Frontend**: React app running on `http://localhost:3000`
3. **API**: Backend API running on `http://localhost:4002`

## Custom Cypress Commands

Located in `frontend/cypress/support/commands.js`:

- `cy.loginAsTenant()` - Authenticate as tenant user
- `cy.loginAsOwner()` - Authenticate as owner user
- `cy.logout()` - Logout current user
- `cy.verifyError(message)` - Check error message
- `cy.verifySuccess(message)` - Check success message

## Data Attributes for Testing

All interactive elements should include `data-testid`:

```jsx
// Payment button
<button data-testid="pay-valid">Pay Now</button>

// Invoice list
<div data-testid="invoice-list">...</div>

// Error message
<div data-testid="error-message">Error text</div>

// Success message
<div data-testid="success-message">Success text</div>

// Dashboard content
<div data-testid="dashboard-content">...</div>

// Statistics
<div data-testid="stat-active-contracts">5</div>
<div data-testid="stat-pending-payments">1000</div>
<div data-testid="stat-monthly-revenue">5000</div>
```

## Test Execution Pipeline

### Local Development
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm run cypress:run
```

### CI/CD Integration
```bash
# All tests
npm test && npm run cypress:run
```

## Coverage Goals

- **Backend**: >80% coverage for critical services
- **Frontend**: Critical user paths covered (payments, contracts, dashboard)
- **E2E**: Happy path and error scenarios

## Future Enhancements

1. Component tests for React components
2. Performance testing with Cypress
3. Visual regression testing
4. Load testing for API
5. Security testing (OWASP)
