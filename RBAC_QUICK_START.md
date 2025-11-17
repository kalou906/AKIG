// ============================================================================
// RBAC Quick Start Guide
// File: RBAC_QUICK_START.md
// Purpose: 5-minute setup guide for developers
// ============================================================================

# RBAC Quick Start Guide

Get the RBAC system running in 5 minutes.

## Prerequisites

- PostgreSQL running locally
- Node.js 18+
- Backend and frontend running

## Step 1: Database Setup (1 minute)

```bash
# In backend directory
cd backend

# Run migration to create tables
node db/run-migration.js

# Seed roles and permissions
psql -U postgres -d akig < db/seeds/2025_10_rbac_seed.sql

# Verify
psql -U postgres -d akig
# \dt                    # List tables
# SELECT * FROM roles;   # Should show 5 roles
# \q                     # Quit
```

## Step 2: Backend Setup (2 minutes)

### Mount Routes

Edit `backend/src/index.js`:

```javascript
// Add these imports at the top
const contractsRoutes = require('./routes/contracts');
const tenantsRoutes = require('./routes/tenants');

// Add these after other routes (around line where other app.use() calls are)
app.use('/api/contracts', contractsRoutes);
app.use('/api/tenants', tenantsRoutes);
```

### Verify Routes

```bash
# Start backend server
npm run dev

# In another terminal, test the endpoint
curl http://localhost:4000/api/auth/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return user object with permissions array
```

## Step 3: Frontend Setup (2 minutes)

### Add User Context

Create `frontend/src/context/UserContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  user: any;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('http://localhost:4000/api/auth/permissions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be inside UserProvider');
  return context;
}
```

### Wrap App

Edit `frontend/src/main.tsx`:

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

## Step 4: Use in Components (1 minute)

### Example 1: Hide/Show Based on Permission

```typescript
import { useUser } from './context/UserContext';
import { Protected } from './components/Protected';

function MyComponent() {
  const { user } = useUser();

  return (
    <Protected user={user} perm="contracts.generate">
      <button>Generate Contract</button>
    </Protected>
  );
}
```

### Example 2: Conditional Menu

```typescript
import { can, hasRole } from './lib/rbac';

function Menu() {
  const { user } = useUser();

  return (
    <nav>
      {can(user, 'contracts.view') && (
        <a href="/contracts">Contracts</a>
      )}
      {can(user, 'payments.view') && (
        <a href="/payments">Payments</a>
      )}
      {hasRole(user, 'PDG') && (
        <a href="/admin">Admin</a>
      )}
    </nav>
  );
}
```

### Example 3: Disabled Button

```typescript
import { PermissionButton } from './components/Protected';

function ImportForm() {
  const { user } = useUser();

  return (
    <PermissionButton 
      user={user} 
      perm="payments.import"
      onClick={() => handleImport()}
    >
      Import Payments
    </PermissionButton>
  );
}
```

## Testing

### Test User Creation

```bash
# Connect to database
psql -U postgres -d akig

# Create test user
INSERT INTO users (email, password_hash, created_at)
VALUES ('test@akig.fr', 'hashed_password', NOW());

# Assign role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'test@akig.fr' AND r.code = 'COMPTA';

# Verify permissions
SELECT p.code 
FROM user_permissions up
JOIN permissions p ON up.permission_id = p.id
WHERE up.user_id = (SELECT id FROM users WHERE email = 'test@akig.fr')
ORDER BY p.code;
```

### Test Backend Endpoint

```bash
# Get JWT token (from login or create manually)
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

# Test permission check endpoint
curl http://localhost:4000/api/auth/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq .

# Should return:
# {
#   "user": {
#     "id": 1,
#     "email": "test@akig.fr",
#     "roles": ["COMPTA"],
#     "permissions": ["tenants.view", "contracts.view", ...]
#   }
# }
```

### Test Protected Route

```bash
# Try to access protected endpoint
curl -X POST http://localhost:4000/api/contracts/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "Contract for {{tenant.name}}",
    "variables": { "tenant": { "name": "John Doe" } }
  }'

# If user doesn't have 'contracts.generate' permission:
# 403 Forbidden

# If user has permission:
# 200 OK with generated contract
```

## Troubleshooting

### Issue: "Module not found" error

```bash
# Make sure Protected.tsx is in src/components/
# Make sure rbac.ts is in src/lib/

# Check imports are correct:
import { Protected } from './components/Protected';
import { can, hasRole } from './lib/rbac';
```

### Issue: User permissions always undefined

```bash
# Check token is being sent
curl http://localhost:4000/api/auth/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Should see 200 response, not 401

# If 401, token might be invalid or expired
```

### Issue: Frontend can't connect to backend

```bash
# Check CORS is enabled in Express (should be by default)
# Check backend is running on port 4000
# Check frontend API calls use correct URL

curl http://localhost:4000/api/health  # Should return OK
```

### Issue: Audit log not being created

```bash
# Check audit_log table exists
psql -U postgres -d akig -c "\dt audit_log"

# Check table has data
psql -U postgres -d akig -c "SELECT COUNT(*) FROM audit_log;"

# If empty, audit() function may have errors
# Check backend logs for errors
```

## Common Permission Codes to Use

```typescript
// Viewing
'tenants.view'
'contracts.view'
'payments.view'
'reports.view'
'audit.view'
'owners.view'
'sites.view'

// Creating/Modifying
'contracts.generate'
'payments.import'
'reminders.send'

// Admin
'ai.assist'
```

## Common Roles to Check

```typescript
// All permissions
hasRole(user, 'PDG')

// Financial
hasRole(user, 'COMPTA')

// Field operations
hasRole(user, 'AGENT')

// Tenant portal (read-only)
hasRole(user, 'LOCATAIRE')

// Owner portal
hasRole(user, 'PROPRIETAIRE')
```

## Next Steps

1. ✅ Database is set up
2. ✅ Backend routes are mounted
3. ✅ Frontend context is configured
4. ✅ Components are using permissions

### Now:
- Add more protected routes as needed
- Update existing routes to include `requirePerm()`
- Update existing components to use `<Protected>`
- Create admin panel for permission management
- Test audit logs are being created

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/rbac.ts` | Permission utilities (can, hasRole, etc.) |
| `src/components/Protected.tsx` | Permission wrapper component |
| `src/middlewares/authz.ts` | Backend auth middleware |
| `src/middlewares/scopes.ts` | Backend scope restriction |
| `src/policies/contracts.ts` | Business logic policies |
| `db/seeds/2025_10_rbac_seed.sql` | Roles and permissions data |

## Getting Help

- Check `RBAC_INTEGRATION_GUIDE.md` for detailed setup
- Check `RBAC_COMPLETE_IMPLEMENTATION.md` for architecture overview
- Look at example routes: `routes/contracts.ts`, `routes/tenants.ts`
- Check `frontend/src/lib/rbac.ts` for all available functions

---

**You're ready! Start using permissions in your app now.** 🚀

