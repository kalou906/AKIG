# 🔐 Role-Based Access Control (RBAC) System Guide

## Overview

The AKIG platform now includes a complete **Role-Based Access Control (RBAC)** system for managing user permissions and authorizing API operations.

## Architecture

### Database Schema

The RBAC system consists of 6 interconnected tables:

```
┌─────────────────┐
│ users           │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ full_name       │
│ phone           │
│ hashed_password │
│ active          │
│ last_login      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ user_roles      │ (M:N linking table)
├─────────────────┤
│ user_id (FK)    │
│ role_id (FK)    │
│ assigned_at     │
└────────┬────────┘
         │
         │ N:1
         ▼
┌─────────────────┐
│ roles           │
├─────────────────┤
│ id (PK)         │
│ code (UNIQUE)   │
│ name            │
│ description     │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌───────────────────────┐
│ role_permissions      │ (M:N linking table)
├───────────────────────┤
│ role_id (FK)          │
│ permission_id (FK)    │
└────────┬──────────────┘
         │
         │ N:1
         ▼
┌──────────────────────┐
│ permissions          │
├──────────────────────┤
│ id (PK)              │
│ code (UNIQUE)        │
│ resource             │
│ action               │
│ description          │
└──────────────────────┘

┌──────────────────────────┐
│ audit_log                │ (Read-only)
├──────────────────────────┤
│ id (BIGSERIAL PK)        │
│ user_id (FK, nullable)   │
│ action                   │
│ action_type              │
│ target                   │
│ status                   │
│ description              │
│ meta (JSONB)             │
│ created_at               │
└──────────────────────────┘
```

### Default Roles

The system includes 5 predefined roles with hierarchical permissions:

| Role | Level | Description | Scope |
|------|-------|-------------|-------|
| **PDG** | 1 (Highest) | President/CEO | Full access to all features |
| **COMPTA** | 2 | Accountant | Financial operations, reporting |
| **AGENT** | 3 | Field Agent | Payment collection, contract viewing |
| **LOCATAIRE** | 4 | Tenant | Read-only: own contracts, payments |
| **PROPRIETAIRE** | 4 | Property Owner | View/edit owned properties, contracts |

### Permissions

The system includes **40+ granular permissions** organized by resource:

#### Contracts
- `contracts.view` - View contracts
- `contracts.create` - Create new contracts
- `contracts.edit` - Edit contracts
- `contracts.delete` - Delete contracts
- `contracts.generate` - Generate PDF
- `contracts.export` - Export to file
- `contracts.import` - Import from file

#### Payments
- `payments.view` - View payments
- `payments.create` - Create payments
- `payments.edit` - Edit payments
- `payments.delete` - Delete payments
- `payments.import` - Import payment batch
- `payments.export` - Export payment report
- `payments.reconcile` - Reconcile payments

#### Tenants
- `tenants.view` - View tenant list
- `tenants.create` - Create tenant
- `tenants.edit` - Edit tenant info
- `tenants.delete` - Delete tenant
- `tenants.export` - Export tenant report

#### Reports
- `reports.view` - View reports
- `reports.generate` - Generate custom report
- `reports.export` - Export report
- `reports.payment_status` - Payment status report
- `reports.collection` - Collection report

#### Reminders
- `reminders.view` - View reminders
- `reminders.create` - Create reminder
- `reminders.schedule` - Schedule reminder

#### Settings
- `settings.view` - View settings
- `settings.edit` - Edit settings
- `settings.manage_users` - Manage users
- `settings.audit_access` - Access audit log

#### Analytics
- `dashboard.view` - View dashboard
- `analytics.view` - View analytics

## Backend Implementation

### Setup

#### 1. Run Database Migration

```bash
# Run the RBAC migration
psql -U postgres -d akig < backend/db/migrations/011_rbac_system.sql

# Or using migration runner (if available)
npm run migrate
```

#### 2. Seed Default Data

```bash
# Run the seeder script
node backend/db/seeders/rbac-seed.js
```

This will create:
- 5 default roles (PDG, COMPTA, AGENT, LOCATAIRE, PROPRIETAIRE)
- 40+ default permissions
- 5 test users (one per role)

#### 3. Configure Express App

In `backend/src/index.js`:

```javascript
const express = require('express');
const { requireAuth } = require('./middleware/auth');
const { 
  requirePermission, 
  requireRole,
  attachUserPermissions 
} = require('./middleware/rbac');

const app = express();

// Apply globally
app.use(express.json());
app.use(requireAuth);                    // Verify JWT token
app.use(attachUserPermissions);          // Attach permissions to req

// Routes
app.get('/api/auth/permissions', (req, res) => {
  res.json({
    roles: req.user.roles,
    permissions: req.user.permissions
  });
});

// Protected routes
app.post('/api/contracts', 
  requirePermission('contracts.create'),
  contractsHandler
);

app.post('/api/payments/import', 
  requirePermission('payments.import'),
  paymentsImportHandler
);

app.get('/api/reports', 
  requirePermission('reports.view'),
  reportsHandler
);
```

### Middleware

#### `requirePermission(permissionCode)`

Checks if user has specific permission:

```javascript
// Single permission
router.post('/api/contracts/export', 
  requirePermission('contracts.export'),
  (req, res) => {
    // Only users with 'contracts.export' permission reach here
    res.json({ success: true });
  }
);
```

#### `requireRole(...roles)`

Checks if user has any of the specified roles:

```javascript
// Multiple roles (OR logic)
router.get('/api/admin/dashboard', 
  requireRole('PDG', 'COMPTA'),
  (req, res) => {
    // Only PDG or COMPTA users
    res.json({ admin_data: {} });
  }
);
```

#### `attachUserPermissions(req, res, next)`

Automatically fetches and attaches user permissions to `req.user`:

```javascript
// In middleware chain
app.use(attachUserPermissions);

// In route handler
router.get('/api/profile', (req, res) => {
  console.log(req.user.permissions);  // Array of permission codes
  console.log(req.user.roles);        // Array of role objects
});
```

### Utility Functions

#### `hasPermission(userId, permissionCode)`

```javascript
const { hasPermission } = require('./middleware/rbac');

const canExport = await hasPermission(userId, 'contracts.export');
if (canExport) {
  // Enable export
}
```

#### `hasRole(userId, roleName)`

```javascript
const { hasRole } = require('./middleware/rbac');

const isAdmin = await hasRole(userId, 'PDG');
```

#### `getUserPermissions(userId)`

```javascript
const { getUserPermissions } = require('./middleware/rbac');

const permissions = await getUserPermissions(userId);
// Returns: ['contracts.view', 'contracts.edit', 'payments.view', ...]
```

#### `getUserRoles(userId)`

```javascript
const { getUserRoles } = require('./middleware/rbac');

const roles = await getUserRoles(userId);
// Returns: [
//   { id: 1, name: 'COMPTA', code: 'COMPTA' },
//   ...
// ]
```

## Frontend Implementation

### `usePermission()` Hook

Use the `usePermission()` hook to check permissions in React components:

```tsx
import { usePermission } from '@akig/frontend';

export function ContractActions() {
  const { hasPermission, loading } = usePermission();

  if (loading) return <Spinner />;

  return (
    <div>
      {hasPermission('contracts.view') && (
        <button>View Contracts</button>
      )}
      {hasPermission('contracts.export') && (
        <button>Export Contracts</button>
      )}
      {hasPermission('payments.import') && (
        <button>Import Payments</button>
      )}
    </div>
  );
}
```

### Conditional Components

#### `<IfHasPermission>`

Show content only if user has permission:

```tsx
import { IfHasPermission } from '@akig/frontend';

<IfHasPermission permission="contracts.export">
  <ExportButton />
</IfHasPermission>

// With fallback
<IfHasPermission 
  permission="contracts.delete" 
  fallback={<p>Permission denied</p>}
>
  <DeleteButton />
</IfHasPermission>
```

#### `<IfHasAnyPermission>`

Show content if user has ANY of the permissions:

```tsx
<IfHasAnyPermission permissions={['contracts.export', 'contracts.import']}>
  <FileMenu />
</IfHasAnyPermission>
```

#### `<IfHasAllPermissions>`

Show content if user has ALL permissions:

```tsx
<IfHasAllPermissions permissions={['contracts.view', 'contracts.edit']}>
  <EditForm />
</IfHasAllPermissions>
```

#### `<IfHasRole>`

Show content if user has specific role:

```tsx
<IfHasRole role="PDG">
  <AdminPanel />
</IfHasRole>
```

#### `<IfHasAnyRole>`

Show content if user has ANY of the roles:

```tsx
<IfHasAnyRole roles={['PDG', 'COMPTA']}>
  <ReportDashboard />
</IfHasAnyRole>
```

### Higher-Order Components

#### `withPermission(Component, permission)`

Protect a component:

```tsx
const ProtectedExport = withPermission(
  ExportButton, 
  'contracts.export',
  <p>Insufficient permissions</p>
);

// Usage
<ProtectedExport />
```

#### `withRole(Component, role)`

Protect component by role:

```tsx
const AdminOnly = withRole(AdminPanel, 'PDG');

<AdminOnly />
```

### `<DisabledIfNoPermission>`

Disable button if user lacks permission:

```tsx
<DisabledIfNoPermission 
  permission="contracts.delete"
  title="You don't have permission to delete"
>
  Delete Contract
</DisabledIfNoPermission>
```

## Usage Examples

### Example 1: Contract Management Page

```tsx
import React from 'react';
import {
  usePermission,
  IfHasPermission,
  IfHasAnyPermission
} from '@akig/frontend';

export function ContractPage() {
  const { hasPermission, hasRole } = usePermission();
  const [contracts, setContracts] = React.useState([]);

  const handleDelete = async (id) => {
    if (!hasPermission('contracts.delete')) {
      alert('Permission denied');
      return;
    }
    // Delete contract
  };

  return (
    <div>
      <h1>Contracts</h1>

      {/* Action buttons */}
      <div className="actions">
        <IfHasPermission permission="contracts.view">
          <button onClick={() => fetchContracts()}>Refresh</button>
        </IfHasPermission>

        <IfHasPermission permission="contracts.create">
          <button onClick={() => openCreateModal()}>+ New Contract</button>
        </IfHasPermission>

        <IfHasAnyPermission permissions={['contracts.export', 'contracts.import']}>
          <button onClick={() => openFileMenu()}>Files</button>
        </IfHasAnyPermission>
      </div>

      {/* Contract list */}
      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Tenant</th>
            <th>Status</th>
            {hasPermission('contracts.edit') && <th>Edit</th>}
            {hasPermission('contracts.delete') && <th>Delete</th>}
          </tr>
        </thead>
        <tbody>
          {contracts.map(contract => (
            <tr key={contract.id}>
              <td>{contract.number}</td>
              <td>{contract.tenant}</td>
              <td>{contract.status}</td>
              {hasPermission('contracts.edit') && (
                <td>
                  <button onClick={() => editContract(contract.id)}>
                    Edit
                  </button>
                </td>
              )}
              {hasPermission('contracts.delete') && (
                <td>
                  <button onClick={() => handleDelete(contract.id)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 2: Dashboard with Role-Based Sections

```tsx
import React from 'react';
import { IfHasRole, usePermission } from '@akig/frontend';

export function Dashboard() {
  const { hasRole } = usePermission();

  return (
    <div className="dashboard">
      {/* All users see overview */}
      <OverviewCards />

      {/* Only COMPTA and PDG see financial dashboard */}
      <IfHasAnyRole roles={['COMPTA', 'PDG']}>
        <FinancialDashboard />
      </IfHasAnyRole>

      {/* Only PDG sees admin panel */}
      <IfHasRole role="PDG">
        <AdminPanel />
      </IfHasRole>

      {/* Tenants see only their contracts */}
      <IfHasRole role="LOCATAIRE">
        <TenantPortal />
      </IfHasRole>
    </div>
  );
}
```

## Audit Logging

All access and modifications are logged to the `audit_log` table:

### Backend Logging

```javascript
const { logAudit } = require('./middleware/rbac');

// Log successful operation
await logAudit({
  userId: req.user.id,
  action: 'PAYMENT_IMPORT',
  actionType: 'CREATE',
  target: 'file:payments_batch_2025-01-01.csv',
  status: 'SUCCESS',
  description: 'Imported 150 payments',
  meta: { records_count: 150, file_size: '2.5MB' }
});

// Log failed operation
await logAudit({
  userId: req.user.id,
  action: 'CONTRACT_DELETE',
  actionType: 'DELETE',
  target: 'contract:12345',
  status: 'DENIED',
  description: 'User lacks permission',
  meta: { permission_required: 'contracts.delete' }
});
```

### Query Audit Log

```sql
-- All actions by a user
SELECT * FROM audit_log 
WHERE user_id = 42 
ORDER BY created_at DESC;

-- Failed authorization attempts
SELECT * FROM audit_log 
WHERE status = 'DENIED' 
ORDER BY created_at DESC;

-- Payment import audits
SELECT * FROM audit_log 
WHERE action = 'PAYMENT_IMPORT' 
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Test Credentials

Default test users created by seeder:

| Email | Password | Role |
|-------|----------|------|
| `pdg@akig.test` | `PDG@Akig2025` | PDG |
| `compta@akig.test` | `Compta@Akig2025` | COMPTA |
| `agent@akig.test` | `Agent@Akig2025` | AGENT |
| `locataire@akig.test` | `Locataire@Akig2025` | LOCATAIRE |
| `proprietaire@akig.test` | `Proprio@Akig2025` | PROPRIETAIRE |

## Configuration

### Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/akig
JWT_SECRET=your-secret-key-change-in-production
PORT=4000

# Frontend
REACT_APP_API_URL=http://localhost:4000/api
```

### Adding Custom Permissions

To add new permissions:

```sql
-- Insert new permission
INSERT INTO permissions (code, resource, action, description)
VALUES ('contracts.bulk_delete', 'contracts', 'DELETE', 'Delete multiple contracts');

-- Assign to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'PDG' 
AND p.code = 'contracts.bulk_delete';
```

### Assigning Custom Roles

```sql
-- Create new role
INSERT INTO roles (code, name, description)
VALUES ('MANAGER', 'Manager', 'Property manager');

-- Add permissions to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'MANAGER'
AND p.code IN ('contracts.view', 'contracts.create', 'payments.view');

-- Assign role to user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'manager@example.com'
AND r.code = 'MANAGER';
```

## Best Practices

### 1. Always Check Permissions

Always verify permissions in both frontend and backend:

```javascript
// Frontend: Conditional rendering
{hasPermission('contracts.export') && <ExportButton />}

// Backend: Route protection
router.post('/api/contracts/export',
  requirePermission('contracts.export'),
  handler
);
```

### 2. Use Specific Permissions

Use granular permissions instead of generic ones:

```javascript
// ✅ Good
requirePermission('payments.import')

// ❌ Too generic
requirePermission('payments.manage')
```

### 3. Log Important Actions

Always log sensitive operations:

```javascript
await logAudit({
  userId: req.user.id,
  action: 'PAYMENT_IMPORT',
  actionType: 'CREATE',
  target: 'file:import.csv',
  status: 'SUCCESS',
  meta: { records_count: 100 }
});
```

### 4. Use Role-Based Sections

Use roles for major feature sections:

```tsx
<IfHasRole role="PDG">
  <AdminPanel />
</IfHasRole>
```

### 5. Use Permissions for Actions

Use permissions for individual actions:

```tsx
{hasPermission('contracts.delete') && (
  <DeleteButton />
)}
```

## API Endpoint Reference

### GET `/api/auth/permissions`

Get user permissions and roles.

**Authentication:** Required

**Response:**

```json
{
  "ok": true,
  "roles": ["COMPTA", "AGENT"],
  "permissions": [
    "contracts.view",
    "contracts.create",
    "payments.view",
    "payments.create",
    "reports.view"
  ],
  "roleDetails": [
    { "id": 2, "code": "COMPTA", "name": "Accountant" },
    { "id": 3, "code": "AGENT", "name": "Field Agent" }
  ],
  "permissionDetails": [
    { "code": "contracts.view", "resource": "contracts", "action": "view" },
    ...
  ]
}
```

## Troubleshooting

### User Can't Access Feature

1. Check permissions in frontend:
   ```javascript
   const { permissions } = usePermission();
   console.log('User permissions:', permissions);
   ```

2. Check permissions in database:
   ```sql
   SELECT DISTINCT p.code
   FROM permissions p
   INNER JOIN role_permissions rp ON rp.permission_id = p.id
   INNER JOIN user_roles ur ON ur.role_id = rp.role_id
   WHERE ur.user_id = USER_ID;
   ```

3. Check role assignments:
   ```sql
   SELECT r.code, r.name
   FROM roles r
   INNER JOIN user_roles ur ON ur.role_id = r.id
   WHERE ur.user_id = USER_ID;
   ```

### Permission Not Matching

Make sure permission codes match exactly:

```javascript
// Database
'contracts.export'

// Frontend check
hasPermission('contracts.export')  // ✅ Works

hasPermission('export_contracts')  // ❌ Won't work
hasPermission('contracts_export')  // ❌ Won't work
```

## Next Steps

1. ✅ Database migration created (`011_rbac_system.sql`)
2. ✅ Seeder script created (`rbac-seed.js`)
3. ✅ Backend permissions endpoint created (`/api/auth/permissions`)
4. ✅ Frontend `usePermission` hook created
5. ✅ Frontend protected components created
6. ⏳ Deploy and test with real users
7. ⏳ Create custom permissions as needed
8. ⏳ Monitor audit logs for compliance

