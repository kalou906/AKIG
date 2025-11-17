# Authorization & Audit Integration Guide

## Overview

The AKIG backend provides a comprehensive authorization system integrated with detailed audit logging. Every authorization decision, permission check, and resource access is automatically tracked for compliance and security.

## Architecture

```
HTTP Request
    ↓
[auditLogMiddleware] - Generate request ID, track timing
    ↓
[Authentication] - Parse JWT, attach user
    ↓
[attachUserContext] - Load cached permissions/roles
    ↓
[rateLimitAuthAttempts] - Rate limit auth checks
    ↓
[logAuthorizationDecisions] - Log auth outcomes
    ↓
[Route Authorization Middleware]
├─ requirePermission('CODE')
├─ requireRole('ROLE')
├─ requireAnyPermission([...])
└─ requireAllPermissions([...])
    ↓
[Route Handler]
    ↓
[Audit Logging] - Log action, changes, and outcomes
    ↓
[Response]
```

## Core Functions

### 1. Basic Authorization Checks

#### `authorize(userId, permCode, context)`
Check if user has a specific permission.

```javascript
const hasAccess = await authorize(req.user.id, 'INVOICE_VIEW', {
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.requestId
});

if (!hasAccess) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

**Returns:** `boolean`

**Logs:** Failed authorization attempts to audit trail

---

#### `authorizeAny(userId, permCodes)`
Check if user has ANY of the specified permissions.

```javascript
const hasAccess = await authorizeAny(req.user.id, [
  'REPORT_VIEW',
  'REPORT_EXPORT'
]);
```

---

#### `authorizeAll(userId, permCodes)`
Check if user has ALL specified permissions.

```javascript
const hasAccess = await authorizeAll(req.user.id, [
  'INVOICE_CREATE',
  'INVOICE_AUDIT'
]);
```

---

#### `authorizeRole(userId, roleName)`
Check if user has a specific role.

```javascript
const isAdmin = await authorizeRole(req.user.id, 'SUPER_ADMIN');
```

---

#### `getUserPermissions(userId)`
Get all permission codes for a user.

```javascript
const permissions = await getUserPermissions(req.user.id);
// Returns: ['INVOICE_VIEW', 'INVOICE_CREATE', 'REPORT_VIEW', ...]
```

---

#### `getUserRoles(userId)`
Get all roles assigned to a user.

```javascript
const roles = await getUserRoles(req.user.id);
// Returns: ['OWNER', 'ACCOUNTANT']
```

## Middleware Functions

### 1. Permission-Based Middleware

#### `requirePermission(permCode)`
Express middleware that requires a single permission.

```javascript
router.get('/invoices', 
  requirePermission('INVOICE_VIEW'),
  async (req, res) => {
    // User has INVOICE_VIEW permission
  }
);
```

**Status Codes:**
- `200` - Success, permission granted
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (no permission)

---

#### `requireAnyPermission(permCodes)`
Require one of multiple permissions.

```javascript
router.post('/reports', 
  requireAnyPermission(['REPORT_VIEW', 'REPORT_EXPORT']),
  handler
);
```

---

#### `requireAllPermissions(permCodes)`
Require all specified permissions.

```javascript
router.delete('/invoices/:id',
  requireAllPermissions(['INVOICE_DELETE', 'INVOICE_AUDIT']),
  handler
);
```

### 2. Role-Based Middleware

#### `requireRole(roleName)`
Require a specific role.

```javascript
router.post('/admin/users',
  requireRole('SUPER_ADMIN'),
  handler
);
```

---

#### `requireAnyRole(roleNames)`
Require one of multiple roles.

```javascript
router.get('/dashboard',
  requireAnyRole(['OWNER', 'AGENCY', 'ACCOUNTANT']),
  handler
);
```

### 3. Resource-Based Middleware

#### `requireResourceAccess(resourceType, paramName)`
Check if user can access a specific resource by ID.

```javascript
router.get('/invoices/:id',
  requireResourceAccess('invoice', 'id'),
  handler
);

// Checks if user created the invoice OR is an admin
```

### 4. Context Middleware

#### `attachUserContext`
Attach user permissions and roles to request object.

**Usage:** Add globally before routes

```javascript
app.use(attachUserContext);
```

**Adds to req.user:**
- `req.user.permissions` - Array of permission codes
- `req.user.roles` - Array of role names
- `req.user.hasPermission(code)` - Helper function
- `req.user.hasAnyPermission([])` - Helper function
- `req.user.hasAllPermissions([])` - Helper function
- `req.user.hasRole(name)` - Helper function

**Usage in handlers:**

```javascript
if (req.user.hasPermission('REPORT_EXPORT')) {
  // Allow export
}
```

### 5. Rate Limiting & Audit

#### `rateLimitAuthAttempts(maxAttempts, windowSeconds)`
Rate limit authorization checks to prevent abuse.

```javascript
app.use(rateLimitAuthAttempts(100, 60)); // 100 attempts per 60 seconds
```

---

#### `logAuthorizationDecisions()`
Automatically log all authorization decisions (401, 403).

```javascript
app.use(logAuthorizationDecisions());
```

**Logs to audit trail:**
- Failed authorization attempts
- Resource access denials
- Permission mismatches

## Caching Functions

### `getCachedPermissions(userId)`
Get user permissions from in-memory cache.

```javascript
const cached = getCachedPermissions(req.user.id);
if (cached) {
  // Use cached permissions
} else {
  // Fetch from database
}
```

**Cache TTL:** 5 minutes (configurable)

---

### `cachePermissions(userId, permissions)`
Cache user permissions.

```javascript
cachePermissions(req.user.id, ['INVOICE_VIEW', 'INVOICE_CREATE']);
```

---

### `clearPermissionCache(userId)`
Clear permission cache for user (after role change).

```javascript
// After assigning new role to user
clearPermissionCache(req.user.id);
```

## Audit Integration

Every authorization decision is logged to the `access_audit` table:

### Failed Authorization Examples

```javascript
// Access denied - logged automatically
{
  user_id: 42,
  action: 'permission_denied',
  entity_type: 'authorization',
  description: 'Permission denied: INVOICE_DELETE',
  ip_address: '203.0.113.42',
  user_agent: 'Mozilla/5.0...',
  status: 'denied',
  error_message: 'Missing permission: INVOICE_DELETE',
  created_at: '2025-10-25T10:30:45Z'
}
```

### Successful Access Examples

```javascript
{
  user_id: 42,
  action: 'read',
  entity_type: 'invoices',
  entity_id: 1001,
  description: 'GET /api/invoices/1001',
  ip_address: '203.0.113.42',
  user_agent: 'Mozilla/5.0...',
  status: 'success',
  created_at: '2025-10-25T10:30:45Z'
}
```

## Sensitive Operations with Approval

High-risk operations can require approval:

```javascript
router.post('/payments',
  requirePermission('PAYMENT_CREATE'),
  auditMiddleware.auditSensitiveOperation('payment_creation', 'critical', true),
  handler
);
```

**Response (202 Accepted):**
```json
{
  "status": "pending_approval",
  "operationId": 12345
}
```

**After approval:** Operation is logged as completed with approval details.

## Setup in Express App

```javascript
const express = require('express');
const authMiddleware = require('./middleware/auth');
const {
  requirePermission,
  requireRole,
  attachUserContext,
  rateLimitAuthAttempts,
  logAuthorizationDecisions
} = require('./middleware/authorize');
const auditMiddleware = require('./middleware/audit');

const app = express();

app.use(express.json());

// ===== Authorization Setup =====

// 1. Audit logging for all requests
app.use(auditMiddleware.auditLogMiddleware);

// 2. Authentication
app.use(authMiddleware);

// 3. Load user context (permissions, roles)
app.use(attachUserContext);

// 4. Rate limit authorization attempts
app.use(rateLimitAuthAttempts(100, 60));

// 5. Log authorization decisions
app.use(logAuthorizationDecisions());

// ===== Routes =====

// Public endpoints (no auth required)
app.post('/auth/login', authMiddleware.login);
app.post('/auth/register', authMiddleware.register);

// Protected endpoints
app.get('/invoices', 
  requirePermission('INVOICE_VIEW'), 
  invoiceRoutes
);

app.post('/admin/users',
  requireRole('SUPER_ADMIN'),
  adminRoutes
);

app.listen(4000);
```

## Audit Trail Queries

### Get all failed authorization attempts for a user

```sql
SELECT * FROM access_audit
WHERE user_id = 42
  AND action = 'permission_denied'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Get all resource access denials

```sql
SELECT * FROM access_audit
WHERE status = 'denied'
  AND entity_type = 'authorization'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Suspicious access patterns

```sql
SELECT 
  user_id,
  COUNT(*) as denial_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  MAX(created_at) as latest
FROM access_audit
WHERE status = 'denied'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10;
```

## Best Practices

### 1. Always Use Middleware
Prefer middleware over manual checks when possible:

```javascript
// ✅ Good
router.get('/invoices', requirePermission('INVOICE_VIEW'), handler);

// ❌ Avoid (manual check)
router.get('/invoices', async (req, res) => {
  const hasAccess = await authorize(req.user.id, 'INVOICE_VIEW');
  // ... more code
});
```

### 2. Use Specific Permissions
Create granular permissions instead of broad ones:

```javascript
// ✅ Good
requireAnyPermission(['INVOICE_VIEW', 'INVOICE_EXPORT']);

// ❌ Avoid
requirePermission('INVOICE_ADMIN');
```

### 3. Log Data Changes
Always log before/after values for modifications:

```javascript
await auditService.logAccess({
  userId: req.user.id,
  action: 'update',
  entityType: 'invoices',
  entityId: invoiceId,
  oldValues: oldInvoice,
  newValues: updatedInvoice,
  changedFields: Object.keys(updates)
});
```

### 4. Clear Cache on Permission Changes
After role/permission changes, clear cache:

```javascript
await updateUserRole(userId, newRole);
clearPermissionCache(userId); // Clear cache
```

### 5. Rate Limit Sensitive Endpoints
Use rate limiting for auth and sensitive operations:

```javascript
router.post('/payments',
  requirePermission('PAYMENT_CREATE'),
  rateLimitAuthAttempts(10, 60), // 10 per minute
  handler
);
```

## Troubleshooting

### Issue: "Permission Denied" on legitimate access

**Solution:**
1. Check user has permission assigned
2. Verify permission code is correct
3. Check cache: `getCachedPermissions(userId)`
4. Review audit trail: Query `access_audit` table

### Issue: Authorization checks taking too long

**Solution:**
1. Enable caching: `attachUserContext` middleware
2. Reduce cache TTL if permissions change frequently
3. Index `user_roles` and `role_permissions` tables
4. Use `getCachedPermissions()` for repeated checks

### Issue: Unauthorized audit logs appearing for legitimate users

**Solution:**
1. Check permission codes match exactly
2. Review role assignments
3. Clear permission cache
4. Verify user has required role

## Performance Tuning

### 1. Enable Permission Caching

```javascript
app.use(attachUserContext); // Caches for 5 minutes
```

**Impact:** 90%+ reduction in permission checks to database

### 2. Batch Operations

```javascript
// Instead of checking each invoice individually
const hasAccess = await authorizeAny(userId, [
  'INVOICE_VIEW',
  'INVOICE_EXPORT',
  'INVOICE_DELETE'
]);
```

### 3. Database Indexes

Ensure these indexes exist:

```sql
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_permissions_code ON permissions(code);
```

## Compliance

### GDPR
- ✅ All access logged with timestamps
- ✅ User can request access audit
- ✅ Data retention policies configurable
- ✅ Right to erasure supported

### SOC 2
- ✅ Complete audit trail
- ✅ Authorization controls logged
- ✅ Failed access attempts tracked
- ✅ User identity captured

### HIPAA
- ✅ Access logging by user
- ✅ Entity and action tracked
- ✅ IP addresses recorded
- ✅ Timestamps in UTC

## References

- [RBAC System Documentation](./RBAC_SYSTEM.md)
- [Audit Service API](../services/auditService.js)
- [Authorization Middleware Code](../middleware/authorize.js)
- [Audit Middleware Code](../middleware/audit.js)
