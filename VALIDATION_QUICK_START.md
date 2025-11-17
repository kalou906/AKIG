# 🚀 AKIG Exhaustive Validation - Quick Start Guide

**Status:** ✅ DEPLOYMENT COMPLETE - Ready for validation testing  
**Infrastructure:** Backend + Frontend + Database + 15 test endpoints  
**Components:** 3 frontend pages + 9 database tables + comprehensive test suite  

---

## 🎯 Start Here

### Step 1: Start Backend (if not running)
```bash
cd backend
npm start
# Expected output: "Server running on http://localhost:4000"
```

### Step 2: Start Frontend (if not running)
```bash
cd frontend
npm start
# Expected output: "Compiled successfully! Webpack compiled with 1 warning"
# Listening on http://localhost:3000
```

### Step 3: Navigate to Command Center
```
http://localhost:3000/command-center
```

---

## 📊 What You'll See

### Command Center Dashboard
```
┌─────────────────────────────────────────┐
│  🚀 AKIG Command Center                 │
│  System Health: 0%  Test Progress: 0%   │
│  Adoption Rate: 0%  Compliance: 0%      │
└─────────────────────────────────────────┘

Category Navigation:
├─ 🎯 Overview
├─ 📋 Planning
├─ 🚀 Execution
├─ ⚡ Technical
├─ 🔍 Data
├─ ⏱️ UX
├─ 🔐 Security
├─ 🤖 AI
├─ 🌍 Operations
└─ 🪐 Jupiter

16 Test Command Cards (clickable):
├─ 🌙 Validation Master Plan
├─ 🚀 Exhaustive Validation Runner
├─ ⚡ Load Storm 10x
├─ 🔥 Chaos Engineering
├─ ... (12 more)
└─ 🪐 Cross-Border Config (Jupiter)
```

---

## 🎮 Running Tests

### Option A: Quick Single Test
1. Go to Command Center: `/command-center`
2. Click any test card (e.g., "Load Storm 10x")
3. Automatically redirected to `/validation/runner`
4. Test executes with live metrics
5. Results appear in "Results Summary" section

### Option B: Master Plan Review
1. Go to: `/validation/master-plan`
2. View 8-week calendar
3. Click on specific week
4. See domain breakdown
5. Understand test dependencies

### Option C: Batch Execution
1. Go to: `/validation/runner`
2. Pre-selected tests shown (14+ options)
3. Click "Start All Tests"
4. Progress bar: 0-100%
5. Real-time metrics per test

### Option D: Manual API Calls
```bash
# Load Storm 10x
curl -X POST http://localhost:4000/api/validation/load/storm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scale": 10, "duration": 1800}'

# Chaos Drill
curl -X POST http://localhost:4000/api/validation/chaos/drill \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario": "internet-outage"}'

# Data Reconciliation
curl -X POST http://localhost:4000/api/validation/data/reconciliation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get All Results
curl -X GET http://localhost:4000/api/validation/results \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📈 Monitoring Results

### Frontend Dashboards
- **CommandCenter:** Real-time system stats
- **ValidationRunner:** Live test execution
- **MasterPlan:** 8-week roadmap

### Database Queries
```sql
-- Latest test results
SELECT test_id, domain, scenario, status, completed_at 
FROM validation_tests 
ORDER BY completed_at DESC LIMIT 20;

-- Domain summary
SELECT domain, status, COUNT(*) 
FROM validation_tests 
GROUP BY domain, status;

-- Performance metrics trending
SELECT timestamp, p95_latency, p99_latency, error_rate 
FROM load_metrics 
ORDER BY timestamp DESC LIMIT 100;

-- Security findings
SELECT * FROM security_findings 
WHERE severity = 'critical' OR status = 'open';

-- AI anomaly accuracy
SELECT test_id, accuracy, confidence_score 
FROM anomaly_detections 
ORDER BY created_at DESC;
```

---

## 🔍 Test Details

### Technical Tests (Week 1-2)
```
Load Storm 10x:     p95 <300ms, p99 <800ms, error <0.5%
Load Storm 50x:     sustained 30 min at 50x peak
Chaos: Internet:    recovery <30 min, RPO 0-5 min
Chaos: SMS:         queue resumption 100%
Chaos: DB:          failover automatic, 0 loss
Chaos: PRA:         cross-region failover validated
```

### Data Tests (Week 3)
```
Reconciliation:     99.5% payment/contract match
Audit Lineage:      100% action traceability
Ingestion:          2015-present + synthetic, <5 min/M rows
Backup/Recovery:    RTO <15 min, integrity 100%
```

### UX Tests (Week 4)
```
3-Min Onboarding:   90% success, <5% abandon
Low-End Device:     TTI <5s, JS errors <0.1%
NPS & SUS:          Score ≥50 & ≥80
Behavioral Loops:   +15% on-time, -25% delays
```

### Security Tests (Week 5)
```
AppSec Gauntlet:    0 critical vulns (SQLi, XSS, CSRF, etc)
Secrets:            Monthly rotation, <5 admin keys
Legal Compliance:   100% mandatory fields, PDF <10s
Audit Immutability: Zero deletions, 100% trace
```

### AI Tests (Week 6)
```
Anomaly Detection:  85%+ accuracy, 100% explainable
Proactive Alerts:   <60s SMS, <2% failure
Recommendations:    70%+ adoption, 25%+ time gain
```

### Operations Tests (Week 7)
```
Multi-Region:       p95 <400ms, 100% config sync
MTTR P1:            <30 min incident resolution
Observability:      <10% false alerts
Runbook Drills:     100% execution success
```

### Jupiter Tests (Throughout)
```
48h Blackout:       RTO <30 min, RPO = 0
7-Day No-Ops:       99.99% uptime, 0 interventions
Agent Swap 50%:     1-day training, adoption intact
5x Data Flood:      p95 <500ms, 99.8% success
Cross-Border:       <24 hours, 100% accuracy
```

---

## 🎯 Success Indicators

**Tests are working when you see:**
1. ✓ No 500 errors in console
2. ✓ Test cards show "PASSED" or "FAILED" status
3. ✓ Metrics populate (p95, p99, error rate, etc)
4. ✓ Results persist across page refresh
5. ✓ Database queries return data

**System is production-ready when:**
1. ✓ 20/20 tests in "PASSED" state
2. ✓ All thresholds met (p95 <300ms, error <0.5%, etc)
3. ✓ 0 critical security findings
4. ✓ 99.5%+ data reconciliation
5. ✓ All Jupiter experiments survive

---

## 🐛 Troubleshooting

### Frontend not loading
```bash
# Check if already running on port 3000
netstat -ano | findstr 3000

# Kill existing process (if needed)
taskkill /PID <PID> /F

# Rebuild
npm run build
npm start
```

### Backend errors
```bash
# Check if running on port 4000
netstat -ano | findstr 4000

# View logs
tail -50 backend/logs/*.log

# Restart backend
cd backend && npm start
```

### Tests not executing
- [ ] Are you logged in? (Token in localStorage)
- [ ] Is backend running on :4000?
- [ ] Are migrations applied? (Check DB tables exist)
- [ ] Are there errors in browser console?

### Database issues
```bash
# Connect to PostgreSQL
psql -U postgres -d akig_validation

# Check tables exist
\dt validation_*

# View recent tests
SELECT * FROM validation_tests LIMIT 5;
```

---

## 📅 8-Week Execution Timeline

```
Week 1-2:  ████████████████ Technical + Chaos (Nov 7-20)
Week 3:    ████████░░░░░░░░ Data Quality (Nov 21-27)
Week 4:    ████████░░░░░░░░ UX Adoption (Nov 28-Dec 4)
Week 5:    ████████░░░░░░░░ Security (Dec 5-11)
Week 6:    ████████░░░░░░░░ AI (Dec 12-18)
Week 7:    ████████░░░░░░░░ Operations (Dec 19-25)
Week 8:    ████████░░░░░░░░ Pilot + Report (Dec 26-Jan 1)
```

---

## 💡 Quick Commands

```bash
# Start both services
cd backend && npm start &
cd frontend && npm start

# Rebuild frontend
cd frontend && npm run build

# Check services running
netstat -ano | findstr "3000\|4000"

# View database schema
psql -U postgres -d akig_validation -c "\dt validation_*"

# Query latest tests
psql -U postgres -d akig_validation -c "SELECT * FROM validation_tests ORDER BY created_at DESC LIMIT 10;"

# Tail logs
Get-Content -Tail 50 backend/logs/*.log
```

---

## 📞 Support Contacts

**Technical Issues:**
- Backend: Check `/backend/logs/`
- Frontend: Browser DevTools Console
- Database: PostgreSQL error logs

**Documentation:**
- Master Plan: `/EXHAUSTIVE_VALIDATION_MASTER_PLAN.md`
- Deployment: `/DEPLOYMENT_VALIDATION_INFRASTRUCTURE.md`
- This Guide: `/VALIDATION_QUICK_START.md`

---

## 🚀 Next Actions

1. **NOW:** Start both services + navigate to `/command-center`
2. **HOUR 1:** Run all tests from validation runner (batch mode)
3. **HOUR 2:** Review results + database queries
4. **DAY 1:** Deep dive into failed tests + remediation
5. **WEEK 1:** Execute Week 1-2 technical tests
6. **ONGOING:** Weekly cadence through Week 8

---

## ✅ Go Live Checklist

- [ ] Backend ✓ Running on :4000
- [ ] Frontend ✓ Running on :3000  
- [ ] Database ✓ Connected + migrations applied
- [ ] Tests ✓ All 15+ endpoints responding
- [ ] UI ✓ CommandCenter loads + pages accessible
- [ ] Auth ✓ JWT tokens working
- [ ] Metrics ✓ Results persisting to DB
- [ ] Docs ✓ Master plan reviewed + understood
- [ ] Team ✓ Ready for 8-week execution

**🎉 YOU'RE READY!**

Access Command Center: http://localhost:3000/command-center

---

**Generated:** November 4, 2025  
**Status:** 🟢 PRODUCTION VALIDATION INFRASTRUCTURE READY
