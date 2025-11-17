/**
 * ============================================================
 * backend/src/routes/accounting-genius.js - Module Comptabilité
 * Suivi complet de tous les paiements, audit trail, réconciliation
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { auth } = require("../middleware/auth");

/**
 * GET /api/accounting/dashboard
 * Vue d'ensemble comptable pour les agents/managers
 */
router.get("/dashboard", auth(["AGENT", "MANAGER", "ADMIN"]), async (req, res) => {
  try {
    // Résumé des paiements
    const summary = await pool.query(
      `SELECT
         COUNT(*) as total_payments,
         SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as total_collected,
         SUM(CASE WHEN status IN ('PENDING', 'CONFIRMED') THEN amount ELSE 0 END) as total_pending,
         SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END) as total_failed,
         COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
         COUNT(CASE WHEN status IN ('PENDING', 'CONFIRMED') THEN 1 END) as pending_count,
         COUNT(CASE WHEN status = 'DISPUTED' THEN 1 END) as disputed_count
       FROM payments_enhanced`
    );

    // Paiements par méthode
    const byMethod = await pool.query(
      `SELECT
         payment_method,
         COUNT(*) as count,
         SUM(amount) as total,
         COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
       FROM payments_enhanced
       WHERE deleted_at IS NULL
       GROUP BY payment_method
       ORDER BY total DESC`
    );

    // Paiements par statut
    const byStatus = await pool.query(
      `SELECT
         status,
         COUNT(*) as count,
         SUM(amount) as total,
         AVG(amount) as average
       FROM payments_enhanced
       WHERE deleted_at IS NULL
       GROUP BY status`
    );

    // Top 10 locataires par montants collectés
    const topTenants = await pool.query(
      `SELECT
         t.id, t.first_name, t.last_name, t.email,
         COUNT(pe.id) as payment_count,
         SUM(CASE WHEN pe.status = 'COMPLETED' THEN pe.amount ELSE 0 END) as total_paid
       FROM tenants t
       LEFT JOIN payments_enhanced pe ON t.id = pe.tenant_id
       WHERE pe.deleted_at IS NULL
       GROUP BY t.id, t.first_name, t.last_name, t.email
       ORDER BY total_paid DESC
       LIMIT 10`
    );

    res.json({
      summary: summary.rows[0],
      by_method: byMethod.rows,
      by_status: byStatus.rows,
      top_tenants: topTenants.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/accounting/user-history
 * Historique complet des paiements d'un utilisateur
 */
router.get(
  "/user-history",
  auth(["AGENT", "MANAGER", "ADMIN", "TENANT"]),
  async (req, res) => {
    try {
      const { user_id, tenant_id, limit = 100, offset = 0 } = req.query;
      const queryTenantId = tenant_id || req.user.tenant_id;

      // Vérification d'accès (TENANT ne peut voir que ses propres données)
      if (req.user.role === "TENANT" && req.user.tenant_id !== queryTenantId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const history = await pool.query(
        `SELECT
           pe.id, pe.contract_id, pe.amount, pe.amount_paid,
           pe.payment_method, pe.status, pe.reference_number,
           pe.payment_date, pe.arrival_date,
           pe.check_number, pe.orange_money_id, pe.merchant_id,
           pe.transfer_bank,
           pe.created_by, pe.verified_by, pe.created_at, pe.updated_at,
           c.reference as contract_ref,
           u_creator.first_name as created_by_name,
           u_verifier.first_name as verified_by_name,
           COUNT(*) OVER() as total_count
         FROM payments_enhanced pe
         LEFT JOIN contracts c ON pe.contract_id = c.id
         LEFT JOIN users u_creator ON pe.created_by = u_creator.id
         LEFT JOIN users u_verifier ON pe.verified_by = u_verifier.id
         WHERE pe.tenant_id = $1 AND pe.deleted_at IS NULL
         ORDER BY pe.payment_date DESC
         LIMIT $2 OFFSET $3`,
        [queryTenantId, limit, offset]
      );

      const totalCount = history.rows[0]?.total_count || 0;

      res.json({
        data: history.rows.map((row) => {
          const { total_count, ...payment } = row;
          return payment;
        }),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/accounting/audit-trail
 * Piste d'audit complète (qui a fait quoi, quand)
 */
router.get(
  "/audit-trail",
  auth(["MANAGER", "ADMIN"]),
  async (req, res) => {
    try {
      const {
        action,
        user_id,
        payment_id,
        days = 30,
        limit = 200,
        offset = 0,
      } = req.query;

      let query = `
        SELECT
          ae.id, ae.action, ae.entity_type, ae.entity_id,
          ae.old_values, ae.new_values,
          ae.user_id, ae.ip_address, ae.user_agent,
          ae.created_at,
          u.first_name, u.last_name, u.email
        FROM audit_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      `;

      const params = [];

      if (action) {
        query += ` AND ae.action = $${params.length + 1}`;
        params.push(action);
      }

      if (user_id) {
        query += ` AND ae.user_id = $${params.length + 1}`;
        params.push(user_id);
      }

      if (payment_id) {
        query += ` AND ae.entity_type = 'payment' AND ae.entity_id = $${
          params.length + 1
        }`;
        params.push(payment_id);
      }

      query += ` ORDER BY ae.created_at DESC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      res.json({
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/accounting/reconciliation
 * Réconciliation bancaire
 */
router.get(
  "/reconciliation",
  auth(["MANAGER", "ADMIN"]),
  async (req, res) => {
    try {
      const { month, year } = req.query;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Paiements du mois
      const payments = await pool.query(
        `SELECT
           pr.id, pr.payment_id, pr.reference_number,
           pr.bank_reference, pr.reconciled_amount,
           pr.reconciliation_date, pr.status,
           pe.amount, pe.payment_method,
           CASE
             WHEN pr.reconciled_amount = pe.amount THEN 'OK'
             WHEN pr.reconciled_amount > pe.amount THEN 'OVER'
             WHEN pr.reconciled_amount < pe.amount THEN 'UNDER'
             ELSE 'MISSING'
           END as reconciliation_status
         FROM payment_reconciliation pr
         LEFT JOIN payments_enhanced pe ON pr.payment_id = pe.id
         WHERE pe.payment_date >= $1 AND pe.payment_date <= $2
         ORDER BY pe.payment_date DESC`,
        [startDate, endDate]
      );

      // Résumé réconciliation
      const summary = await pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'RECONCILED' THEN 1 END) as reconciled,
           COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
           SUM(CASE WHEN status = 'RECONCILED' THEN reconciled_amount ELSE 0 END) as total_reconciled,
           COUNT(CASE WHEN reconciled_amount != payment_amount THEN 1 END) as discrepancies
         FROM payment_reconciliation pr
         LEFT JOIN payments_enhanced pe ON pr.payment_id = pe.id
         WHERE pe.payment_date >= $1 AND pe.payment_date <= $2`,
        [startDate, endDate]
      );

      res.json({
        period: { month, year },
        payments: payments.rows,
        summary: summary.rows[0],
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/accounting/discrepancies
 * Paiements avec anomalies
 */
router.get(
  "/discrepancies",
  auth(["MANAGER", "ADMIN"]),
  async (req, res) => {
    try {
      const discrepancies = await pool.query(
        `SELECT
           pe.id, pe.reference_number, pe.amount, pe.status,
           pe.payment_method, pe.payment_date,
           pr.reconciled_amount, pr.bank_reference,
           ABS(pe.amount - COALESCE(pr.reconciled_amount, 0)) as difference,
           CASE
             WHEN pr.reconciled_amount IS NULL THEN 'NOT_RECONCILED'
             WHEN pe.amount > pr.reconciled_amount THEN 'UNDER_PAYMENT'
             WHEN pe.amount < pr.reconciled_amount THEN 'OVER_PAYMENT'
           END as discrepancy_type
         FROM payments_enhanced pe
         LEFT JOIN payment_reconciliation pr ON pe.id = pr.payment_id
         WHERE pe.deleted_at IS NULL
           AND (
             pr.reconciled_amount IS NULL
             OR ABS(pe.amount - pr.reconciled_amount) > 0
             OR pe.status = 'DISPUTED'
           )
         ORDER BY pe.payment_date DESC`
      );

      res.json({
        count: discrepancies.rows.length,
        discrepancies: discrepancies.rows,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/accounting/payment/:paymentId
 * Détails complets d'un paiement avec audit trail
 */
router.get(
  "/payment/:paymentId",
  auth(["AGENT", "MANAGER", "ADMIN"]),
  async (req, res) => {
    try {
      const { paymentId } = req.params;

      // Détails du paiement
      const payment = await pool.query(
        `SELECT
           pe.*, 
           c.reference as contract_ref,
           t.first_name, t.last_name,
           u_creator.email as created_by_email,
           u_verifier.email as verified_by_email
         FROM payments_enhanced pe
         LEFT JOIN contracts c ON pe.contract_id = c.id
         LEFT JOIN tenants t ON pe.tenant_id = t.id
         LEFT JOIN users u_creator ON pe.created_by = u_creator.id
         LEFT JOIN users u_verifier ON pe.verified_by = u_verifier.id
         WHERE pe.id = $1`,
        [paymentId]
      );

      if (payment.rows.length === 0) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Confirmations
      const confirmations = await pool.query(
        `SELECT * FROM payment_confirmations WHERE payment_id = $1 ORDER BY confirmed_at DESC`,
        [paymentId]
      );

      // Réconciliation
      const reconciliation = await pool.query(
        `SELECT * FROM payment_reconciliation WHERE payment_id = $1`,
        [paymentId]
      );

      // Audit trail du paiement
      const auditTrail = await pool.query(
        `SELECT ae.* FROM audit_events ae
         WHERE ae.entity_type = 'payment' AND ae.entity_id = $1
         ORDER BY ae.created_at ASC`,
        [paymentId]
      );

      res.json({
        payment: payment.rows[0],
        confirmations: confirmations.rows,
        reconciliation: reconciliation.rows[0] || null,
        audit_trail: auditTrail.rows,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/accounting/export/csv
 * Exporter données comptables en CSV
 */
router.get(
  "/export/csv",
  auth(["MANAGER", "ADMIN"]),
  async (req, res) => {
    try {
      const { month, year } = req.query;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const payments = await pool.query(
        `SELECT
           pe.reference_number, pe.amount, pe.payment_method, pe.status,
           pe.payment_date, c.reference as contract,
           t.first_name || ' ' || t.last_name as tenant_name
         FROM payments_enhanced pe
         LEFT JOIN contracts c ON pe.contract_id = c.id
         LEFT JOIN tenants t ON pe.tenant_id = t.id
         WHERE pe.payment_date >= $1 AND pe.payment_date <= $2
         ORDER BY pe.payment_date DESC`,
        [startDate, endDate]
      );

      // Générer CSV
      const headers = [
        "Reference",
        "Montant",
        "Méthode",
        "Statut",
        "Date",
        "Contrat",
        "Locataire",
      ];
      let csv = headers.join(",") + "\n";

      payments.rows.forEach((row) => {
        csv += [
          row.reference_number,
          row.amount,
          row.payment_method,
          row.status,
          row.payment_date,
          row.contract,
          row.tenant_name,
        ]
          .map((v) => `"${v || ""}"`)
          .join(",");
        csv += "\n";
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="accounting_${month}_${year}.csv"`
      );
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
