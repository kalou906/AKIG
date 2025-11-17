# 🚀 AKIG v3.5 - QUICK START GUIDE

**Get AKIG running in 5 minutes** ⏱️

---

## ⚡ Ultra-Quick Start (Development)

### 1. Clone & Install (1 min)
```bash
cd c:\AKIG\backend
npm install

# Add new dependencies
npm install pg redis dayjs pdfkit node-cron
npm install --save-dev @types/node-cron
```

### 2. Setup Environment (30 sec)
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/akig
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
PORT=4000
NODE_ENV=development
S3_BUCKET=optional
AWS_REGION=optional
EOF
```

### 3. Start Docker Stack (1 min)
```bash
# From project root
docker-compose up -d

# Verify services
docker-compose ps

# Check database
psql postgresql://user:password@localhost:5432/akig -c "SELECT version();"
```

### 4. Run Migrations (1 min)
```bash
# New migrations (Phase 3)
npm run migrate:up 006_audit_i18n_risk.ts

# Verify tables created
psql $DATABASE_URL -c "\dt audit_logs, translations, risk_assessments"
```

### 5. Start Server (30 sec)
```bash
npm run dev

# Terminal should show:
# ✅ Server running on http://localhost:4000
# ✅ PostgreSQL connected
# ✅ Redis connected
```

---

## ✅ Verify Installation

### Test Database Connection
```bash
curl http://localhost:4000/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "cache": "connected",
  "timestamp": "2025-10-26T..."
}
```

### Test New Endpoints

#### 1. Risk Prediction
```bash
# Get risk score for a tenant
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/analytics/risk-score/tenant-uuid

# Response:
{
  "success": true,
  "data": {
    "locataire_id": "...",
    "risk_score": 65,
    "risk_level": "RED",
    "factors": [...]
  }
}
```

#### 2. Dashboard KPIs
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/analytics/dashboard/kpis

# Response: Real-time metrics
```

#### 3. Charts
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/analytics/charts/payments-by-week

# Response: Chart.js compatible data
```

#### 4. PDF Report
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "monthly", "siteId": "site-uuid"}' \
  http://localhost:4000/api/analytics/reports/monthly-pdf \
  > report.pdf
```

#### 5. Audit Trail
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/audit/trail/appel/appel-uuid

# Response: Complete history with changes
```

#### 6. Translations
```bash
curl http://localhost:4000/api/i18n/translations?lang=en

# Response: All translations for English
```

---

## 🔧 Service Initialization

### Update `backend/src/index.js`

```javascript
// Add imports
import { AuditService } from './services/audit.service';
import { RiskPredictionService } from './services/riskPrediction.service';
import { I18nService } from './services/i18n.service';
import { BackupService, scheduleBackupCron } from './services/backup.service';
import { auditMiddleware, captureRequestBody } from './middleware/audit.middleware';
import { languageDetectionMiddleware, languageHeaderMiddleware } from './middleware/i18n.middleware';
import analyticsRoutes, { createAnalyticsRoutes } from './routes/analytics';

// Initialize services (after pool creation)
const auditService = new AuditService(pool);
const riskService = new RiskPredictionService(pool);
const i18nService = new I18nService(pool);
const backupService = new BackupService({
  database_url: process.env.DATABASE_URL,
  backup_dir: '/var/backups/akig',
  s3_bucket: process.env.S3_BUCKET,
  s3_region: process.env.AWS_REGION,
  retention_days: 30
});

// Register middleware (BEFORE routes)
app.use(captureRequestBody);
app.use(auditMiddleware(auditService));
app.use(languageDetectionMiddleware(i18nService));
app.use(languageHeaderMiddleware);

// Register analytics routes
app.use('/api/analytics', createAnalyticsRoutes(pool, riskService, CacheService));

// Schedule background jobs
scheduleBackupCron(backupService);

// Schedule risk recalculation (nightly @ 1 AM)
cron.schedule('0 1 * * *', async () => {
  console.log('🔄 Recalculating risk scores...');
  const count = await riskService.recalculateAllRisks();
  console.log(`✅ Updated ${count} tenant risk scores`);
});
```

---

## 📚 Example Usage

### 1. Audit a New Action
```javascript
// In your route handler
await auditService.auditAppel(
  appelId,
  userId,
  'create',
  {
    locataire_id: tenantId,
    numero: '+33612345678',
    duree_minutes: 15,
    outcome: 'promesse'
  },
  req.ip
);
```

### 2. Calculate Tenant Risk
```javascript
try {
  const risk = await riskService.calculateRiskScore(tenantId);
  
  console.log(`Tenant ${risk.locataire_id}:`);
  console.log(`  Risk Level: ${risk.risk_level}`);
  console.log(`  Score: ${risk.risk_score}/100`);
  console.log(`  Recommendation: ${risk.recommendation}`);
} catch (error) {
  console.error('Risk calculation failed:', error);
}
```

### 3. Get High-Risk Tenants
```javascript
const risks = await riskService.getHighRiskTenants(siteId, 50);

// Display in dashboard
console.log(`Found ${risks.length} high-risk tenants:`);
risks.forEach(r => {
  console.log(`  ${r.locataire_id}: ${r.risk_level} (${r.risk_score})`);
});
```

### 4. Translate UI String
```javascript
const label = await i18nService.translate('ui.appels', 'fr');
console.log(label); // "Appels"

const label_en = await i18nService.translate('ui.appels', 'en');
console.log(label_en); // "Calls"
```

### 5. Execute Backup
```javascript
const result = await backupService.executeFullBackup();

console.log(`Backup: ${result.filename}`);
console.log(`Size: ${result.size_bytes / 1024 / 1024} MB`);
console.log(`Status: ${result.status}`);

if (result.status === 'success') {
  console.log(`✅ Backup stored in: ${result.location}`);
}
```

### 6. Get Backup History
```javascript
const history = backupService.getBackupHistory(10);

history.forEach(backup => {
  console.log(`${backup.timestamp}: ${backup.filename} - ${backup.status}`);
});
```

---

## 🧪 Testing New Features

### 1. Create Test Tenant with Risk
```javascript
// Insert test tenant
const testTenant = await pool.query(
  `INSERT INTO locataires (nom, contact, site_id)
   VALUES ('Test Tenant', '0612345678', $1)
   RETURNING id`,
  [siteId]
);

// Add recent delays to trigger risk
const tenantId = testTenant.rows[0].id;

for (let i = 0; i < 3; i++) {
  await pool.query(
    `INSERT INTO paiements (locataire_id, montant, date_paiement, date_echeance, statut)
     VALUES ($1, 1000, NOW() - INTERVAL '${i + 1} days', NOW() - INTERVAL '${i + 2} days', 'pending')`,
    [tenantId]
  );
}

// Calculate risk
const risk = await riskService.calculateRiskScore(tenantId);
console.log('Test Tenant Risk:', risk);
```

### 2. Test PDF Generation
```javascript
// Generate monthly report
const response = await fetch('http://localhost:4000/api/analytics/reports/monthly-pdf', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'monthly',
    siteId: 'optional-site-id'
  })
});

const pdf = await response.blob();
console.log(`Generated PDF: ${pdf.size / 1024} KB`);
```

### 3. Test Multi-Language
```javascript
// Test language switching
const url = new URL('http://localhost:4000/api/analytics/dashboard/kpis');

// Request in French
url.searchParams.set('lang', 'fr');
const fr_response = await fetch(url);
const fr_data = await fr_response.json();

// Request in English
url.searchParams.set('lang', 'en');
const en_response = await fetch(url);
const en_data = await en_response.json();

console.log('FR Response:', fr_data);
console.log('EN Response:', en_data);
```

---

## 🔍 Debugging

### Check Audit Logs
```sql
-- View recent audit
SELECT action, entity_type, user_id, timestamp, status
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 20;

-- Search for specific entity
SELECT * FROM audit_logs
WHERE entity_type = 'appel' AND entity_id = 'appel-uuid'
ORDER BY timestamp DESC;

-- Full-text search
SELECT * FROM audit_logs
WHERE search_text @@ plainto_tsquery('french', 'appel')
LIMIT 10;
```

### Check Risk Assessments
```sql
-- View all risk scores
SELECT locataire_id, risk_score, risk_level, last_updated
FROM risk_assessments
ORDER BY risk_score DESC;

-- Get high-risk tenants
SELECT * FROM risk_assessments
WHERE risk_level IN ('RED', 'CRITICAL')
ORDER BY risk_score DESC;

-- View risk trend
SELECT * FROM get_risk_trend('tenant-uuid'::UUID, 30);
```

### Check Backups
```sql
-- View backup history
SELECT * FROM backup_metadata
ORDER BY created_at DESC
LIMIT 10;

-- Check backup status
SELECT filename, status, location, created_at
FROM backup_metadata
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Check Translations
```sql
-- List all French translations
SELECT key, value FROM translations WHERE language = 'fr' ORDER BY key;

-- List English translations
SELECT key, value FROM translations WHERE language = 'en' ORDER BY key;

-- Find missing translations
SELECT DISTINCT t1.key FROM translations t1
LEFT JOIN translations t2 ON t1.key = t2.key AND t2.language = 'en'
WHERE t1.language = 'fr' AND t2.id IS NULL;
```

---

## 🐛 Common Issues

### Issue: Redis Connection Failed
```bash
# Check Redis is running
docker exec akig-redis redis-cli ping

# If not:
docker-compose restart redis

# Verify connection in app
curl http://localhost:4000/api/health
```

### Issue: Database Migration Error
```bash
# Check migration status
npm run migrate:status

# Run specific migration
npm run migrate:up 006_audit_i18n_risk.ts

# Rollback if needed
npm run migrate:down 006_audit_i18n_risk.ts
```

### Issue: Audit Logs Not Appearing
```bash
# Check middleware is registered
# Look for: app.use(auditMiddleware(auditService))

# Check table exists
psql $DATABASE_URL -c "SELECT * FROM audit_logs LIMIT 1;"

# Check permissions
psql $DATABASE_URL -c "GRANT ALL ON audit_logs TO current_user;"
```

### Issue: PDF Generation Timeout
```javascript
// Increase timeout for large reports
app.post('/reports/monthly-pdf', async (req, res) => {
  req.setTimeout(30000); // 30 seconds
  // ... generate PDF
});
```

---

## 📈 Performance Monitoring

### Check Response Times
```bash
# Test endpoint performance
time curl http://localhost:4000/api/analytics/dashboard/kpis

# Should be < 500ms with cache
```

### Monitor Cache Hit Rate
```bash
# Check Redis
docker exec akig-redis redis-cli INFO stats

# Look for: hits, misses, hit_rate
```

### Monitor Database
```bash
# Check query performance
psql $DATABASE_URL -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check index usage
SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

---

## 📞 Support & Next Steps

### Need Help?
- 📖 See: `/docs/onboarding/DEVELOPER_SETUP.md`
- 📋 See: `/docs/adr/README.md`
- 🆘 See: `/ops/runbooks/INCIDENTS.md`

### Want to Extend?
- Add new risk factors in `riskPrediction.service.ts`
- Add new translations in `i18n.service.ts`
- Create new alert rules in `alert_rules.yml`
- Add new dashboard metrics in `analytics.ts`

### Ready for Production?
- [ ] Run full test suite: `npm test`
- [ ] Load testing: `npm run load-test`
- [ ] Security audit: `npm audit`
- [ ] Deploy to staging first
- [ ] Run UAT
- [ ] Blue-green deployment

---

**Last Updated**: 26 October 2025  
**Status**: ✅ Ready to Deploy  
**Quick Start Time**: 5 minutes ⏱️
