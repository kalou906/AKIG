# Role-Based Access Control (RBAC) System

## Overview

The AKIG system implements a comprehensive Role-Based Access Control (RBAC) system with granular permission management. This allows administrators to control exactly what actions users can perform.

## Architecture

```
Users
  ↓
User Roles (many-to-many)
  ↓
Roles
  ↓
Role Permissions (many-to-many)
  ↓
Permissions
```

## Default Roles

### 1. SUPER_ADMIN
- **Description**: Full system access with all permissions
- **Use Case**: System administrators only
- **Permissions**: All (80+ permissions)

### 2. OWNER
- **Description**: Property owner - manages properties, agencies, and analytics
- **Use Case**: Property owners/landlords
- **Permissions**:
  - View invoices, payments, reports
  - Export reports and analytics
  - Assign roles to team members
  - View audit logs

### 3. AGENCY
- **Description**: Agency admin - manages tenants and invoices
- **Use Case**: Property management companies
- **Permissions**:
  - Create, edit, send invoices
  - Bulk send invoices
  - Create and sign contracts
  - View payments and reports
  - Manage tenants

### 4. TENANT
- **Description**: Tenant - views invoices and makes payments
- **Use Case**: Residential/commercial tenants
- **Permissions**:
  - View own invoices
  - View own payments
  - Process payments
  - View own contracts

### 5. ACCOUNTANT
- **Description**: Finance team - manages reports and reconciliation
- **Use Case**: Finance departments
- **Permissions**:
  - View and export all invoices and payments
  - Reconcile payments
  - Generate financial reports
  - View cash flow analysis
  - View audit logs

### 6. SUPPORT
- **Description**: Customer support - assist users with issues
- **Use Case**: Support teams
- **Permissions**:
  - View user information
  - View invoices and payments
  - View audit logs
  - Limited read-only access

## Permission Categories

### INVOICE (7 permissions)
- `INVOICE_CREATE` - Create new invoices
- `INVOICE_VIEW` - View invoices
- `INVOICE_EDIT` - Edit invoice details
- `INVOICE_DELETE` - Delete invoices
- `INVOICE_EXPORT` - Export to CSV/PDF
- `INVOICE_SEND` - Send to single tenant
- `INVOICE_BULK_SEND` - Send to multiple tenants

### PAYMENT (6 permissions)
- `PAYMENT_VIEW` - View payment records
- `PAYMENT_PROCESS` - Process new payments
- `PAYMENT_REFUND` - Issue refunds
- `PAYMENT_EXPORT` - Export payment reports
- `PAYMENT_RECONCILE` - Reconcile transactions
- `PAYMENT_CONFIG` - Configure payment methods

### USER (7 permissions)
- `USER_CREATE` - Create new users
- `USER_VIEW` - View user details
- `USER_EDIT` - Edit user information
- `USER_DELETE` - Delete user accounts
- `USER_ASSIGN_ROLE` - Assign/remove roles
- `USER_RESET_PASSWORD` - Reset passwords
- `USER_DISABLE_2FA` - Disable two-factor auth

### REPORT (5 permissions)
- `REPORT_VIEW` - View reports
- `REPORT_EXPORT` - Export reports
- `REPORT_ANALYTICS` - View analytics dashboard
- `REPORT_CASHFLOW` - View cash flow analysis
- `REPORT_ARREARS` - View arrears reports

### CONTRACT (6 permissions)
- `CONTRACT_CREATE` - Create contracts
- `CONTRACT_VIEW` - View contracts
- `CONTRACT_EDIT` - Edit contract terms
- `CONTRACT_DELETE` - Delete contracts
- `CONTRACT_SIGN` - Sign contracts
- `CONTRACT_RENEW` - Renew contracts

### SYSTEM (5 permissions)
- `SYSTEM_CONFIG` - Configure system settings
- `SYSTEM_AUDIT` - View audit logs
- `SYSTEM_BACKUP` - Manage backups
- `SYSTEM_METRICS` - View system metrics
- `SYSTEM_USERS` - Manage system users

## Usage in Express Routes

### Protect with Single Permission
```javascript
const { requirePermission } = require('../middleware/rbac');

router.get(
  '/invoices',
  requirePermission('INVOICE_VIEW'),
  async (req, res) => {
    // User has INVOICE_VIEW permission
  }
);
```

### Protect with Role
```javascript
const { requireRole } = require('../middleware/rbac');

router.post(
  '/admin/users',
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    // Only SUPER_ADMIN users can access
  }
);
```

### Protect with Multiple Permissions (ANY)
```javascript
const { requireAnyPermission } = require('../middleware/rbac');

router.get(
  '/reports',
  requireAnyPermission(['REPORT_VIEW', 'REPORT_EXPORT']),
  async (req, res) => {
    // User needs at least one permission
  }
);
```

### Check Permissions in Code
```javascript
const rbac = require('../middleware/rbac');

const permissions = await rbac.getUserPermissions(userId);
const hasAccess = await rbac.hasPermission(userId, 'INVOICE_CREATE');
const roles = await rbac.getUserRoles(userId);
```

## API Endpoints for RBAC Management

### Assign Role to User
```
POST /api/admin/users/:userId/roles/:roleName
Authorization: Bearer token
Body: {}

Response:
{
  "message": "Role OWNER assigned to user 123",
  "data": {
    "userId": 123,
    "roleName": "OWNER",
    "assignedAt": "2025-10-25T14:30:00Z"
  }
}
```

### Remove Role from User
```
DELETE /api/admin/users/:userId/roles/:roleName
Authorization: Bearer token

Response:
{
  "message": "Role OWNER removed from user 123",
  "data": {
    "userId": 123,
    "roleName": "OWNER",
    "removedAt": "2025-10-25T14:30:00Z"
  }
}
```

### Get User Permissions
```
GET /api/users/me/permissions
Authorization: Bearer token

Response:
{
  "permissions": [
    "INVOICE_VIEW",
    "INVOICE_CREATE",
    "PAYMENT_VIEW",
    ...
  ],
  "roles": ["AGENCY"]
}
```

## Database Tables

### roles
```sql
id          | SERIAL PRIMARY KEY
name        | TEXT UNIQUE NOT NULL (e.g., 'OWNER', 'SUPER_ADMIN')
description | TEXT
created_at  | TIMESTAMP
updated_at  | TIMESTAMP
```

### permissions
```sql
id          | SERIAL PRIMARY KEY
code        | TEXT UNIQUE NOT NULL (e.g., 'INVOICE_VIEW')
description | TEXT
category    | TEXT (e.g., 'INVOICE', 'PAYMENT')
created_at  | TIMESTAMP
```

### role_permissions (Junction)
```sql
role_id       | INT REFERENCES roles
permission_id | INT REFERENCES permissions
created_at    | TIMESTAMP
PRIMARY KEY   | (role_id, permission_id)
```

### user_roles (Junction)
```sql
user_id    | INT REFERENCES users
role_id    | INT REFERENCES roles
assigned_at | TIMESTAMP
assigned_by | INT REFERENCES users
PRIMARY KEY | (user_id, role_id)
```

## Best Practices

### 1. Principle of Least Privilege
Always assign users the minimum permissions they need to do their job.

```javascript
// Bad: Assigning SUPER_ADMIN to everyone
await assignRoleToUser(userId, 'SUPER_ADMIN', adminId);

// Good: Assigning only needed role
await assignRoleToUser(userId, 'AGENCY', adminId);
```

### 2. Use Permission Checks, Not Role Checks
Check permissions instead of roles for better maintainability.

```javascript
// Avoid: Checking roles
if (userRoles.includes('OWNER')) { /* ... */ }

// Prefer: Checking permissions
if (await hasPermission(userId, 'INVOICE_EXPORT')) { /* ... */ }
```

### 3. Consistent Permission Naming
Use consistent naming: `RESOURCE_ACTION`
- INVOICE_VIEW
- INVOICE_CREATE
- INVOICE_DELETE

### 4. Audit Trail
All role assignments are logged with the user who assigned them.

```sql
SELECT user_id, role_id, assigned_at, assigned_by
FROM user_roles
WHERE assigned_at > NOW() - INTERVAL '7 days'
ORDER BY assigned_at DESC;
```

### 5. Caching Permissions
For performance, cache user permissions during the session:

```javascript
// Attach permissions to request object
app.use(attachUserPermissions);

// Access permissions from req.user.permissions
if (req.user.permissions.includes('INVOICE_VIEW')) {
  // proceed
}
```

## Migration Steps

1. Run the migration:
   ```bash
   psql -d akig < db/migrations/003_roles_permissions.sql
   ```

2. Assign roles to existing users:
   ```bash
   npm run script -- assign-initial-roles.js
   ```

3. Update route handlers to use RBAC middleware

4. Test permissions for each role

## Troubleshooting

### User Can't Access Endpoint
1. Check if user has the required role: `SELECT * FROM user_roles WHERE user_id = ?`
2. Check if role has the permission: `SELECT * FROM role_permissions WHERE role_id = ?`
3. Verify permission exists: `SELECT * FROM permissions WHERE code = ?`

### Performance Issues
1. Add indexes (already done in migration)
2. Use the `user_permissions_view` for complex queries
3. Cache permissions in Redis for high-traffic scenarios

### Adding New Permission
```sql
INSERT INTO permissions (code, description, category)
VALUES ('NEW_ACTION', 'Description', 'CATEGORY');

-- Assign to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_NAME' AND p.code = 'NEW_ACTION';
```

## Testing

```javascript
// Test permission check
const has = await rbac.hasPermission(userId, 'INVOICE_VIEW');
assert(has === true, 'User should have permission');

// Test role assignment
await rbac.assignRoleToUser(userId, 'AGENCY', adminId);
const roles = await rbac.getUserRoles(userId);
assert(roles.includes('AGENCY'), 'User should have AGENCY role');

// Test middleware
const req = { user: { id: userId } };
const res = { status: jest.fn().json };
await requirePermission('INVOICE_VIEW')(req, res, next);
```

---
**Status**: Production Ready ✅
**Last Updated**: October 25, 2025
