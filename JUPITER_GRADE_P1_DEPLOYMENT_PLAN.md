# ⏱️ JUPITER-GRADE P1: DEPLOYMENT PLAN (2-3 Weeks)

**Status**: Ready for Immediate Execution  
**Team Size**: 5-7 developers (1 architect, 3-4 backend, 1-2 frontend, 1 DevOps)  
**Timeline**: 14-21 calendar days  
**Risk Level**: Low (modular, non-breaking changes)

---

## 📅 DEPLOYMENT ROADMAP

### WEEK 1: FOUNDATION (Foundation Build)

#### **DAY 1-2: Data Model & Migrations**
```
Timeline: 4 hours

Tasks:
1. Review SQL schema (009_JUPITER_GRADE_P1_SCHEMA.sql)
   - 9 new tables
   - 25+ indexes
   - site_id columns across core tables

2. Create rollback scripts
   - Backup current database
   - Document row counts before migration
   - Test migration in staging first

3. Apply migration
   - Run on staging: psql -d akig_staging < migrations/009_*.sql
   - Verify: SELECT COUNT(*) FROM sites; -- should return 0 initially

4. Seed initial data
   - Insert 6 sites (GN_CONAKRY, GN_KINDIA, GN_MAMOU, GN_LABE, SN_DAKAR, ML_BAMAKO)
   - Verify: SELECT COUNT(*) FROM sites; -- should return 6

Status: ✅ COMPLETE → Team has clean schema
```

#### **DAY 2-3: Backend Services Development**
```
Timeline: 16 hours (2 days × 2 developers)

Tasks:
1. Developer 1: Create 4 services
   - TenantRetentionService.ts (400L)
   - TaskPrioritizationService.ts (350L)
   - AIExplainabilityService.ts (300L)
   - AdvancedKPIService.ts (400L)

2. Developer 2: Create middleware + config
   - multi-site-router.ts middleware (350L)
   - regional-rules.ts config (250L)

3. Code review
   - Check TypeScript types
   - Verify database queries
   - Test service instantiation

Status: ✅ SERVICES READY → Can be imported in routes
```

#### **DAY 3: API Routes**
```
Timeline: 8 hours

Endpoints to create:

POST /api/retention/analyze
  - Trigger tenant retention analysis
  - Return: 50 at-risk tenants with scores
  - Authorization: manage_retention

GET /api/retention/scores
  - Fetch retention scores (paginated)
  - Filter by: risk_level, site_id

POST /api/retention/campaigns
  - Create new retention campaign
  - Params: tenantIds, campaignName, budget

GET /api/tasks/today/:agentId
  - Get daily task manifesto
  - Return: top 3 prioritized tasks

GET /api/kpi/metrics
  - Calculate all KPIs for period
  - Params: startDate, endDate, site_id
  - Return: KPIMetrics object

GET /api/kpi/report
  - Generate detailed KPI report
  - Includes: trends, benchmarks, improvements

POST /api/alerts/:alertId/explain
  - Get AI alert explanation
  - Return: AlertExplanation object

Status: ✅ ROUTES IMPLEMENTED → API ready
```

#### **DAY 4: Frontend - i18n Setup**
```
Timeline: 4 hours

Tasks:
1. Copy local-languages.ts to frontend/src/i18n/
   - Verify i18next dependency installed
   - Check detection plugin configured

2. Import in App.tsx
   import './i18n/local-languages';

3. Create language selector component
   - Dropdown with 6 languages
   - onChange: i18n.changeLanguage(lang)

4. Test language switching
   - Switch to Soussou → verify translations load
   - Check console for missing keys

Status: ✅ i18n READY → Multi-language support activated
```

#### **DAY 5: Frontend - Dashboard Components**
```
Timeline: 12 hours (parallel)

Components to build:

1. AdvancedKPIDashboard.tsx (300L)
   - Call /api/kpi/report endpoint
   - Display metrics in cards
   - Show trends with up/down arrows
   - KPI charts using Recharts
   - Show benchmarks comparison

2. RetentionCampaignUI.tsx (200L)
   - List of at-risk tenants
   - Click "Start Campaign" → POST /api/retention/campaigns
   - Show campaign history + results

3. MultiSiteSelector.tsx (100L)
   - Dropdown of available sites
   - Store selection in localStorage
   - Pass siteId to all API calls via header

4. TaskManifesto.tsx (150L)
   - GET /api/tasks/today/:agentId
   - Show top 3 tasks with reasoning
   - Color-coded priority (red=urgent, yellow=medium, green=low)

Status: ✅ DASHBOARDS COMPLETE → UI ready
```

---

### WEEK 2: INTEGRATION & TESTING

#### **DAY 8: Unit Testing**
```
Timeline: 12 hours

Test files to create:

tests/services/TenantRetentionService.test.ts
  - Test profileTenant()
  - Test calculateRetentionScore()
  - Mock database queries

tests/services/TaskPrioritizationService.test.ts
  - Test calculateUrgencyScore()
  - Test prioritizeAgentDailyTasks()

tests/middleware/multi-site-router.test.ts
  - Test determineSiteId()
  - Test site context injection
  - Test failover logic

Command: npm test -- --coverage
Target: 80%+ coverage

Status: ✅ UNIT TESTS PASSING
```

#### **DAY 9: Integration Testing**
```
Timeline: 10 hours

Test files:

tests/integration/retention-flow.test.ts
  - End-to-end: Profile tenant → Calculate score → Create campaign → Execute action

tests/integration/multi-site-data-isolation.test.ts
  - Verify GN_CONAKRY contracts not visible when site = GN_KINDIA
  - Test user access control per site

tests/integration/kpi-accuracy.test.ts
  - Create test data (100 contracts, 50 payments)
  - Calculate metrics
  - Verify calculations match manual counts

Command: npm test:integration
Status: ✅ INTEGRATION TESTS PASSING
```

#### **DAY 9-10: Staging Deployment**
```
Timeline: 4 hours

Checklist:
□ Merge PR to develop branch
□ Run linter: npm run lint
□ Build TypeScript: npm run build
□ Deploy to staging environment
  cd backend && npm run deploy:staging
  cd frontend && npm run deploy:staging
□ Run smoke tests on staging
□ Load test: k6 run tests/load/kpi-load.js

Expected Results:
- All endpoints responding
- No console errors
- KPI calculation < 2s for 5000 records
- Uptime: 100% for 1 hour

Status: ✅ STAGING READY FOR UAT
```

#### **DAY 11: UAT with Stakeholders**
```
Timeline: 6 hours

Scenarios to validate:

1. Manager: View KPI Dashboard
   □ Can see all 9 KPIs calculated
   □ Trends showing vs previous month
   □ Benchmarks comparison visible

2. Manager: Create Retention Campaign
   □ Analyze 50 at-risk tenants
   □ Select top 10 for campaign
   □ Assign personalized offers
   □ See campaign created

3. Agent: View Daily Tasks
   □ See top 3 prioritized tasks
   □ Read explanation for each
   □ See estimated duration
   □ Update task status

4. Multi-site: View GN_KINDIA data
   □ Only see Kindia contracts
   □ Regional taxes applied (4% vs 5%)

5. Language: Switch to Soussou
   □ Dashboard fully translated
   □ All menus in Soussou

Feedback captured → Issues logged as P3 (non-blocking)

Status: ✅ UAT APPROVED (with minor P3 items)
```

---

### WEEK 3: PRODUCTION DEPLOYMENT

#### **DAY 14: Final QA Checks**
```
Timeline: 2 hours

Pre-deployment checklist:
□ All PRs merged to main
□ Version bumped (v2.5.0)
□ Changelog updated
□ Database backup confirmed
□ Rollback script tested
□ Monitoring alerts configured
□ On-call team briefed

Status: ✅ READY FOR PROD
```

#### **DAY 15: Production Deployment**
```
Timeline: 2 hours (execute in maintenance window 02:00-04:00 GMT)

Deployment steps:

1. Blue-Green Deployment Strategy
   - Deploy new code to GREEN environment
   - Health checks: All endpoints returning 200
   - Load test briefly
   - Switch traffic from BLUE → GREEN

2. Database Migration
   - Run migration on production
   - Verify data integrity
   - Confirm 6 sites created

3. Feature Flags
   - Enable "advanced_kpi_dashboard" for 10% users first
   - Monitor error rates
   - Gradually increase to 100%

4. Monitoring
   - Check error logs for exceptions
   - Monitor CPU/memory usage
   - Verify no slow queries (>5s)

Rollback plan (if issues):
  - Switch traffic back to BLUE
  - Alert team
  - Debug in staging
  - Retry next day

Status: ✅ DEPLOYED TO PRODUCTION
```

#### **DAY 15-21: Production Monitoring**
```
Timeline: 1 week

Daily checks:
□ Error rate < 0.1%
□ Response times normal
□ Database queries efficient
□ No complaints from users

Weekly report:
- Production incidents: 0 critical
- Feature adoption rate
- Performance metrics
- User feedback

Status: ✅ PRODUCTION STABLE
```

---

## 🚨 RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database migration fails | Low | High | Test on staging first, have rollback plan |
| Performance degrades | Low | Medium | Load test before deployment |
| Regional rules not applied | Medium | Low | Verify in UAT, add monitoring alerts |
| Multi-site routing bug | Low | High | Integration tests + manual testing |
| Translations missing | Medium | Low | Use English fallback, plan Phase 2 |

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment (Day 14)
- [ ] All code reviewed and merged
- [ ] Unit tests: 80%+ coverage
- [ ] Integration tests: All passing
- [ ] Database migration tested on staging
- [ ] Performance tests: < 2s for KPI calculations
- [ ] UAT completed with stakeholders
- [ ] Changelog updated
- [ ] Team trained on new features

### Deployment (Day 15)
- [ ] Backup production database
- [ ] Execute database migrations
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Health checks: All endpoints OK
- [ ] Smoke tests passing
- [ ] Feature flags: 10% rollout

### Post-Deployment (Days 15-21)
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Gradual feature rollout (10% → 50% → 100%)
- [ ] Daily standup on any issues
- [ ] End-user feedback collection
- [ ] Production bug fixes (if any)

---

## 💰 RESOURCE ALLOCATION

| Role | Days | Rate | Cost |
|------|------|------|------|
| Architect (oversight) | 3 | €150/hr | €3,600 |
| Backend Dev 1 | 10 | €100/hr | €8,000 |
| Backend Dev 2 | 10 | €100/hr | €8,000 |
| Frontend Dev | 8 | €100/hr | €6,400 |
| QA/Tester | 7 | €80/hr | €4,480 |
| DevOps (deployment) | 2 | €120/hr | €1,920 |
| **TOTAL** | | | **€32,400** |

*Assuming 8-hour workdays, 5-day weeks*

---

## 📞 ESCALATION CONTACTS

| Issue | Contact | Phone |
|-------|---------|-------|
| Database problems | DBA Team | +224-6XX-XXX |
| API issues | Backend Lead | +224-6XX-XXX |
| Frontend bugs | Frontend Lead | +224-6XX-XXX |
| Deployment blockers | DevOps Lead | +224-6XX-XXX |
| Executive escalation | CTO | +224-6XX-XXX |

---

## ✅ SUCCESS CRITERIA

**Deployment is SUCCESSFUL if:**
1. ✅ All 8 P1 files deployed without errors
2. ✅ Zero production incidents (P1/P2)
3. ✅ All KPIs calculated correctly
4. ✅ Multi-site routing working
5. ✅ Stakeholder approval: "System now Jupiter-grade"

**Expected Outcome**: 
- System 94% → 96% production-ready
- All P1 gaps closed
- Ready for P2 phase (formation, benchmarking, etc.)

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-04  
**Status**: READY FOR EXECUTION
