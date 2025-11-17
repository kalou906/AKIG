/**
 * Authorization & Audit Integration Examples
 * Shows how to use the enhanced authorization middleware with audit logging
 */

const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  attachUserContext,
  rateLimitAuthAttempts,
  logAuthorizationDecisions,
  authorize,
  authorizeAny
} = require('../middleware/authorize');
const auditMiddleware = require('../middleware/audit');
const auditService = require('../services/auditService');

const router = express.Router();

// =============================================================================
// SETUP: Apply audit and authorization middleware globally
// =============================================================================

// 1. Attach request ID and audit info
router.use(auditMiddleware.auditLogMiddleware);

// 2. Parse JWT and attach user
router.use(authMiddleware);

// 3. Attach cached permissions/roles
router.use(attachUserContext);

// 4. Rate limit authorization attempts
router.use(rateLimitAuthAttempts(100, 60));

// 5. Log authorization decisions
router.use(logAuthorizationDecisions);

// =============================================================================
// EXAMPLE 1: Simple Permission Check
// =============================================================================

/**
 * GET /invoices - View invoices
 * Requires: INVOICE_VIEW permission
 * Audit: Logged automatically via middleware
 */
router.get('/invoices', requirePermission('INVOICE_VIEW'), async (req, res) => {
  try {
    // User has INVOICE_VIEW permission
    res.json({ invoices: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// EXAMPLE 2: Any of Multiple Permissions
// =============================================================================

/**
 * GET /reports - View reports
 * Requires: One of REPORT_VIEW or REPORT_EXPORT
 * Audit: Logged, permission denials logged separately
 */
router.get('/reports', 
  requireAnyPermission(['REPORT_VIEW', 'REPORT_EXPORT']),
  async (req, res) => {
    try {
      // User has at least one of the permissions
      const isExporter = req.user.hasPermission('REPORT_EXPORT');
      res.json({ reports: [], canExport: isExporter });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =============================================================================
// EXAMPLE 3: All Required Permissions
// =============================================================================

/**
 * DELETE /invoices/:id - Delete invoice
 * Requires: Both INVOICE_DELETE and INVOICE_AUDIT permissions
 * Audit: Deleted audit trail preserved
 */
router.delete('/invoices/:id',
  requireAllPermissions(['INVOICE_DELETE', 'INVOICE_AUDIT']),
  auditMiddleware.auditSensitiveOperation('invoice_deletion', 'high', true),
  async (req, res) => {
    try {
      const invoiceId = req.params.id;

      // Log the deletion with audit trail
      await auditService.logAccess({
        userId: req.user.id,
        action: 'delete',
        entityType: 'invoices',
        entityId: parseInt(invoiceId),
        description: `Deleted invoice ${invoiceId}`,
        ipAddress: req.auditInfo.ipAddress,
        userAgent: req.auditInfo.userAgent,
        requestId: req.requestId,
        status: 'success'
      });

      res.json({ success: true, deletedId: invoiceId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =============================================================================
// EXAMPLE 4: Role-Based Access
// =============================================================================

/**
 * POST /admin/users - Create user (admin only)
 * Requires: SUPER_ADMIN role
 * Audit: Permission change tracked
 */
router.post('/admin/users',
  requireRole('SUPER_ADMIN'),
  auditMiddleware.auditSensitiveOperation('user_creation', 'high'),
  async (req, res) => {
    try {
      const { email, name, role } = req.body;

      // Create user and assign role
      // ... implementation ...

      // Log the permission assignment
      await auditMiddleware.auditPermissionChange(
        req,
        newUserId,
        'role_assignment',
        [role],
        'New user created'
      );

      res.json({ success: true, userId: newUserId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =============================================================================
// EXAMPLE 5: Multiple Role Check
// =============================================================================

/**
 * GET /dashboard - Dashboard accessible by multiple roles
 * Requires: One of OWNER, AGENCY, ACCOUNTANT
 * Audit: Access logged
 */
router.get('/dashboard',
  requireAnyRole(['OWNER', 'AGENCY', 'ACCOUNTANT']),
  async (req, res) => {
    try {
      // User has one of the allowed roles
      const dashboardData = {
        userRole: req.user.roles[0],
        permissions: req.user.permissions,
        // ... more data ...
      };

      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =============================================================================
// EXAMPLE 6: Payment Processing (High-Risk)
// =============================================================================

/**
 * POST /payments - Process payment
 * Requires: PAYMENT_CREATE permission
 * Sensitive: Requires approval and audit trail
 * Audit: Sensitive operation tracked with approval workflow
 */
router.post('/payments',
  requirePermission('PAYMENT_CREATE'),
  auditMiddleware.auditSensitiveOperation('payment_creation', 'critical', true),
  async (req, res) => {
    try {
      const { amount, invoiceId, method } = req.body;

      // Operation is marked as pending approval
      // This returns 202 Accepted with operation ID
      // Admin must approve before it completes

      res.json({
        status: 'pending_approval',
        operationId: req.operationAuditId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =============================================================================
// EXAMPLE 7: Data Export (Compliance Tracked)
// =============================================================================

/**
 * GET /invoices/export - Export invoices
 * Requires: INVOICE_EXPORT permission
 * Audit: Full compliance tracking with file hash, size, etc.
 */
router.get('/invoices/export',
  requirePermission('INVOICE_EXPORT'),
  auditMiddleware.auditDataExport('invoice_export'),
  async (req, res) => {
    try {
      // Fetch invoices
      const invoices = []; // ... fetch from DB

      // Export in various formats
      const format = req.query.format || 'json';

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
        // ... send CSV data
      } else {
        res.json(invoices);
      }
      
      // Export audit logged automatically by middleware
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =============================================================================
// EXAMPLE 8: Manual Permission Check
// =============================================================================

/**
 * POST /invoices - Create invoice
 * Manual permission check for complex logic
 * Audit: Logged with context
 */
router.post('/invoices', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, tenantId } = req.body;

    // Manual permission check
    const hasPermission = await authorize(userId, 'INVOICE_CREATE', {
      ipAddress: req.auditInfo.ipAddress,
      userAgent: req.auditInfo.userAgent,
      requestId: req.requestId
    });

    if (!hasPermission) {
      // Audited via authorize() function
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to create invoices'
      });
    }

    // Create invoice
    const invoice = { /* ... */ };

    // Log the creation
    await auditService.logAccess({
      userId,
      action: 'create',
      entityType: 'invoices',
      entityId: invoice.id,
      description: `Created invoice for tenant ${tenantId}, amount: ${amount}`,
      ipAddress: req.auditInfo.ipAddress,
      userAgent: req.auditInfo.userAgent,
      requestId: req.requestId,
      status: 'success',
      newValues: invoice
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// EXAMPLE 9: Conditional Permission Based on Data
// =============================================================================

/**
 * PUT /invoices/:id - Update invoice
 * User can only update own invoices unless INVOICE_EDIT_ANY permission
 * Audit: Logs both request and data changes
 */
router.put('/invoices/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;
    const updates = req.body;

    // Fetch existing invoice
    const invoice = {}; // ... fetch from DB

    // Check: user owns invoice OR has admin permission
    const isOwner = invoice.created_by === userId;
    const canEditAny = await authorize(userId, 'INVOICE_EDIT_ANY', {
      logFailure: false // Don't log this check
    });

    if (!isOwner && !canEditAny) {
      await auditService.logAccess({
        userId,
        action: 'unauthorized_update',
        entityType: 'invoices',
        entityId: invoiceId,
        ipAddress: req.auditInfo.ipAddress,
        userAgent: req.auditInfo.userAgent,
        requestId: req.requestId,
        status: 'denied',
        errorMessage: 'Not owner and no admin permission'
      });

      return res.status(403).json({ error: 'Forbidden' });
    }

    // Apply updates
    const oldInvoice = JSON.parse(JSON.stringify(invoice));
    const updatedInvoice = { ...invoice, ...updates };

    // Calculate changed fields
    const changedFields = Object.keys(updates);

    // Log the update with before/after values
    await auditService.logAccess({
      userId,
      action: 'update',
      entityType: 'invoices',
      entityId: invoiceId,
      description: `Updated invoice ${invoiceId}`,
      ipAddress: req.auditInfo.ipAddress,
      userAgent: req.auditInfo.userAgent,
      requestId: req.requestId,
      status: 'success',
      oldValues: oldInvoice,
      newValues: updatedInvoice,
      changedFields
    });

    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// EXAMPLE 10: Using Request Context Helpers
// =============================================================================

/**
 * GET /user/profile - User profile with permission-based fields
 * Uses helper methods attached by attachUserContext middleware
 */
router.get('/user/profile', async (req, res) => {
  try {
    const profile = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      roles: req.user.roles
    };

    // Add fields based on permissions
    if (req.user.hasPermission('REPORT_VIEW')) {
      profile.reports = []; // ... fetch reports
    }

    if (req.user.hasPermission('PAYMENT_VIEW')) {
      profile.payments = []; // ... fetch payments
    }

    // Show sensitive data only to admins
    if (req.user.hasRole('SUPER_ADMIN')) {
      profile.auditTrail = []; // ... fetch audit trail
      profile.systemConfig = {}; // ... fetch config
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Catch 403 Forbidden from authorization middleware
router.use((err, req, res, next) => {
  if (err.status === 403) {
    // Already logged by middleware
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (err.status === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next(err);
});

module.exports = router;

// =============================================================================
// USAGE IN APP
// =============================================================================

/**
 * In your main app.js:
 *
 * const express = require('express');
 * const authRoutes = require('./routes/auth');
 * const invoiceRoutes = require('./routes/auth-examples');
 * 
 * const app = express();
 * 
 * app.use(express.json());
 * app.use('/api/auth', authRoutes);
 * app.use('/api', invoiceRoutes);
 * 
 * app.listen(4000, () => console.log('Server running'));
 */
