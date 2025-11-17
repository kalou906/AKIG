# ✅ AKIG Expert - Full Deployment Checklist

## Phase 1: Pre-Deployment Setup

### Environment & Infrastructure

- [ ] PostgreSQL 14+ installed and running
- [ ] Node.js 18+ installed
- [ ] Port 4000 available (backend)
- [ ] Port 3000 available (frontend)
- [ ] .env file created with credentials

### Database Preparation

- [ ] PostgreSQL service running
- [ ] Database user created: `akig_user`
- [ ] Database created: `akig_db`
- [ ] Migrations applied: `002_akig_expert_schema.sql`
- [ ] Tables verified:
  ```sql
  SELECT * FROM pg_tables WHERE schemaname = 'public';
  # Should show: agencies, users, agents, properties, tenants, contracts, payments, etc.
  ```

### Configuration

- [ ] DATABASE_URL set correctly
- [ ] JWT_SECRET >= 32 characters
- [ ] CORS_ORIGIN correct
- [ ] NODE_ENV set to development or production
- [ ] PORT not conflicting

---

## Phase 2: Backend Deployment

### Installation

- [ ] Navigate: `cd backend`
- [ ] Install: `npm install`
- [ ] Audit: `npm audit` (fix if needed)

### Startup

- [ ] Run: `npm run dev` or `node src/startup.js`
- [ ] Verify logs:
  - [ ] ✅ Config validated
  - [ ] ✅ Database connected
  - [ ] ✅ Migrations applied
  - [ ] ✅ Seed data created
  - [ ] ✅ Server listening on 4000

### Health Verification

- [ ] `curl http://localhost:4000/api/health`
  Expected: `{ "status": "ok", "ready": true }`

- [ ] `curl http://localhost:4000/api/ready`
  Expected: `{ "ready": true }`

---

## Phase 3: Frontend Deployment

### Installation

- [ ] Navigate: `cd frontend`
- [ ] Install: `npm install`
- [ ] Build test: `npm run build` (should complete)

### Startup

- [ ] Run: `npm start`
- [ ] Verify:
  - [ ] ✅ Compiled successfully
  - [ ] ✅ No critical errors
  - [ ] ✅ Listening on 3000

### Browser Verification

- [ ] Open: `http://localhost:3000`
- [ ] Check:
  - [ ] Page loads (not blank)
  - [ ] Browser console clean (no red errors)
  - [ ] Navigation works

---

## Phase 4: Features Verification

### Core Pages

- [ ] Dashboard loads (`/`)
- [ ] Finance Dashboard loads (`/finance`)
- [ ] Agents Scoreboard loads (`/agents`)
- [ ] Tenant Payments loads (`/tenant/:id`)
- [ ] 404 page for unknown routes

### Authentication

- [ ] Login page accessible
- [ ] Can login with demo credentials
- [ ] Token stored in localStorage
- [ ] Logout clears token

### API Endpoints

- [ ] Payments endpoint works
- [ ] Reporting finance endpoint works
- [ ] AI predictions endpoint works
- [ ] Agents scoreboard endpoint works

---

## Phase 5: Database Content

### Seed Data

- [ ] Agencies: `SELECT COUNT(*) FROM agencies;` ≥ 1
- [ ] Users: `SELECT COUNT(*) FROM users;` ≥ 4
- [ ] Properties: `SELECT COUNT(*) FROM properties;` ≥ 3
- [ ] Tenants: `SELECT COUNT(*) FROM tenants;` ≥ 2
- [ ] Contracts: `SELECT COUNT(*) FROM contracts;` ≥ 1
- [ ] Payments: Visible in Finance Dashboard

### Data Integrity

- [ ] No NULL values in critical fields
- [ ] Foreign keys valid
- [ ] Unique constraints respected
- [ ] Timestamps correct

---

## Phase 6: Testing

### Manual Tests

- [ ] Create payment (POST /api/payments)
  - [ ] Test idempotence (same ref twice)
  - [ ] Verify status (PAID, LATE, etc.)

- [ ] Get Finance Report (GET /api/reporting/finance?range=3m)
  - [ ] Verify totals calculated correctly
  - [ ] Check period range

- [ ] Get AI Predictions (GET /api/ai/predictions/tenants)
  - [ ] Verify probability calculated
  - [ ] Check risk levels
  - [ ] Verify recommended actions

- [ ] Get Agent Scoreboard (GET /api/agents-expert/scoreboard)
  - [ ] Verify performance metrics
  - [ ] Check target achievement %

### Smoke Tests (Automated)

```bash
npm run test smoke.spec.ts
# Expected: All tests passing
```

- [ ] Health checks: ✓
- [ ] Routes accessible: ✓
- [ ] Navigation works: ✓
- [ ] 404 handling: ✓
- [ ] Performance < 3s: ✓

---

## Phase 7: Performance & Monitoring

### Performance

- [ ] Health endpoint < 100ms: ✓
- [ ] Finance endpoint < 500ms: ✓
- [ ] Page load time < 3s: ✓
- [ ] No memory leaks (5min test): ✓

### Logs

- [ ] No ERROR messages
- [ ] No FAIL messages
- [ ] Audit logs created
- [ ] Request logs visible

### Metrics

- [ ] Uptime: Check process status
- [ ] Database connections: Verify pool
- [ ] Error rate: Monitor logs

---

## Phase 8: Security

- [ ] JWT validation working
  - [ ] Invalid token → 401
  - [ ] Expired token → 401
  - [ ] Missing token → 401

- [ ] Role-based access
  - [ ] Agent can access Agent endpoints
  - [ ] Agent cannot access Manager endpoints (403)
  - [ ] Comptable cannot access Admin endpoints (403)

- [ ] SQL injection protected
  - [ ] All queries parameterized
  - [ ] No string concatenation

- [ ] CORS working
  - [ ] Frontend requests accepted
  - [ ] Other origins rejected

- [ ] Password hashing
  - [ ] Passwords hashed with bcrypt
  - [ ] Never stored in plain text

---

## Phase 9: Documentation

- [ ] README.md updated
- [ ] EXPERT_OPERATIONAL_GUIDE.md exists
- [ ] API_INTEGRATION_GUIDE.md exists
- [ ] DATA_SCHEMA_REFERENCE.md exists
- [ ] Deployment steps documented

---

## Phase 10: Go-Live

### Before Launch

- [ ] All checkboxes above checked ✓
- [ ] Team notified
- [ ] Backup created
- [ ] Rollback plan ready

### Launch

- [ ] Start backend
- [ ] Start frontend
- [ ] Monitor logs for 15 minutes
- [ ] Test critical paths
- [ ] Verify data persistence

### Post-Launch

- [ ] Monitor uptime
- [ ] Check for errors
- [ ] Verify data integrity
- [ ] Monitor performance
- [ ] Keep logs for audit

---

## Troubleshooting Reference

### Backend Won't Start
```
1. Check: DATABASE_URL correct?
2. Check: PostgreSQL running?
3. Check: Port 4000 free?
4. Check: Node version >= 18?
```

### Frontend Won't Build
```
1. Check: npm install completed?
2. Check: Node version >= 18?
3. Check: npm audit errors?
4. Run: npm install --legacy-peer-deps
```

### API Endpoints 404
```
1. Check: Backend running on 4000?
2. Check: CORS_ORIGIN correct?
3. Check: JWT token valid?
```

### Database Connection Failed
```
1. Check: PostgreSQL service running?
2. Check: DATABASE_URL has credentials?
3. Check: User has permissions?
4. Test: psql -U user -d db_name
```

---

**Status: READY FOR DEPLOYMENT** ✅

**Last Updated:** 2025-01-06  
**Version:** 1.0 Expert Complete
