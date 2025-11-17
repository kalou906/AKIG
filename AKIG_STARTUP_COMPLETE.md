# 🎬 AKIG EXPERT - DÉMARRAGE COMPLET

**Status**: 🎉 PRODUCTION-READY  
**Quick Start**: 5 minutes

---

## ⚡ DÉMARRAGE RAPIDE (5 MIN)

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```
**Expected Output**:
```
✓ Backend server running on http://localhost:4000
✓ GET http://localhost:4000/api/health → 200 OK
✓ GET http://localhost:4000/api/ready → {status: "ok", ready: true}
```

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm start
```
**Expected Output**:
```
✓ Frontend running on http://localhost:3000
✓ Compiled successfully - Open browser at http://localhost:3000
```

### Browser
```
Open: http://localhost:3000
Login with test credentials (see below)
```

---

## 🔑 TEST CREDENTIALS (Demo Data)

### User 1: Agent (Can create payments, view own performance)
```
Email: agent1@akig.gn
Password: Agent123!@
Role: AGENT
Agency: AKIG Inc.
```

### User 2: Manager (Can approve payments, view all reports)
```
Email: manager1@akig.gn
Password: Manager123!@
Role: MANAGER
Agency: AKIG Inc.
```

### User 3: Admin (Full access)
```
Email: admin@akig.gn
Password: Admin123!@
Role: ADMIN
Agency: AKIG Inc.
```

### User 4: Comptable (Finance only)
```
Email: comptable@akig.gn
Password: Comptable123!@
Role: COMPTABLE
Agency: AKIG Inc.
```

---

## 🗄️ ENVIRONMENT VARIABLES (Backend)

Create `.env` file in `backend/` directory:

```env
# Database Connection
DATABASE_URL=postgresql://localhost/akig_dev
# OR: postgresql://user:password@host:port/dbname

# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars-required-here
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Server Configuration
PORT=4000
NODE_ENV=development

# Features (Optional)
ENABLE_MFA=false              # Set to true in production
ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOGGING=true

# Pagination (Optional)
DEFAULT_PAGE_SIZE=25
MAX_PAGE_SIZE=100
```

---

## 🗄️ DATABASE SETUP

### PostgreSQL Installation

**Windows**:
```powershell
# Using chocolatey
choco install postgresql14

# OR download from https://www.postgresql.org/download/windows/

# After install, verify
psql --version
```

**macOS**:
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

### Database Initialization

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE akig_dev;

# Exit psql
\q

# Run migrations
psql akig_dev < migrations/001_initial.sql
psql akig_dev < migrations/002_akig_expert_schema.sql

# Verify tables created
psql akig_dev -c "\dt"
```

---

## 🗄️ SEED DATA

Demo data automatically loaded in `migrations/002_akig_expert_schema.sql`:

### Agencies
```sql
SELECT * FROM agencies;
-- Result: 1 row (AKIG Inc., Conakry)
```

### Users
```sql
SELECT email, role FROM users;
-- Results:
-- agent1@akig.gn         | AGENT
-- manager1@akig.gn       | MANAGER
-- admin@akig.gn          | ADMIN
-- comptable@akig.gn      | COMPTABLE
```

### Properties
```sql
SELECT address FROM properties;
-- Results:
-- Rue KA7, Conakry
-- Rue Prince, Conakry
-- Quartier Kipé, Conakry
```

### Tenants & Contracts
```sql
SELECT COUNT(*) FROM tenants;         -- 2 tenants
SELECT COUNT(*) FROM contracts;       -- 3 contracts
```

### Sample Payments
```sql
SELECT ref, amount, status FROM payments ORDER BY created_at DESC;
-- Existing: Some PAID, some LATE samples for demo
```

---

## ✅ VERIFICATION CHECKLIST

### Backend Health
```bash
# Check backend is running
curl http://localhost:4000/api/health

# Expected Response:
{
  "status": "ok",
  "ready": true,
  "database": "connected",
  "components": {
    "server": "running",
    "database": "connected",
    "migrations": "applied"
  }
}
```

### Frontend Health
```bash
# Browser: http://localhost:3000
# Expected: Login page loads
```

### Database Health
```bash
# Check tables exist
psql akig_dev -c "\dt"

# Should show: 13 tables
agencies, users, agents, properties, tenants, landlords, 
contracts, payments, agency_costs, tenant_payment_predictions,
maintenance_tickets, disputes, audit_logs
```

### API Endpoints
```bash
# Test authentication
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent1@akig.gn","password":"Agent123!@"}'

# Expected: 200 OK with JWT token

# Test payments (with token)
TOKEN=$(curl ... | jq -r '.token')  # Get token from login
curl -X GET http://localhost:4000/api/payments \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with payments array
```

---

## 📖 NEXT STEPS

### 1. Explore Dashboard (5 min)
```
1. Login with agent1@akig.gn
2. Navigate to Finance Dashboard (tab)
3. Select 1m range
4. Observe: Income, Costs, Net, Margin metrics
```

### 2. Test Payment Creation (10 min)
```
1. Login with manager1@akig.gn
2. Go to Payments section
3. Create test payment:
   - Contract ID: 1
   - Amount: 500,000 GNF
   - Status: PAID
   - Method: CASH
4. Verify: Payment appears in list with ref
5. Repeat POST with same ref: Should return same payment (idempotence)
```

### 3. Check AI Predictions (5 min)
```
1. Login with manager1@akig.gn
2. Go to Tenant Details
3. Select a tenant
4. Observe: Risk level badge, probability score, recommended actions
```

### 4. View Agent Scoreboard (5 min)
```
1. Login with manager1@akig.gn
2. Go to Agents Scoreboard
3. View: Collected amount, Success rate, Score gamification
```

### 5. Generate Reports (10 min)
```
1. Login with comptable@akig.gn
2. Go to Finance Dashboard
3. Select different ranges (1m, 3m, 6m, 12m)
4. Observe calculations updating
```

---

## 🐛 TROUBLESHOOTING

### Backend won't start

**Error: "DATABASE_URL is required"**
```
Solution: Set DATABASE_URL in .env
export DATABASE_URL=postgresql://localhost/akig_dev
```

**Error: "Cannot connect to database"**
```
Solution: Verify PostgreSQL running
# Windows
Get-Process postgres

# macOS/Linux
ps aux | grep postgres

# If not running:
# Windows: pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
# macOS: brew services start postgresql@14
# Linux: sudo service postgresql start
```

### Frontend won't start

**Error: "Port 3000 already in use"**
```
Solution: Kill existing process or use different port
# Windows PowerShell
Get-Process | Where-Object {$_.Ports -eq 3000} | Stop-Process

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# OR: Change port
PORT=3001 npm start
```

### Login fails

**Error: "Invalid credentials"**
```
Solution: Verify credentials in seed data
psql akig_dev
SELECT email, role FROM users WHERE email = 'agent1@akig.gn';

# If not found, re-run migrations
psql akig_dev < migrations/002_akig_expert_schema.sql
```

### Payments endpoint 403

**Error: "Forbidden - insufficient permissions"**
```
Solution: User role doesn't have access
- AGENT: Can only see own payments
- MANAGER: Can create/update payments
- COMPTABLE: Finance only

Use appropriate user for endpoint
```

---

## 📊 COMMON API CALLS

### 1. Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@akig.gn",
    "password": "Agent123!@"
  }'

# Response: {"token": "eyJh...", "refreshToken": "eyJh..."}
```

### 2. Create Payment (Idempotent)
```bash
TOKEN="your-jwt-token"
curl -X POST http://localhost:4000/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": 1,
    "amount": 500000,
    "ref": "PAY-'$(date +%s)'",
    "method": "CASH",
    "status": "PAID"
  }'

# Safe to retry: Same ref = same result
```

### 3. Get Finance Report
```bash
curl -X GET "http://localhost:4000/api/reporting/finance?range=1m" \
  -H "Authorization: Bearer $TOKEN"

# Response: {period: "1m", income: XXX, costs: {...}, net: XXX, margin: XX%}
```

### 4. Get AI Predictions
```bash
curl -X GET "http://localhost:4000/api/ai/predictions/tenants" \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of {tenant_id, probability, risk_level, actions}
```

### 5. Get Agent Scoreboard
```bash
curl -X GET "http://localhost:4000/api/agents-expert/scoreboard" \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of {name, collected, success_rate, score}
```

---

## 📚 DOCUMENTATION LINKS

| Document | Purpose | Audience |
|----------|---------|----------|
| `EXPERT_OPERATIONAL_GUIDE.md` | System overview + operations | Operations/Managers |
| `API_INTEGRATION_GUIDE.md` | Complete API reference | Developers |
| `DATA_SCHEMA_REFERENCE.md` | Database schema details | DBAs |
| `EXPERT_DEPLOYMENT_CHECKLIST.md` | Production deployment steps | DevOps |
| `AKIG_ROADMAP_CONTINUATION.md` | Future sessions roadmap | Technical Lead |

---

## 🎯 QUICK REFERENCE

| Task | Command |
|------|---------|
| Backend start | `cd backend && npm run dev` |
| Frontend start | `cd frontend && npm start` |
| DB backup | `pg_dump akig_dev > backup.sql` |
| DB restore | `psql akig_dev < backup.sql` |
| Run tests | `npm test` (in root) |
| Check logs | `tail -f logs/akig.log` |
| JWT decode | Use JWT.io or `jq` on token |

---

## 🎉 YOU'RE READY!

**All systems operational:**
- ✅ Backend ready (port 4000)
- ✅ Frontend ready (port 3000)
- ✅ Database ready (PostgreSQL)
- ✅ Credentials configured
- ✅ Demo data loaded
- ✅ Documentation complete

**Next**: Follow EXPERT_DEPLOYMENT_CHECKLIST.md for production deployment

**Questions?** Check EXPERT_OPERATIONAL_GUIDE.md for troubleshooting

---

*Session 6C Final - Startup Guide*  
*Production-Ready System - Ready to Deploy*
