# 🎓 JUPITER-GRADE P1: DEEP DIVE IMPLEMENTATION GUIDE

**Document**: Comprehensive technical guide for implementing Priority 1 features  
**Target Audience**: Technical leads, architects, senior developers  
**Scope**: 8 files, 2,650 lines of production code  
**Timeline**: 2-3 weeks (5-7 developers)

---

## 📋 TABLE OF CONTENTS

1. Architecture Overview
2. Feature-by-Feature Deep Dive
3. Integration Strategy
4. Data Modeling
5. Testing Strategy
6. Deployment Timeline
7. Success Metrics

---

## 1️⃣ ARCHITECTURE OVERVIEW

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JUPITER-GRADE P1 ARCHITECTURE            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Frontend (React 18)                     │  │
│  │  - AdvancedKPIDashboard.tsx (300L)                  │  │
│  │  - MultiSiteSelector (100L)                         │  │
│  │  - RetentionCampaignUI (200L)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         API Layer (Express + Multi-Site Router)     │  │
│  │  - /api/kpi/* (KPI endpoints)                       │  │
│  │  - /api/retention/* (Retention endpoints)           │  │
│  │  - /api/tasks/prioritize (Task prioritization)      │  │
│  │  - /api/alerts/explain (AI Explainability)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Business Logic Services (Node.js)           │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ TenantRetention │  │ TaskPrioritization       │  │  │
│  │  │ Service (400L)  │  │ Service (350L)           │  │  │
│  │  └─────────────────┘  └──────────────────────────┘  │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ AIExplainability│  │ AdvancedKPIService       │  │  │
│  │  │ Service (300L)  │  │ (400L)                   │  │  │
│  │  └─────────────────┘  └──────────────────────────┘  │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ MultiSiteRouter │  │ RegionalRules Config     │  │  │
│  │  │ Middleware      │  │ (250L)                   │  │  │
│  │  └─────────────────┘  └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer (PostgreSQL 12+)                        │  │
│  │  - 9 new tables                                     │  │
│  │  - 25+ new indexes                                  │  │
│  │  - site_id partitioning across all core tables      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow: Example - Retention Campaign

```
Scenario: Identify high-risk locataires + proposer rétention

1. Nightly Batch (23h):
   TenantRetentionService.identifyRetentionPriorities()
   ↓
   - Query contracts + payment history: 5000 tenants
   - Calculate scores: 5000 profiles
   - Identify 50 "critical" risk tenants
   ↓
   Save to retention_scores table

2. Morning (08h):
   Manager views "Retention Dashboard"
   ↓
   AdvancedKPIDashboard loads retention_scores
   ↓
   Top 10 at-risk tenants displayed with reasons

3. Manager Action:
   Click "Create Campaign for Top 10"
   ↓
   TenantRetentionService.createRetentionCampaign()
   ↓
   - Insert retention_campaigns record
   - Create retention_actions for each tenant
   - Send notifications to agents

4. Agent Follow-up:
   Agent receives task prioritized by TaskPrioritizationService
   ↓
   TOP PRIORITY: Contact Studio_102 tenant
   - Why: "Payment reliability 75% (target 95%) + 2 missed payments"
   - Recommend: "15% discount for 3 months"
   - Success rate: 70% (from similar cases)

5. Tracking:
   Agent executes action → recordRetentionAction()
   ↓
   After 90 days: trackCampaignResults()
   ↓
   Report: "Campaign engaged 45/50 tenants, 32 renewed (64% conversion)"
```

---

## 2️⃣ FEATURE-BY-FEATURE DEEP DIVE

### 2.1 TenantRetentionService (400 Lines)

**Purpose**: Identify valuable locataires at risk of leaving + propose retention actions

**Key Classes/Methods**:

```typescript
// Main API
profileTenant(tenantId: string): Promise<TenantProfile>
calculateRetentionScore(profile: TenantProfile): number // 0-100
assessRetentionRisk(profile, score): RetentionScore
identifyRetentionPriorities(limit = 50): Promise<RetentionScore[]>
createRetentionCampaign(tenantIds, campaignName, budget): Promise<Campaign>

// Internal
private async getPaymentHistory(tenantId)
private async getContractMetrics(tenantId)
private async getActivityMetrics(tenantId)
private async getReferralCount(tenantId)
```

**Score Calculation Formula**:

```
Base Score: 100

- Déduct Points:
  - Payment reliability < 95%: -30 points * (1 - reliability)
  - Missed payments: -5 points each
  - Contract duration < 24 months: -20 * (1 - duration/24)
  - Inactive > 60 days: Up to -20 points
  - Activity declining: -15 points
  - Low satisfaction < 7/10: -2 points per point difference

+ Bonus Points:
  - Referrals: +2 points each (up to +10)

Final: Math.max(0, Math.min(100, calculated_score))
```

**Risk Levels**:
- **Low (80+)**: 5% churn probability → Monitor
- **Medium (60-79)**: 15% churn → Light intervention
- **High (40-59)**: 35% churn → Moderate intervention
- **Critical (<40)**: 60% churn → Urgent intervention

**Retention Actions**:

| Risk Level | Actions | Incentive | Timeline |
|------------|---------|-----------|----------|
| Critical | Personalized offer (15% discount) + VIP status | 50k-100k GNF | 30-90 days |
| High | Discount (10% × 3 months) + service addon | 30-50k GNF | 90 days |
| Medium | Loyalty reward (5% annual discount) | 20-30k GNF | 365 days |

**Database Queries**:

```sql
-- 1. Fetch 50 at-risk tenants (nightly)
SELECT t.id, COUNT(DISTINCT c.id) as contract_count,
       AVG(p.amount) as avg_payment,
       SUM(CASE WHEN p.status = 'missed' THEN 1 ELSE 0 END) as missed_count
FROM tenants t
LEFT JOIN contracts c ON t.id = c.tenant_id AND c.status = 'active'
LEFT JOIN payments p ON t.id = p.tenant_id
WHERE c.created_at >= NOW() - INTERVAL '24 months'
GROUP BY t.id
HAVING SUM(CASE WHEN p.status = 'missed' THEN 1 ELSE 0 END) > 0
       OR AVG(p.amount) < (SELECT AVG(amount) FROM payments) * 0.7
ORDER BY missed_count DESC, avg_payment DESC
LIMIT 50;

-- 2. Create retention campaign
INSERT INTO retention_campaigns (campaign_id, name, tenant_count, budget, expected_roi, start_date, end_date)
SELECT 'RET_' || TO_CHAR(NOW(), 'YYYYMMDDHH24MI'), 'High Risk Q4 2024', 50, 2500000, 2.5, NOW()::DATE, (NOW() + INTERVAL '90 days')::DATE;

-- 3. Insert retention actions for each tenant
INSERT INTO retention_actions (tenant_id, action_type, description, incentive_value, ...)
SELECT t.id, 'personalized_offer', ..., monthly_rent * 0.15
FROM tenants t WHERE t.id = ANY($1::VARCHAR[]);
```

**Integration Points**:
1. Called from nightly scheduler (cronjob)
2. API endpoint: `POST /api/retention/analyze` (manual trigger)
3. Feeds data to AdvancedKPIDashboard
4. Works with TaskPrioritizationService (creates agent tasks)

---

### 2.2 TaskPrioritizationService (350 Lines)

**Purpose**: Intelligently prioritize agent daily tasks based on urgency, impact, agent expertise

**Scoring Algorithm**:

```
Overall Priority Score (0-100) = 
  35% × Urgency Score +
  35% × Impact Score +
  20% × Agent Affinity +
  10% × Dependency Score
```

**Sub-scores**:

1. **Urgency (0-100)**:
   - Overdue: 100 - (5 × days_overdue)
   - Today: 90-100
   - This week (1-3 days): 70-90
   - Further out: 50 - (1.5 × days_out)

2. **Impact (0-100)**: Based on task type + tenant value
   - Payment follow: 90 (critical revenue)
   - Litige: 95 (escalation risk)
   - Notice: 80 (legal deadline)
   - Inspection: 60 (routine)

3. **Agent Affinity (0-100)**: Historical performance on this task type
   - Completion rate: 30 points
   - Customer rating: 20 points
   - Speed: 20 points
   - Expertise gaps: -10 points

4. **Dependency (0-100)**: Does this task block others?
   - Each blocked task: +20 points
   - Max 100 points

**Daily Manifesto Example**:

```json
{
  "agentId": "AGENT_001",
  "date": "2024-11-04",
  "topTasks": [
    {
      "taskId": "TASK_001",
      "title": "Follow up: Studio_102 payment (15 days overdue)",
      "taskType": "payment_follow",
      "impact": "critical",
      "metrics": {
        "overallPriorityScore": 98,
        "urgencyScore": 100,
        "impactScore": 95,
        "agentAffinityScore": 85
      },
      "reason": "URGENT: Due today or overdue + High business impact + Blocks other tasks",
      "estimatedDuration": 45,
      "contractValue": 500000
    },
    {
      "taskId": "TASK_002",
      "title": "Send notice renewal: Property X",
      "taskType": "notice",
      "impact": "high",
      "metrics": {
        "overallPriorityScore": 82,
        "urgencyScore": 85,
        "impactScore": 80
      }
    },
    {
      "taskId": "TASK_003",
      "title": "Inspection: Maintenance issue at Apt Y",
      "taskType": "inspection",
      "metrics": {
        "overallPriorityScore": 65
      }
    }
  ],
  "totalTasks": 12,
  "estimatedWorkload": 7.5,
  "recommendations": [
    "Start with Studio_102 (98 priority) - payment critical",
    "Then notice renewal (82 priority)",
    "Consider delegating inspection to junior agent"
  ],
  "riskFactors": [
    "Workload: 7.5h (below 8h safe zone)",
    "No high-affinity tasks (low success rate for you)"
  ]
}
```

---

### 2.3 AIExplainabilityService (300 Lines)

**Purpose**: Every AI alert must explain its reasoning (no black-box AI)

**Explainability Framework**:

Each alert includes:
1. **Engine**: Which AI model triggered it?
   - Delinquency pattern detection (ML regression)
   - Seasonality analysis (time-series)
   - Anomaly detection (isolation forest)
   - Custom rule (deterministic)
   - Ensemble (multiple models voted)

2. **Signals**: What data points contributed?
   ```json
   [
     {
       "signal": "Payment missed 15 days",
       "weight": 35,
       "severity": "negative"
     },
     {
       "signal": "Revenue down 20% vs Q4 normal",
       "weight": 25,
       "severity": "negative"
     },
     {
       "signal": "Contract duration 3+ years",
       "weight": -10,
       "severity": "positive"
     }
   ]
   ```

3. **Root Causes**: What's really happening?
   - Evidence-backed
   - Historical precedent ("72% of tenants with 2+ late payments default within 6 months")
   - Legal/contractual context

4. **Recommendations**: What to do?
   - Ranked by success rate
   - With effort/timeline
   - Approval required?

5. **Similar Cases**: How have we handled this before?
   - Past case ID, action taken, result
   - Similarity score (0-100)

**Example Alert Explanation**:

```
ALERT: Studio_102 - Payment Risk 78%

REASONING:
├─ Engine: Ensemble (Delinquency Pattern 82% + Anomaly Detection 74%)
├─ Confidence: 78%
└─ Data Points Used: 47

ROOT CAUSES:
1. Paiements manqués antérieurs (65% likelihood)
   - Evidence: 2 missed payments in 12 months
   - Evidence: Average 12-day delay on payments
   - Precedent: "72% of tenants with 2+ late payments default"

2. Changement situation économique (45% likelihood)
   - Evidence: Tenant reports "job search"
   - Evidence: Request frequency down 40% vs 3-month average

3. Non-contactabilité (40% likelihood)
   - Evidence: No activity in 35 days (last seen 35 days ago)
   - Evidence: SMS/Email: pas de réponse

RECOMMENDATIONS:
1. Contacter immédiatement + proposer plan paiement (70% success rate, effort: low)
   - Timeline: Immédiat (24h)
   - Approval: Not required
   - Outcome: "Éviter défaut - historique: 70% acceptent plan"

2. Proposer réduction 5% si paiement dans 3 jours (55% success rate, effort: low)
   - Timeline: Immédiat
   - Approval: REQUIRED (Manager sign-off)
   - Outcome: "Incentivize payment"

SIMILAR CASES:
- Case #2024-08-045: Contacter + offer plan paiement → RESOLVED in 14 days (98% similar)
- Case #2024-07-123: Ignored for 30 days → ESCALATED to legal (95% similar)

EXPLAINABILITY SCORE: 87/100 (Très bien documenté)
```

---

### 2.4 Local Languages i18n (500 Lines)

**Supported Languages**:

| Lang | Code | Speakers | Region | Priority |
|------|------|----------|--------|----------|
| French | fr | 7M+ | Official | P0 |
| English | en | Expat | Business | P0 |
| Soussou | ss | 1.8M | Guinea | P1 |
| Peulh | ff | 8M+ | West Africa | P1 |
| Malinké | kg | 10M+ | Mali/Guinea | P1 |
| Kissi | kss | 150k | Guinea/Liberia | P1 |

**Key Translations** (sampled):

| EN | FR | Soussou | Peulh | Malinké |
|----|----|----|--------|---------|
| Dashboard | Tableau de Bord | Kundo | Njuujaaru | Jàntèngèli |
| Contract | Contrat | Kuntolu | Debere | Jìrè |
| Payment | Paiement | Masa | Jambugol | Dìnà |
| Tenant | Locataire | Kunama | Joogalle | Dúnúnì |
| Dispute | Litige | Koosi | Palal | Bòli |

**Implementation**:

```typescript
// 1. Import in App.tsx
import './i18n/local-languages';

// 2. Use in components
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t, i18n } = useTranslation();
  
  return (
    <>
      <h1>{t('nav.dashboard')}</h1>
      <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="ss">Soussou</option>
        <option value="ff">Peulh</option>
        <option value="kg">Malinké</option>
        <option value="kss">Kissi</option>
      </select>
    </>
  );
}

// 3. Detect language automatically
// Language detector tries:
// 1. localStorage (if user previously selected)
// 2. Browser language
// 3. Falls back to 'en'
```

**Translation Crowdsourcing**:

```
Timeline:
- Week 1: Translate core 200 keys (En → Soussou, Peulh, Malinké)
- Week 2: Review by native speakers
- Week 3: Add remaining 100 keys + Kissi
- Week 4: QA + edge case handling (plurals, genders)

Budget: ~€2000-3000 for professional translators
Or: Community effort (open translation platform)

Tool: Use i18next-crowdsourcing plugin or spreadsheet import
```

---

### 2.5 Multi-Site Router Middleware (350 Lines)

**Multi-Site Routing Logic**:

```
Request arrives:
  ↓
1. Check X-Site-ID header (admin override)
  ↓
2. Check ?site=GN_CONAKRY query param (testing)
  ↓
3. Check JWT claims (user's assigned site)
  ↓
4. Geolocalisation via IP (fallback)
  ↓
Site context injected into request object:
  req.siteId = 'GN_CONAKRY'
  req.siteName = 'Conakry Headquarters'
  req.siteRegion = 'Conakry'
  req.userSitePermissions = ['read', 'write', 'approve_payments']
  ↓
All database queries automatically filtered:
  SELECT * FROM contracts WHERE site_id = 'GN_CONAKRY'
```

**Supported Sites**:

```typescript
const SITE_CONFIG = {
  // Guinea
  GN_CONAKRY: { maxTenants: 5000, failover: null },
  GN_KINDIA: { maxTenants: 2000, failover: 'GN_CONAKRY' },
  GN_MAMOU: { maxTenants: 1500, failover: 'GN_CONAKRY' },
  GN_LABE: { maxTenants: 1000, failover: 'GN_KINDIA' },
  
  // Regional
  SN_DAKAR: { maxTenants: 3000, failover: null },
  ML_BAMAKO: { maxTenants: 2500, failover: null },
};
```

**Failover Strategy**:

```
If GN_KINDIA database is down:
  → Requests routed to GN_CONAKRY (primary)
  → Data synced back when GN_KINDIA recovers
  → Conflict resolution: "last write wins" or manual
```

---

### 2.6 Regional Rules Config (250 Lines)

**Parameterized Business Rules** (not hardcoded):

```typescript
// Guinea - Conakry (standard)
taxes: { tpa: 5%, ifu: 8%, tva: 18%, housingTax: 2% }
legalDeadlines: { noticeToQuit: 30, evictionNotice: 15, disputeResolution: 60 }
paymentMethods: ['cash', 'bank_transfer', 'mobile_money']

// Guinea - Labé (Peulh region - different rules)
taxes: { tpa: 3%, ifu: 5%, tva: 18% }
legalDeadlines: { noticeToQuit: 40, evictionNotice: 30, disputeResolution: 150 } // More conservative
language: 'ff' (Peulh)
```

**How It Works**:

```
1. Contract created for GN_CONAKRY:
   Apply TPA: 5%
   
2. Contract created for GN_LABE:
   Apply TPA: 3%
   Use Peulh contract templates
   Default language: Peulh

3. Eviction notice in GN_MAMOU:
   Legal deadline: 25 days (vs 15 in Conakry)
   Must be sent via teller (no digital signature)
```

---

### 2.7 AdvancedKPIService (400 Lines)

**9 Core KPIs**:

| KPI | Formula | Target | Calculation |
|-----|---------|--------|-------------|
| **Resolution Time** | `AVG(completed_at - created_at)` | 45 days | SQL window function |
| **Resolution Rate** | `closed_contracts / total_contracts` | 95% | Percentage |
| **Deposit Return Rate** | `full_refunds / total_deposits` | 92% | Percentage |
| **NPS Score** | `(Promoters - Detractors) / Total × 100` | 50+ | Survey data |
| **Tenant Retention** | `renewed_tenants / previous_tenants` | 85% | Contract history |
| **Agent Productivity** | `contracts_managed / agents` | 15/month | Division |
| **Revenue/Agent** | `total_rent_12mo / agents` | 50M GNF | SUM |
| **Occupancy Rate** | `occupied_properties / total_properties` | 95% | Property count |
| **Portfolio Risk** | `(60% × default_rate + 30% × dispute_rate + 10% × inactive)` | <15 | Composite |

**Example KPI Report**:

```json
{
  "period": {
    "startDate": "2024-11-01",
    "endDate": "2024-11-30"
  },
  "metrics": {
    "averageResolutionTime": 38.5,
    "resolutionRate": 0.94,
    "npsScore": 48,
    "tenantRetentionRate": 0.82,
    "occupancyRate": 0.91
  },
  "trends": [
    {
      "metric": "Resolution Time",
      "currentValue": 38.5,
      "previousValue": 42.1,
      "percentageChange": -8.5,
      "trend": "up",
      "target": 45,
      "variance": -14.4
    }
  ],
  "benchmarks": [
    {
      "metric": "NPS Score",
      "yourValue": 48,
      "industryAverage": 35,
      "topPerformer": 70,
      "position": "above"
    }
  ],
  "improvements": [
    {
      "area": "Customer Satisfaction (NPS)",
      "currentScore": 48,
      "targetScore": 50,
      "priority": "medium",
      "recommendation": "Improve agent training, enhance communication"
    }
  ]
}
```

---

## 3️⃣ INTEGRATION STRATEGY

### 3.1 Phase 1: Data Model (Days 1-2)

**Action Items**:
1. Run SQL migration: `009_JUPITER_GRADE_P1_SCHEMA.sql`
   - Creates 9 new tables
   - Adds site_id to 6 core tables
   - Creates 25+ indexes

2. Update Prisma schema (if using ORM):
   ```prisma
   model TenantProfile { ... }
   model RetentionScore { ... }
   model Site { ... }
   ```

3. Run data backfill (optional):
   ```sql
   UPDATE contracts SET site_id = 'GN_CONAKRY' WHERE site_id IS NULL;
   UPDATE tenants SET site_id = 'GN_CONAKRY' WHERE site_id IS NULL;
   -- etc for all tables
   ```

---

### 3.2 Phase 2: Backend Services (Days 3-5)

**Action Items**:
1. Create services directory if not exists:
   ```bash
   mkdir -p backend/src/services
   mkdir -p backend/src/middleware
   mkdir -p backend/src/config
   ```

2. Copy 4 service files:
   - `TenantRetentionService.ts` (400L)
   - `TaskPrioritizationService.ts` (350L)
   - `AIExplainabilityService.ts` (300L)
   - `AdvancedKPIService.ts` (400L)

3. Copy middleware + config:
   - `multi-site-router.ts` (350L)
   - `regional-rules.ts` (250L)

4. Create API routes:
   ```typescript
   // backend/src/routes/kpi.ts
   router.get('/api/kpi/metrics', requireAuth, async (req, res) => {
     const service = new AdvancedKPIService(pool);
     const metrics = await service.calculateMetrics(
       new Date('2024-11-01'),
       new Date('2024-11-30'),
       req.siteId
     );
     res.json(metrics);
   });

   router.post('/api/retention/analyze', requireAuth, requirePermission('approve_retention'), async (req, res) => {
     const service = new TenantRetentionService(pool);
     const priorities = await service.identifyRetentionPriorities(50);
     res.json(priorities);
   });

   // ... etc
   ```

5. Integrate MultiSiteRouter middleware:
   ```typescript
   // backend/src/index.js
   const multiSiteRouter = new MultiSiteRouter(pool);
   app.use(multiSiteRouter.middleware());
   ```

---

### 3.3 Phase 3: Frontend Components (Days 6-7)

**Action Items**:
1. Create i18n configuration:
   ```bash
   cp frontend/src/i18n/local-languages.ts
   ```

2. Create new dashboard components:
   ```tsx
   // frontend/src/components/AdvancedKPIDashboard.tsx (300L)
   // - Import AdvancedKPIService API
   // - Render metrics with charts (Recharts)
   // - Show trends, benchmarks, improvements
   
   // frontend/src/components/RetentionCampaignUI.tsx (200L)
   // - List of at-risk tenants
   // - Suggested actions per tenant
   // - Campaign creation flow
   
   // frontend/src/components/MultiSiteSelector.tsx (100L)
   // - Dropdown to select site
   // - Re-fetch data when site changes
   
   // frontend/src/components/TaskManifesto.tsx (150L)
   // - Show agent's daily top-3 tasks
   // - Prioritization reasoning
   ```

3. Update App.tsx:
   ```tsx
   import './i18n/local-languages';
   
   // Add routes
   <Route path="/dashboard/advanced-kpi" component={AdvancedKPIDashboard} />
   <Route path="/retention/campaigns" component={RetentionCampaignUI} />
   <Route path="/tasks/today" component={TaskManifesto} />
   ```

---

### 3.4 Phase 4: Testing & QA (Days 8-10)

**Unit Tests**:
```typescript
// tests/TenantRetentionService.test.ts
describe('TenantRetentionService', () => {
  it('should calculate retention score correctly', async () => {
    const profile = { ...mockProfile };
    const score = service.calculateRetentionScore(profile);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should identify critical risk tenants', async () => {
    const priorities = await service.identifyRetentionPriorities(10);
    expect(priorities.length).toBeLessThanOrEqual(10);
    expect(priorities[0].riskLevel).toBe('critical');
  });
});

// tests/TaskPrioritizationService.test.ts
describe('TaskPrioritizationService', () => {
  it('should prioritize payment follow-up over inspection', async () => {
    const manifesto = await service.prioritizeAgentDailyTasks(agentId);
    expect(manifesto.topTasks[0].taskType).toBe('payment_follow');
  });
});
```

**Integration Tests**:
```typescript
// tests/integration/multi-site-routing.test.ts
describe('Multi-Site Router', () => {
  it('should filter contracts by site_id', async () => {
    const res = await request(app)
      .get('/api/contracts')
      .set('X-Site-ID', 'GN_KINDIA')
      .expect(200);
    
    res.body.forEach(contract => {
      expect(contract.site_id).toBe('GN_KINDIA');
    });
  });
});
```

**Performance Tests**:
```typescript
// tests/performance/kpi-calculation.test.ts
describe('KPI Performance', () => {
  it('should calculate metrics for 5000 tenants in < 5 seconds', async () => {
    const start = Date.now();
    const metrics = await service.calculateMetrics(startDate, endDate, 'GN_CONAKRY');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});
```

---

## 4️⃣ DATA MODELING

### 4.1 Multi-Site Data Model

```
┌─ sites ─────────────────────────────────────┐
│ id (PK)                                     │
│ name                                        │
│ country, region, timezone                   │
│ currency, language                          │
│ failover_site_id (FK)                      │
└─────────────────────────────────────────────┘
        ↓ (foreign key relationship)
┌─ user_site_assignments ───────────────────┐
│ user_id (FK to users)                     │
│ site_id (FK to sites)                     │
│ role_id                                   │
│ is_primary                                │
│ (enables multi-site access per user)      │
└────────────────────────────────────────────┘

All core tables now include site_id:
  contracts.site_id
  tenants.site_id
  payments.site_id
  notices.site_id
  litigations.site_id
  properties.site_id
```

---

### 4.2 Partitioning Strategy

**Option A: Logical Partitioning (Recommended)**
```sql
-- Partition contracts by site
CREATE TABLE contracts_gn_conakry PARTITION OF contracts
  FOR VALUES IN ('GN_CONAKRY');

CREATE TABLE contracts_gn_kindia PARTITION OF contracts
  FOR VALUES IN ('GN_KINDIA');
-- etc
```

**Benefits**:
- Faster queries when filtering by site
- Easier maintenance (drop partition to archive old data)
- Automatic query routing

---

## 5️⃣ TESTING STRATEGY

### 5.1 Test Matrix

| Feature | Unit | Integration | E2E | Load |
|---------|------|-------------|-----|------|
| Retention Scoring | ✅ | ✅ | ✅ | ✅ |
| Task Prioritization | ✅ | ✅ | ✅ | - |
| AI Explainability | ✅ | ✅ | - | - |
| Multi-Site Routing | ✅ | ✅ | ✅ | ✅ |
| KPI Calculation | ✅ | ✅ | ✅ | ✅ |

### 5.2 Load Testing

```javascript
// tests/load/kpi-calculation-load.js (k6/Artillery)
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  const res = http.get('http://localhost:4000/api/kpi/metrics');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
}

// Run: k6 run tests/load/kpi-calculation-load.js
```

---

## 6️⃣ DEPLOYMENT TIMELINE

### Week 1: Development
```
Mon-Tue: Data Model + Migrations
Wed:     Backend Services
Thu:     API Endpoints
Fri:     Frontend Components
```

### Week 2: Testing & Integration
```
Mon-Tue: Unit + Integration Tests
Wed:     Performance Testing
Thu:     UAT with stakeholders
Fri:     Bug fixes
```

### Week 3: Deployment
```
Mon: Staging deployment
Tue: Smoke tests + final checks
Wed: Production deployment (off-peak hours)
Thu-Fri: Monitoring + support
```

---

## 7️⃣ SUCCESS METRICS

### Business KPIs
- ✅ Tenant retention rate: +15% → 90%+
- ✅ Agent productivity: +20% → 18 contracts/month
- ✅ Payment collection: +10% → 98%+
- ✅ Average resolution time: -25% → 35 days

### Technical KPIs
- ✅ API response time: < 2 seconds
- ✅ Retention score calculation: < 5 seconds for 5000 tenants
- ✅ Uptime: 99.9%
- ✅ Test coverage: > 80%

---

## 📞 SUPPORT & QUESTIONS

**Deployment Issues**?
Contact: architecture@akig.local

**Translation crowdsourcing**?
Platform: Crowdin or Google Sheets

**Regional rules customization**?
Submit request to: regional-rules@akig.local

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-04  
**Status**: READY FOR IMPLEMENTATION
