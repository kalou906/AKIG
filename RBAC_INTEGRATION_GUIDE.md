// ============================================================================
// RBAC Integration Guide
// File: RBAC_INTEGRATION_GUIDE.md
// Purpose: Step-by-step guide for integrating RBAC across the application
// ============================================================================

# RBAC Integration Guide

This guide explains how to integrate the Role-Based Access Control (RBAC) system across the frontend and backend.

## Table of Contents

1. [Database Setup](#database-setup)
2. [Backend Integration](#backend-integration)
3. [Frontend Integration](#frontend-integration)
4. [Testing & Validation](#testing--validation)

---

## Database Setup

### 1. Run Migrations

```bash
# From backend directory
cd backend

# Run the main RBAC migration
node db/run-migration.js

# Verify tables were created
psql -U postgres -d akig -c "\dt"
```

Expected tables:
- `roles` - 5 predefined roles
- `permissions` - 11 permission codes
- `user_roles` - User to role mappings
- `role_permissions` - Role to permission mappings
- `users` - Extended with role/permission data
- `audit_log` - Permission change tracking

### 2. Seed Roles and Permissions

```bash
# Run the SQL seed file
psql -U postgres -d akig < db/seeds/2025_10_rbac_seed.sql

# Verify seeding
psql -U postgres -d akig -c "SELECT COUNT(*) FROM roles;"
psql -U postgres -d akig -c "SELECT COUNT(*) FROM permissions;"
```

Expected output:
- 5 roles (PDG, COMPTA, AGENT, LOCATAIRE, PROPRIETAIRE)
- 11 permissions

---

## Backend Integration

### 1. Update Express App Configuration

In `src/index.js`, add these routes:

```javascript
// Import route handlers
const contractsRoutes = require('./routes/contracts');
const tenantsRoutes = require('./routes/tenants');

// Mount routes with RBAC middleware
app.use('/api/contracts', contractsRoutes);
app.use('/api/tenants', tenantsRoutes);
```

### 2. Verify Middleware Stacking

```typescript
// Example from contracts.ts
router.post(
  '/generate',
  requireAuth,                        // 1. Verify user is authenticated
  requirePerm('contracts.generate'),  // 2. Verify has permission
  async (req, res) => {
    // 3. Check policy-level rules
    if (!canGenerateContract(req.user)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    // 4. Process request with audit logging
  }
);
```

### 3. Key Middleware Files

**authz.ts** - Authorization middleware
```typescript
export { requireAuth, requirePerm, requireAnyPerm, audit, hasPermission }
```

**scopes.ts** - Data scope restriction
```typescript
export { restrictOwnerScope, restrictTenantScope, applyScopes, buildScopeWhere, verifyResourceScope }
```

**contracts.ts (policies)** - Fine-grained policies
```typescript
export { canGenerateContract, canSendReminder, canViewTenant, ... }
```

### 4. Audit Logging Pattern

Every protected endpoint should log audit entries:

```typescript
// Log action start
await audit(req, 'CONTRACT_GENERATE', `contract:${id}`, {
  template: '...',
  tenant_id: variables?.tenant_id
});

// Log errors
await audit(req, 'CONTRACT_GENERATE_ERROR', 'contracts', {
  error: error.message
});
```

---

## Frontend Integration

### 1. Setup User Context

Create `src/context/UserContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../lib/rbac';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch user permissions from /api/auth/permissions
    fetch('/api/auth/permissions', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setError(null);
      })
      .catch(err => {
        setError(err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
```

### 2. Wrap Application with Provider

In `src/main.tsx`:

```typescript
import { UserProvider } from './context/UserContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
```

### 3. Use Permission Components

**Check single permission:**
```typescript
import { Protected } from './components/Protected';
import { useUser } from './context/UserContext';

function PaymentImport() {
  const { user } = useUser();

  return (
    <Protected user={user} perm="payments.import">
      <ImportForm />
    </Protected>
  );
}
```

**Check multiple permissions (ANY):**
```typescript
<Protected 
  user={user} 
  perms={['contracts.view', 'contracts.generate']} 
  mode="any"
>
  <ContractMenu />
</Protected>
```

**Conditional button:**
```typescript
import { PermissionButton } from './components/Protected';

<PermissionButton 
  user={user} 
  perm="contracts.generate"
  onClick={() => handleGenerate()}
>
  Generate Contract
</PermissionButton>
```

### 4. Use Permission Utilities

```typescript
import { can, canAll, canAny, hasRole } from './lib/rbac';

// Check permission
if (can(user, 'payments.import')) {
  // Show import section
}

// Check multiple (ALL required)
if (canAll(user, ['contracts.view', 'contracts.generate'])) {
  // Show advanced tools
}

// Check role
if (hasRole(user, 'PDG')) {
  // Show admin panel
}

// Use in lists
const actions = [
  { label: 'View', show: can(user, 'contracts.view') },
  { label: 'Generate', show: can(user, 'contracts.generate') },
  { label: 'Delete', show: hasRole(user, 'PDG') }
].filter(a => a.show);
```

### 5. Protected Route Pattern

```typescript
import { useUser } from './context/UserContext';
import { can, hasRole } from './lib/rbac';

function ProtectedRoute({ 
  component: Component, 
  requiredPerm 
}: { 
  component: React.ComponentType; 
  requiredPerm: string 
}) {
  const { user, loading } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user || !can(user, requiredPerm)) {
    return <div>Access Denied</div>;
  }

  return <Component />;
}
```

---

## Testing & Validation

### 1. Backend Testing

**Test authorization middleware:**
```bash
# Test without token
curl http://localhost:4000/api/contracts

# Test with token (should be 401/403 without permission)
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/contracts/generate

# Check audit logs
psql -U postgres -d akig -c "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;"
```

### 2. Frontend Testing

**Test with mock user:**
```typescript
const mockUser = {
  id: 1,
  email: 'user@example.com',
  roles: ['AGENT'],
  permissions: ['contracts.view', 'payments.view']
};

// Test permission check
can(mockUser, 'contracts.view'); // true
can(mockUser, 'contracts.generate'); // false
```

**Test Protected component:**
```typescript
import { render, screen } from '@testing-library/react';
import { Protected } from './components/Protected';

it('shows content when permitted', () => {
  const user = { permissions: ['contracts.view'] };
  render(
    <Protected user={user} perm="contracts.view">
      <div>Visible</div>
    </Protected>
  );
  expect(screen.getByText('Visible')).toBeInTheDocument();
});

it('hides content when not permitted', () => {
  const user = { permissions: [] };
  render(
    <Protected user={user} perm="contracts.view">
      <div>Visible</div>
    </Protected>
  );
  expect(screen.queryByText('Visible')).not.toBeInTheDocument();
});
```

### 3. End-to-End Testing

**Complete flow:**

1. User logs in → Gets JWT token
2. Frontend fetches `/api/auth/permissions` → Gets user.permissions array
3. Frontend stores user in context/state
4. Component checks permission with `can(user, 'perm')`
5. User action creates backend request with auth header
6. Backend checks `requirePerm('perm')` middleware
7. Backend executes policy check: `canGenerateContract(req.user)`
8. Backend applies scope filter: PROPRIETAIRE only sees own data
9. Backend logs audit entry
10. Response sent with appropriate status (200, 403, 500)

---

## Common Patterns

### Pattern 1: Permission-Based Menu

```typescript
function MainMenu({ user }) {
  const items = [
    { label: 'Contracts', href: '/contracts', perm: 'contracts.view' },
    { label: 'Payments', href: '/payments', perm: 'payments.view' },
    { label: 'Reports', href: '/reports', perm: 'reports.view' },
    { label: 'Admin', href: '/admin', role: 'PDG' }
  ];

  return (
    <nav>
      {items
        .filter(item => 
          (item.perm && can(user, item.perm)) ||
          (item.role && hasRole(user, item.role))
        )
        .map(item => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
    </nav>
  );
}
```

### Pattern 2: Form Field Protection

```typescript
function ContractForm({ user }) {
  return (
    <form>
      <textarea name="content" defaultValue={contract.content} />
      
      <Protected user={user} perm="contracts.generate" fallback={<em>View only</em>}>
        <button type="submit">Save Changes</button>
      </Protected>
    </form>
  );
}
```

### Pattern 3: Admin Section

```typescript
function AdminPanel({ user }) {
  if (!hasRole(user, 'PDG')) {
    return <div>Not authorized</div>;
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      <UserManagement />
      <AuditLog />
    </div>
  );
}
```

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Roles and permissions seeded
- [ ] Backend routes mounted in Express app
- [ ] Frontend UserContext provider added
- [ ] UserProvider wraps root component
- [ ] Permission components imported and used
- [ ] Audit logging verified in database
- [ ] Frontend/backend integration tested
- [ ] E2E tests passing
- [ ] Role-based scope filters working
- [ ] All 401/403 responses tested
- [ ] Fallback UI components working
- [ ] Performance tested (permission queries < 100ms)

---

## Troubleshooting

**Issue: Permission always denied**
- Check token in Authorization header
- Verify user has permission in database: `SELECT * FROM user_permissions WHERE user_id = ?;`
- Check role assignments: `SELECT * FROM user_roles WHERE user_id = ?;`

**Issue: Data visible when shouldn't be**
- Verify scope middleware applied: `applyScopes` in route
- Check `req.scope` is set correctly
- Verify `verifyResourceScope()` called on individual records

**Issue: Audit logs not created**
- Verify `await audit(req, ...)` called with proper parameters
- Check database connection in middleware
- Verify `audit_log` table has INSERT permissions

**Issue: Components not re-rendering after permission change**
- Check UserContext is providing fresh user data
- Verify `useUser()` hook used in component
- May need to refresh page after permission change in database

---

## Next Steps

1. Create dashboard page using Protected components
2. Add permission labels/descriptions in UI
3. Setup automated tests for auth flow
4. Create admin panel for permission management
5. Implement real-time permission updates (WebSocket)

