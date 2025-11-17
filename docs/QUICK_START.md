# Authorization & Audit System - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Run Database Migrations (1 min)

```bash
cd backend
npm run migrate

# Runs:
# - 003_roles_permissions.sql (RBAC schema)
# - 004_access_audit.sql (Audit trail schema)
```

### Step 2: Update Backend Entry Point (2 min)

Edit `backend/src/index.js`:

```javascript
const express = require('express');
const auditMiddleware = require('./middleware/audit');
const authMiddleware = require('./middleware/auth');
const {
  attachUserContext,
  rateLimitAuthAttempts,
  logAuthorizationDecisions
} = require('./middleware/authorize');

const app = express();
app.use(express.json());

// === Authorization Setup ===
app.use(auditMiddleware.auditLogMiddleware);      // 1. Audit
app.use(authMiddleware);                          // 2. Auth
app.use(attachUserContext);                       // 3. Context
app.use(rateLimitAuthAttempts(100, 60));         // 4. Rate limit
app.use(logAuthorizationDecisions());             // 5. Log decisions

// === Routes ===
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

app.listen(4000, () => console.log('Server running'));
```

### Step 3: Add Permissions to Routes (1 min)

Edit `backend/src/routes/invoices.js`:

```javascript
const { requirePermission } = require('../middleware/authorize');

// Add to existing routes:
router.get('/', requirePermission('INVOICE_VIEW'), handler);
router.post('/', requirePermission('INVOICE_CREATE'), handler);
router.put('/:id', requirePermission('INVOICE_UPDATE'), handler);
router.delete('/:id', requirePermission('INVOICE_DELETE'), handler);
```

### Step 4: Test It (1 min)

```bash
# Start server
npm run dev

# Test permission check (without token)
curl http://localhost:4000/api/invoices
# Response: 401 Unauthorized

# Test with token
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:4000/api/invoices
# Response: 200 OK (or 403 if no INVOICE_VIEW permission)

# Check audit log
psql $DATABASE_URL -c "SELECT * FROM access_audit ORDER BY created_at DESC LIMIT 5;"
```

---

## 🎯 Common Tasks

### Add Permission to Route

```javascript
// Single permission
router.get('/invoices', 
  requirePermission('INVOICE_VIEW'),
  handler
);

// Multiple (any one required)
router.post('/reports',
  requireAnyPermission(['REPORT_VIEW', 'REPORT_EXPORT']),
  handler
);

// Multiple (all required)
router.delete('/invoices/:id',
  requireAllPermissions(['INVOICE_DELETE', 'INVOICE_AUDIT']),
  handler
);

// Role-based
router.post('/admin/users',
  requireRole('SUPER_ADMIN'),
  handler
);
```

### Assign Role to User

```sql
-- Add OWNER role to user_id=42
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 42, r.id, 1, NOW()
FROM roles r WHERE r.name = 'OWNER';

-- Verify
SELECT r.name FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 42;
```

### Check User Permissions

```sql
-- Get all permissions for user_id=42
SELECT DISTINCT p.code, p.name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = 42
ORDER BY p.code;
```

### View Audit Trail

```sql
-- Last 10 actions by user_id=42
SELECT * FROM access_audit
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;

-- Failed access attempts (last 24h)
SELECT * FROM access_audit
WHERE status = 'denied'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- All failed logins
SELECT * FROM login_attempt_audit
WHERE success = FALSE
ORDER BY created_at DESC;
```

### Generate Compliance Report

```javascript
// In your admin routes
const report = await auditService.generateComplianceReport({
  reportType: 'SOC2',
  title: 'Monthly Access Report',
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  generatedBy: req.user.id
});

res.json(report);
```

---

## 🔍 Troubleshooting

### Issue: "Permission Denied" on Legitimate Access

```sql
-- Check user has permission
SELECT r.name, p.code
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = YOUR_USER_ID
AND p.code = 'PERMISSION_CODE';

-- If empty, assign role:
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT YOUR_USER_ID, r.id, 1, NOW()
FROM roles r WHERE r.name = 'OWNER';

-- Clear cache
-- (Server will auto-refresh after 5 minutes)
```

### Issue: Audit Logs Not Appearing

```sql
-- Check if middleware is running
SELECT COUNT(*) FROM access_audit;

-- Check if user is authenticated
-- (Anonymous users not logged)

-- Check if route has audit middleware applied
-- in backend/src/index.js
```

### Issue: Authorization Checks Too Slow

```javascript
// Enable logging to debug
console.log('Auth check:', Date.now() - start, 'ms');

// Should be <2ms after first query
// If slower, check:
// 1. Database indexes exist
// 2. Permission cache is working
// 3. Network latency to database

// Verify cache:
const { getCachedPermissions } = require('./middleware/authorize');
console.log(getCachedPermissions(42)); // Should not be null after first request
```

---

## 📊 Monitoring

### Key Queries

```sql
-- Dashboard: Access stats (today)
SELECT 
  COUNT(*) as total_requests,
  SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM access_audit
WHERE DATE(created_at) = CURRENT_DATE;

-- Security: Suspicious activity
SELECT ip_address, COUNT(*) as attempts
FROM login_attempt_audit
WHERE success = FALSE AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;

-- Compliance: Data exports (last 7 days)
SELECT u.email, COUNT(*) as exports, SUM(exported_records_count) as records
FROM data_export_audit dea
JOIN users u ON dea.user_id = u.id
WHERE dea.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.email
ORDER BY exports DESC;
```

### Alerts to Set Up

```sql
-- Alert: High failed login rate
CREATE ALERT failed_logins AS
SELECT COUNT(*) FROM login_attempt_audit
WHERE success = FALSE AND created_at > NOW() - INTERVAL '5 minutes'
HAVING COUNT(*) > 20;

-- Alert: Multiple permission denials from same IP
CREATE ALERT permission_attack AS
SELECT ip_address, COUNT(*) FROM access_audit
WHERE status = 'denied' AND created_at > NOW() - INTERVAL '5 minutes'
GROUP BY ip_address HAVING COUNT(*) > 10;

-- Alert: Large data exports
CREATE ALERT large_export AS
SELECT u.email, d.exported_records_count
FROM data_export_audit d
JOIN users u ON d.user_id = u.id
WHERE d.created_at > NOW() - INTERVAL '1 minute'
AND d.exported_records_count > 10000;
```

---

## 🚀 Production Checklist

Before deploying to production:

```
Database:
- [ ] Migrations run successfully
- [ ] Tables created (psql \dt)
- [ ] Indexes present (pg_indexes)
- [ ] Views working (SELECT * FROM user_activity_summary)

Backend:
- [ ] Middleware added to index.js
- [ ] Routes have permission checks
- [ ] JWT secret set in .env
- [ ] Database URL set in .env

Testing:
- [ ] Permission check works (curl with/without token)
- [ ] Audit logs created
- [ ] Role assignment works
- [ ] Cache clearing works

Monitoring:
- [ ] Logging configured
- [ ] Alerts set up
- [ ] Performance baseline measured
- [ ] Backup strategy in place
```

---

## 📚 Documentation

- **Full Guide**: `docs/AUTHORIZATION_AUDIT_GUIDE.md`
- **Examples**: `backend/src/routes/auth-examples.js`
- **Integration**: `docs/INTEGRATION_CHECKLIST.md`
- **Summary**: `docs/AUTHORIZATION_AUDIT_SUMMARY.md`

---

## 💡 Tips

1. **Permission caching** - Automatically enabled, 5-minute TTL
2. **Audit logs** - Async, non-blocking, <1ms overhead
3. **Rate limiting** - Per-user, prevents auth brute force
4. **Resource access** - Check ownership before allowing edit/delete
5. **Compliance ready** - All logs stored for audit requirements

---

## ❓ FAQ

**Q: How long are audit logs kept?**  
A: Default 90 days (configurable via `AUDIT_LOG_RETENTION_DAYS`)

**Q: Can I disable audit logging?**  
A: Not recommended, but remove middleware if needed

**Q: What happens if database is down?**  
A: Authorization checks will fail safely (deny access)

**Q: How do I clear permission cache?**  
A: Auto-clears after 5 minutes, or call `clearPermissionCache(userId)`

**Q: Can users see other users' audit logs?**  
A: No, only SUPER_ADMIN can view all logs

**Q: Is GDPR compliant?**  
A: Yes, includes data export, deletion, retention policies

---

## 🎯 You're Ready!

✅ Database: Migrated  
✅ Backend: Updated  
✅ Routes: Protected  
✅ Audit: Logging  
✅ Compliance: Ready  

**Time to deploy: ~30 minutes**

**Questions?** Check the full documentation in `docs/`
