/**
 * Example: Using RBAC in Express Routes
 * Shows how to protect endpoints with roles and permissions
 */

const express = require('express');
const router = express.Router();
const { 
  requirePermission, 
  requireRole, 
  requireAnyPermission,
  assignRoleToUser,
  removeRoleFromUser 
} = require('../middleware/rbac');

// Protect endpoint with single permission
router.get(
  '/invoices',
  requirePermission('INVOICE_VIEW'),
  async (req, res) => {
    try {
      // User has INVOICE_VIEW permission
      const pool = require('../db');
      const invoices = await pool.query('SELECT * FROM invoices');
      res.json(invoices.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Protect endpoint requiring specific role
router.post(
  '/admin/users',
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    try {
      // Only SUPER_ADMIN can create users
      res.json({ message: 'User creation endpoint' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Protect endpoint with multiple permissions (ANY)
router.get(
  '/reports',
  requireAnyPermission(['REPORT_VIEW', 'REPORT_EXPORT']),
  async (req, res) => {
    try {
      // User needs at least one of these permissions
      res.json({ message: 'Reports' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// User management endpoints
router.post('/admin/users/:userId/roles/:roleName', async (req, res) => {
  try {
    // Check if requester is admin
    const rbac = require('../middleware/rbac');
    const hasAccess = await rbac.requireRole('SUPER_ADMIN');
    
    const { userId, roleName } = req.params;
    const result = await assignRoleToUser(userId, roleName, req.user.id);
    
    res.json({
      message: `Role ${roleName} assigned to user ${userId}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/users/:userId/roles/:roleName', async (req, res) => {
  try {
    const rbac = require('../middleware/rbac');
    
    const { userId, roleName } = req.params;
    const result = await removeRoleFromUser(userId, roleName);
    
    res.json({
      message: `Role ${roleName} removed from user ${userId}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected invoice creation endpoint
router.post(
  '/invoices',
  requirePermission('INVOICE_CREATE'),
  async (req, res) => {
    try {
      const pool = require('../db');
      const { tenant_id, amount, due_date } = req.body;
      
      const result = await pool.query(
        `INSERT INTO invoices (tenant_id, amount, due_date, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [tenant_id, amount, due_date, req.user.id]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Protected payment processing endpoint
router.post(
  '/payments',
  requirePermission('PAYMENT_PROCESS'),
  async (req, res) => {
    try {
      const pool = require('../db');
      const { invoice_id, amount, method } = req.body;
      
      const result = await pool.query(
        `INSERT INTO payments (invoice_id, amount, method, processed_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [invoice_id, amount, method, req.user.id]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Export endpoint
router.get(
  '/invoices/export',
  requirePermission('INVOICE_EXPORT'),
  async (req, res) => {
    try {
      // Generate CSV or PDF export
      res.json({ message: 'Export initiated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
