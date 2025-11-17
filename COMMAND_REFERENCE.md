# ⚡ Command Reference - AKIG

Quick reference for all common commands.

## 🚀 Running Everything

### One-Line Setup (from project root)
```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend  
cd frontend && npm install && npm start

# Terminal 3: Tests
cd backend && npm test && cd ../frontend && npm run cypress:run
```

## 🧪 Testing Commands

### Backend Unit Tests
```bash
cd backend
npm test                              # Run all tests
npm test -- --watch                   # Watch mode
npm test -- --coverage                # With coverage
npm test -- payments                  # Specific suite
npm test -- payments -t "refuse"      # Specific test
```

### Backend Integration Tests
```bash
cd backend
npm test invoices.int.test.js         # Integration only
npm test -- --testPathPattern=int     # All integration tests
```

### Frontend E2E Tests
```bash
cd frontend
npm run cypress:open                  # Interactive UI
npm run cypress:run                   # Headless mode
npm run cypress:run -- --headed       # Visible browser
npm run cypress:run -- --spec "cypress/e2e/errorflow.cy.js"
```

### Run Specific E2E Suites
```bash
cd frontend
npm run cypress:run -- --spec "cypress/e2e/errorflow.cy.js"    # Payments
npm run cypress:run -- --spec "cypress/e2e/contracts.cy.js"    # Contracts
npm run cypress:run -- --spec "cypress/e2e/dashboard.cy.js"    # Dashboard
```

## 📱 Development Servers

### Start Backend
```bash
cd backend
npm run dev                           # Nodemon dev server (port 4002)
npm start                             # Production server
```

### Start Frontend
```bash
cd frontend
npm start                             # React dev server (port 3000)
npm run build                         # Build for production
```

### Build Production
```bash
# Backend (no build needed, just install deps)
cd backend
npm install --production

# Frontend
cd frontend
npm run build
npm start
```

## 📦 Dependency Management

### Install Dependencies
```bash
# Backend
cd backend
npm install
npm install --save-dev jest supertest cypress

# Frontend
cd frontend
npm install
npm install --save-dev cypress
```

### Update Dependencies
```bash
npm update
npm outdated                          # Show outdated packages
```

## 🗄️ Database Commands

### PostgreSQL Setup
```bash
# macOS (with Homebrew)
brew services start postgresql
brew services stop postgresql

# Linux
sudo service postgresql start
sudo service postgresql stop

# Windows (PowerShell as Admin)
net start postgresql-x64-15
net stop postgresql-x64-15
```

### Database Operations
```bash
# Connect to database
psql -U postgres -d akig

# Create test database
createdb akig_test

# Restore from dump
psql akig < backup.sql

# Backup database
pg_dump akig > backup.sql
```

## 🔧 Environment Configuration

### Backend .env
```bash
cd backend
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/akig
JWT_SECRET=your-secret-key-here
PORT=4002
NODE_ENV=development
EOF
```

### Frontend .env.local
```bash
cd frontend
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:4002/api
PORT=3000
REACT_APP_ENV=development
EOF
```

## 🧹 Cleanup Commands

### Remove node_modules
```bash
# Single project
rm -rf node_modules && npm install

# All projects
cd backend && rm -rf node_modules
cd ../frontend && rm -rf node_modules
cd ..
```

### Clean Build Artifacts
```bash
# Frontend build
cd frontend && rm -rf build && npm run build

# Tests coverage
cd backend && rm -rf coverage
cd ../frontend && rm -rf cypress/videos cypress/screenshots
```

### Clear Cache
```bash
# npm cache
npm cache clean --force

# npm-check-updates
npm install -g npm-check-updates
ncu -u && npm install
```

## 📊 Debugging Commands

### Backend Debugging
```bash
# Debug tests
node --inspect-brk node_modules/.bin/jest

# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- payments.errors.unit.test.js -t "refuse un paiement"
```

### Frontend Debugging
```bash
# Run with Chrome DevTools
npm run cypress:run -- --headed

# Open Cypress UI for interactive debugging
npm run cypress:open

# View videos (after running tests)
open cypress/videos/

# View screenshots
open cypress/screenshots/
```

### Check Port Usage
```bash
# Windows PowerShell
netstat -ano | findstr "3000\|4002"

# macOS/Linux
lsof -i :3000
lsof -i :4002
```

## 🚀 Common Workflows

### Adding a New Feature
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Write tests
cd backend
npm test -- --watch

# 3. Implement feature
# ... code changes ...

# 4. Run all tests
npm test
cd ../frontend
npm run cypress:run

# 5. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### Debugging a Failed Test
```bash
# Backend
cd backend
npm test -- payments.errors.unit.test.js -t "specific test name"

# Frontend - Interactive mode
cd frontend
npm run cypress:open
# Then select the failing test and debug step-by-step
```

### Preparing for Deployment
```bash
# 1. Install production dependencies only
cd backend && npm install --production
cd ../frontend && npm install --production

# 2. Run all tests
cd backend && npm test
cd ../frontend && npm run cypress:run

# 3. Build frontend
npm run build

# 4. Set environment variables
export $(cat .env.production | xargs)

# 5. Start servers
cd backend && npm start
cd ../frontend && npm start
```

## 📋 Useful Scripts in package.json

### Backend
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Frontend
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run"
  }
}
```

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -i :4002

# Kill process on port
kill -9 $(lsof -t -i :4002)

# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET
```

### Frontend won't start
```bash
# Clear node_modules
rm -rf node_modules package-lock.json && npm install

# Check port
lsof -i :3000

# Clear cache
npm cache clean --force
```

### Tests failing
```bash
# Run tests verbose
npm test -- --verbose

# Run single test
npm test -- -t "test name"

# Check environment
env | grep -E "DATABASE_URL|JWT_SECRET"
```

### Database connection errors
```bash
# Check PostgreSQL status
sudo service postgresql status

# Check connection
psql -U postgres -c "SELECT 1"

# Test with psql
psql $DATABASE_URL -c "SELECT 1"
```

## 📚 Useful Documentation Files

```
AKIG/
├── TESTING_QUICK_START.md        # Run all tests
├── TEST_STRATEGY.md              # Testing overview
├── COMPLETE_TEST_INVENTORY.md    # All tests listed
├── PROJECT_STRUCTURE.md          # Project layout
├── TEST_RESULTS.md               # Current test status
└── TEST_CONFIG.md                # Config guide
```

---

**For more help, see the documentation files listed above** 📚
