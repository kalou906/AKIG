# 🚀 RBAC Implementation Quick Start

## 5-Minute Setup

### Step 1: Run Database Migration (1 min)

```bash
cd backend
psql -U postgres -d akig < db/migrations/011_rbac_system.sql
```

### Step 2: Seed Default Data (1 min)

```bash
node db/seeders/rbac-seed.js
```

### Step 3: Add Permissions Endpoint (Already Done ✅)

The `/api/auth/permissions` endpoint is already added to `src/routes/auth.js`

### Step 4: Update Express App (2 min)

In `backend/src/index.js`, add permissions endpoint to routes:

```javascript
// Already added in auth.js, just verify it's imported:
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

### Step 5: Test Frontend (1 min)

```bash
cd frontend
npm start
```

Login with test user:
- Email: `compta@akig.test`
- Password: `Compta@Akig2025`

## Using in Your Code

### Backend: Protect API Routes

```javascript
const express = require('express');
const { requirePermission, requireRole } = require('./middleware/rbac');

const router = express.Router();

// Single permission
router.post('/export', 
  requirePermission('contracts.export'),
  (req, res) => {
    // Your handler
  }
);

// Multiple permissions (any)
router.post('/bulk-delete', 
  requirePermission('contracts.delete'),
  (req, res) => {
    // Your handler
  }
);

// Specific role
router.get('/admin', 
  requireRole('PDG'),
  (req, res) => {
    // Admin only
  }
);
```

### Frontend: Check Permissions

```tsx
import { usePermission, IfHasPermission } from '@akig/frontend';

export function MyComponent() {
  const { hasPermission, loading } = usePermission();

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Check in JSX */}
      {hasPermission('contracts.export') && (
        <button>Export Contracts</button>
      )}

      {/* Or use component wrapper */}
      <IfHasPermission permission="contracts.delete">
        <DeleteButton />
      </IfHasPermission>
    </div>
  );
}
```

## Add Custom Permissions

### Step 1: Add to Database

```sql
-- Add permission
INSERT INTO permissions (code, resource, action, description)
VALUES ('contracts.bulk_delete', 'contracts', 'DELETE', 'Delete multiple contracts');

-- Assign to PDG role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'PDG' 
AND p.code = 'contracts.bulk_delete';
```

### Step 2: Use in Backend

```javascript
router.post('/api/contracts/bulk-delete',
  requirePermission('contracts.bulk_delete'),
  async (req, res) => {
    // Your code
  }
);
```

### Step 3: Use in Frontend

```tsx
<IfHasPermission permission="contracts.bulk_delete">
  <BulkDeleteButton />
</IfHasPermission>
```

## Test Users

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `pdg@akig.test` | `PDG@Akig2025` | PDG | All (40+) |
| `compta@akig.test` | `Compta@Akig2025` | COMPTA | Financial (14) |
| `agent@akig.test` | `Agent@Akig2025` | AGENT | Operations (7) |
| `locataire@akig.test` | `Locataire@Akig2025` | LOCATAIRE | Read-only (4) |
| `proprietaire@akig.test` | `Proprio@Akig2025` | PROPRIETAIRE | Owner (9) |

## API Endpoint

### GET `/api/auth/permissions`

Get current user permissions and roles.

**Example:**

```javascript
const response = await fetch('/api/auth/permissions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.roles);        // ['COMPTA', 'AGENT']
console.log(data.permissions);  // ['contracts.view', 'payments.create', ...]
```

## Common Patterns

### Pattern 1: Simple Feature Toggle

```tsx
const { hasPermission } = usePermission();

if (hasPermission('contracts.export')) {
  // Show export button
}
```

### Pattern 2: Role-Based Dashboard Sections

```tsx
import { IfHasRole } from '@akig/frontend';

<IfHasRole role="PDG">
  <AdminSection />
</IfHasRole>

<IfHasRole role="COMPTA">
  <FinancialSection />
</IfHasRole>
```

### Pattern 3: Protected Component

```javascript
import { withPermission } from '@akig/frontend';

const ExportButton = () => <button>Export</button>;
export default withPermission(ExportButton, 'contracts.export');
```

### Pattern 4: Multiple Conditions

```tsx
<IfHasAllPermissions permissions={['contracts.view', 'contracts.edit']}>
  <EditForm />
</IfHasAllPermissions>
```

## Troubleshooting

### Permissions not loading?

Check browser console:
```javascript
const { permissions, error } = usePermission();
console.log(error);  // Check for errors
```

### Permission denied on API?

Check backend logs:
```bash
# Check auth middleware
curl -X GET http://localhost:4000/api/auth/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test user can't login?

Verify data was seeded:
```sql
SELECT * FROM users WHERE email = 'compta@akig.test';
SELECT * FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'compta@akig.test');
```

## Files Created

✅ **Database**
- `db/migrations/011_rbac_system.sql` - RBAC schema (600+ lines)
- `db/seeders/rbac-seed.js` - Default data seeder

✅ **Backend**
- `src/routes/auth.js` - Updated with `/permissions` endpoint
- `src/middleware/rbac.js` - RBAC utilities (already existed, enhanced)

✅ **Frontend**
- `src/hooks/usePermission.ts` - Permission checking hook
- `src/components/ProtectedComponent.tsx` - Permission guard components
- `src/index.ts` - Updated exports

✅ **Documentation**
- `RBAC_SYSTEM_GUIDE.md` - Complete guide
- `RBAC_IMPLEMENTATION_QUICK_START.md` - This file

## Next Steps

1. ✅ Run migration and seeder
2. ✅ Test login with test users
3. ✅ Add custom permissions as needed
4. ✅ Protect API routes with permissions
5. ✅ Add permission checks to UI
6. ✅ Monitor audit logs

## Support

For detailed documentation, see `RBAC_SYSTEM_GUIDE.md`

For examples, see `frontend/src/examples/TenantsManagementExample.tsx`

