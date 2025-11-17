// ============================================================================
// Payments Import Route (paymentsImport.ts)
// File: backend/src/routes/paymentsImport.ts
// Purpose: CSV payment import endpoint with permission checking and audit logging
// ============================================================================

import express, { Router } from 'express';
import { importPaymentsCsv } from '../import/paymentsCsvMultiYear';
import { requireAuth, requirePerm, audit } from '../middlewares/authz';

const router: Router = express.Router();

/**
 * POST /imports/payments/csv
 * Import payments from CSV file
 *
 * Required permissions:
 * - payments.import
 *
 * Request body:
 * {
 *   sourceFile: string (filename of uploaded CSV)
 *   serverPath: string (server path to CSV file)
 * }
 *
 * Audit log:
 * - Action: PAYMENT_IMPORT
 * - Target: file:{sourceFile}
 * - Meta: { path: serverPath, status, count, errors }
 *
 * @example
 * POST /imports/payments/csv
 * Authorization: Bearer {token}
 * Content-Type: application/json
 *
 * {
 *   "sourceFile": "payments_2025_10.csv",
 *   "serverPath": "/uploads/payments_2025_10.csv"
 * }
 *
 * Response (success):
 * {
 *   "ok": true,
 *   "imported": 150,
 *   "errors": 2
 * }
 *
 * Response (error):
 * {
 *   "error": "IMPORT_FAILED",
 *   "message": "Invalid CSV format"
 * }
 */
router.post(
  '/imports/payments/csv',
  requireAuth,
  requirePerm('payments.import'),
  async (req: any, res: any) => {
    const { sourceFile, serverPath } = req.body;

    // Validate input
    if (!sourceFile || !serverPath) {
      return res.status(400).json({
        error: 'MISSING_INPUT',
        message: 'sourceFile and serverPath are required',
        received: { sourceFile, serverPath }
      });
    }

    // Log audit entry
    await audit(req, 'PAYMENT_IMPORT', `file:${sourceFile}`, {
      path: serverPath,
      status: 'STARTED',
      timestamp: new Date().toISOString()
    });

    try {
      const pool = req.app.get('pool');

      if (!pool) {
        throw new Error('Database pool not available');
      }

      // Import payments from CSV
      const result: any = await importPaymentsCsv(pool, sourceFile, serverPath);

      // Log success
      await audit(req, 'PAYMENT_IMPORT', `file:${sourceFile}`, {
        path: serverPath,
        status: 'SUCCESS',
        imported: result?.imported || 0,
        errors: result?.errors || 0,
        timestamp: new Date().toISOString()
      });

      // Return success response
      res.json({
        ok: true,
        imported: result?.imported || 0,
        errors: result?.errors || 0,
        message: `Successfully imported ${result?.imported || 0} payments`
      });
    } catch (error: any) {
      // Log failure
      await audit(req, 'PAYMENT_IMPORT', `file:${sourceFile}`, {
        path: serverPath,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Return error response
      res.status(500).json({
        error: 'IMPORT_FAILED',
        message: error.message || 'Payment import failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

export default router;
