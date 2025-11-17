# Test Configuration Guide

## Backend Environment Variables for Testing

Create `.env.test` in `backend/`:

```env
# Database - Use test database
DATABASE_URL=postgresql://postgres:password@localhost:5432/akig_test

# JWT Secret for testing
JWT_SECRET=test-secret-key-do-not-use-in-production

# API Port
PORT=4002

# Node environment
NODE_ENV=test
```

## Frontend Environment Variables for Testing

Create `.env.test.local` in `frontend/`:

```env
# API base URL for tests
REACT_APP_API_URL=http://localhost:4002/api

# Frontend port
PORT=3000

# Testing mode
REACT_APP_ENV=test
```

## Running Tests with Environment Files

### Backend
```bash
# Load test environment
export $(cat .env.test | xargs)
npm test
```

### Frontend
```bash
# Run with test configuration
npm run cypress:run
```

## Database Setup for Testing

### Option 1: Docker (Recommended)
```bash
docker run --name akig-test-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=akig_test \
  -p 5432:5432 \
  -d postgres:15
```

### Option 2: Local PostgreSQL
```bash
createdb akig_test
psql akig_test -f schema.sql
```

## Debugging Tests

### Backend
```bash
# Run tests with debugging
node --inspect-brk node_modules/.bin/jest

# Or use VS Code debugger
npm test -- --runInBand
```

### Frontend (Cypress)
```bash
# Debug mode - freezes time, keeps browser open
npm run cypress:run -- --headed --debug

# Open Cypress UI for debugging
npm run cypress:open
```

## CI/CD Testing

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: akig_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Backend Tests
        run: |
          cd backend
          npm install
          npm test
      
      - name: Frontend Tests
        run: |
          cd frontend
          npm install
          npm run cypress:run
```

## Test Reporting

### Generate Coverage Report
```bash
# Backend
npm test -- --coverage

# Frontend (with Istanbul)
npm test -- --coverage --coverageReporters=text --watchAll=false
```

### View Reports
```bash
# Backend coverage
open coverage/lcov-report/index.html

# Frontend coverage
open frontend/coverage/lcov-report/index.html
```
