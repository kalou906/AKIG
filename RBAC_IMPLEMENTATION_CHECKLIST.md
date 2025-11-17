# ✅ RBAC Implementation Checklist

## Phase 1: Database Setup (10 minutes)

- [ ] **Database Migration**
  ```bash
  cd backend
  psql -U postgres -d akig < db/migrations/011_rbac_system.sql
  ```
  - Verify 6 tables created: roles, users, user_roles, permissions, role_permissions, audit_log
  - Check indexes created for performance
  - Verify foreign key constraints

- [ ] **Seed Default Data**
  ```bash
  node db/seeders/rbac-seed.js
  ```
  - Verify 5 default roles inserted
  - Verify 40+ permissions inserted
  - Verify 5 test users created
  - Check test credentials in console output

- [ ] **Verify Database**
  ```sql
  -- Check roles
  SELECT COUNT(*) FROM roles;  -- Should be 5
  
  -- Check permissions
  SELECT COUNT(*) FROM permissions;  -- Should be 40+
  
  -- Check test users
  SELECT email, active FROM users WHERE email LIKE '%@akig.test';
  
  -- Check role assignments
  SELECT u.email, r.code FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE u.email LIKE '%@akig.test';
  ```

## Phase 2: Backend Integration (15 minutes)

- [ ] **Verify Auth Routes** in `backend/src/routes/auth.js`
  - Check GET `/api/auth/permissions` endpoint exists
  - Verify endpoint returns roles and permissions
  - Check error handling is in place

- [ ] **Test Permissions Endpoint**
  ```bash
  # Get auth token (login first)
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"compta@akig.test","password":"Compta@Akig2025"}'
  
  # Get permissions
  curl -X GET http://localhost:4000/api/auth/permissions \
    -H "Authorization: Bearer YOUR_TOKEN"
  
  # Should return:
  # { "ok": true, "roles": [...], "permissions": [...] }
  ```

- [ ] **Apply Middleware to Routes** (in route handlers)
  ```javascript
  const { requirePermission } = require('../middleware/rbac');
  
  router.post('/api/contracts/export',
    requirePermission('contracts.export'),
    contractExportHandler
  );
  ```

- [ ] **Test Protected Routes**
  ```bash
  # With permission - should work
  curl -X POST http://localhost:4000/api/contracts/export \
    -H "Authorization: Bearer COMPTA_TOKEN"
  
  # Without permission - should return 403
  curl -X POST http://localhost:4000/api/contracts/export \
    -H "Authorization: Bearer AGENT_TOKEN"
  ```

## Phase 3: Frontend Integration (10 minutes)

- [ ] **Verify Exports** in `frontend/src/index.ts`
  - Check usePermission export exists
  - Check protected components exported
  - Check types exported

- [ ] **Build Frontend**
  ```bash
  cd frontend
  npm run build
  ```
  - Should complete without errors
  - Check for TypeScript warnings
  - Bundle should include new code

- [ ] **Test Hook in Component**
  ```tsx
  import { usePermission } from '@akig/frontend';
  
  function TestComponent() {
    const { permissions, loading, error } = usePermission();
    
    return (
      <div>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {permissions && <p>{permissions.join(', ')}</p>}
      </div>
    );
  }
  ```

## Phase 4: Component Implementation (20 minutes)

- [ ] **Use IfHasPermission Component**
  ```tsx
  import { IfHasPermission } from '@akig/frontend';
  
  <IfHasPermission permission="contracts.export">
    <ExportButton />
  </IfHasPermission>
  ```
  - Button should appear for authorized users
  - Button should not appear for unauthorized users

- [ ] **Use IfHasRole Component**
  ```tsx
  import { IfHasRole } from '@akig/frontend';
  
  <IfHasRole role="PDG">
    <AdminPanel />
  </IfHasRole>
  ```

- [ ] **Use usePermission Hook**
  ```tsx
  const { hasPermission } = usePermission();
  
  if (hasPermission('contracts.delete')) {
    // Show delete button
  }
  ```

- [ ] **Use Higher-Order Component**
  ```tsx
  import { withPermission } from '@akig/frontend';
  
  export default withPermission(DeleteButton, 'contracts.delete');
  ```

## Phase 5: Testing (30 minutes)

### Login Testing
- [ ] Login as PDG
  - Email: `pdg@akig.test`
  - Password: `PDG@Akig2025`
  - Should see all features
  - Should see admin panel

- [ ] Login as COMPTA
  - Email: `compta@akig.test`
  - Password: `Compta@Akig2025`
  - Should see financial features
  - Should NOT see admin panel

- [ ] Login as AGENT
  - Email: `agent@akig.test`
  - Password: `Agent@Akig2025`
  - Should see limited features
  - Should see only field operations

- [ ] Login as LOCATAIRE
  - Email: `locataire@akig.test`
  - Password: `Locataire@Akig2025`
  - Should see read-only portal
  - Should NOT see admin or edit features

- [ ] Login as PROPRIETAIRE
  - Email: `proprietaire@akig.test`
  - Password: `Proprio@Akig2025`
  - Should see owner portal
  - Should see owned properties

### Feature Testing
- [ ] Check permissions load correctly
  ```javascript
  // In browser console
  const { permissions } = usePermission();
  console.log('Permissions:', permissions);
  ```

- [ ] Verify UI elements show/hide based on permissions
  - [ ] Export button visible for PDG/COMPTA
  - [ ] Delete button visible only for PDG
  - [ ] Import button visible for authorized users
  - [ ] Admin panel visible only for PDG

- [ ] Test API endpoints
  - [ ] Protected endpoint returns 403 for unauthorized users
  - [ ] Protected endpoint works for authorized users
  - [ ] Audit log entries are created

- [ ] Check browser network tab
  - [ ] Permission check request goes to `/api/auth/permissions`
  - [ ] Response includes roles and permissions
  - [ ] Authorization header sent correctly

## Phase 6: Custom Permissions (15 minutes)

- [ ] **Add New Permission**
  ```sql
  INSERT INTO permissions (code, resource, action, description)
  VALUES ('contracts.bulk_delete', 'contracts', 'DELETE', 'Delete multiple contracts');
  ```

- [ ] **Assign to Role**
  ```sql
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id 
  FROM roles r, permissions p
  WHERE r.code = 'PDG' 
  AND p.code = 'contracts.bulk_delete';
  ```

- [ ] **Use in Backend**
  ```javascript
  router.post('/api/contracts/bulk-delete',
    requirePermission('contracts.bulk_delete'),
    handler
  );
  ```

- [ ] **Use in Frontend**
  ```tsx
  <IfHasPermission permission="contracts.bulk_delete">
    <BulkDeleteButton />
  </IfHasPermission>
  ```

## Phase 7: Audit Logging (10 minutes)

- [ ] **Verify Audit Log Table**
  ```sql
  SELECT * FROM audit_log LIMIT 10;
  ```

- [ ] **Check Audit Entries**
  ```sql
  -- Recent actions
  SELECT action, action_type, status, created_at 
  FROM audit_log 
  ORDER BY created_at DESC 
  LIMIT 20;
  
  -- Failed authorization
  SELECT * FROM audit_log 
  WHERE status = 'DENIED' 
  ORDER BY created_at DESC;
  ```

- [ ] **Implement Audit Logging** in API handlers
  ```javascript
  const { logAudit } = require('./middleware/rbac');
  
  await logAudit({
    userId: req.user.id,
    action: 'PAYMENT_IMPORT',
    actionType: 'CREATE',
    target: 'file:payments.csv',
    status: 'SUCCESS',
    meta: { count: 100 }
  });
  ```

## Phase 8: Documentation & Training (10 minutes)

- [ ] **Read Documentation**
  - [ ] Review `RBAC_SYSTEM_GUIDE.md`
  - [ ] Review `RBAC_IMPLEMENTATION_QUICK_START.md`
  - [ ] Review `PHASE_10Q_SUMMARY.md`

- [ ] **Document Custom Changes**
  - [ ] Document any custom roles added
  - [ ] Document any custom permissions added
  - [ ] Document any custom role mappings

- [ ] **Team Training**
  - [ ] Show team how to use usePermission hook
  - [ ] Show how to use IfHasPermission component
  - [ ] Show how to protect API routes
  - [ ] Show how to view audit logs

## Phase 9: Deployment Preparation (15 minutes)

- [ ] **Environment Setup**
  ```bash
  # .env file
  DATABASE_URL=postgresql://user:pass@host:5432/akig
  JWT_SECRET=your-production-secret
  PORT=4000
  ```

- [ ] **Backup Database**
  ```bash
  pg_dump -U postgres akig > backup_before_rbac.sql
  ```

- [ ] **Test Staging Deployment**
  - [ ] Deploy to staging environment
  - [ ] Run all tests
  - [ ] Test with real users
  - [ ] Monitor audit logs

- [ ] **Production Checklist**
  - [ ] Database backups scheduled
  - [ ] Error monitoring enabled
  - [ ] Audit logs stored securely
  - [ ] Rate limiting enabled
  - [ ] HTTPS enforced
  - [ ] JWT expiration set appropriately

## Phase 10: Post-Deployment (Ongoing)

- [ ] **Monitor**
  - [ ] Check error logs daily
  - [ ] Review audit logs weekly
  - [ ] Monitor performance metrics
  - [ ] Check for security issues

- [ ] **Maintenance**
  - [ ] Update documentation as needed
  - [ ] Add new permissions as features evolve
  - [ ] Review and adjust role permissions
  - [ ] Archive old audit logs

- [ ] **Support**
  - [ ] Create FAQ document
  - [ ] Document troubleshooting steps
  - [ ] Create video tutorials
  - [ ] Provide team support

## Troubleshooting Checklist

### "Permission denied" errors

- [ ] Verify user has correct role
  ```sql
  SELECT r.code FROM roles r
  JOIN user_roles ur ON r.id = ur.role_id
  WHERE ur.user_id = USER_ID;
  ```

- [ ] Verify role has correct permission
  ```sql
  SELECT p.code FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  WHERE rp.role_id = ROLE_ID
  AND p.code = 'PERMISSION_CODE';
  ```

- [ ] Clear browser cache and reload
- [ ] Check network tab for API errors

### "Permissions not loading" in frontend

- [ ] Check browser console for errors
- [ ] Verify token is sent in Authorization header
- [ ] Check `/api/auth/permissions` endpoint responds
- [ ] Verify database has permission data

### "API routes not protected"

- [ ] Check middleware is applied to routes
- [ ] Verify requirePermission is imported correctly
- [ ] Test with curl to verify 403 responses
- [ ] Check audit logs for denied attempts

## Completion Checklist

When all phases are complete:

- [ ] Database migration applied ✓
- [ ] Default data seeded ✓
- [ ] Backend endpoints tested ✓
- [ ] Frontend hook integrated ✓
- [ ] Components working ✓
- [ ] All test users can login ✓
- [ ] Audit logging working ✓
- [ ] Documentation complete ✓
- [ ] Team trained ✓
- [ ] Deployed to production ✓

**Status:** Ready for production use ✅

