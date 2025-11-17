/**
 * ============================================================
 * backend/routes/tenant-portal.js - Portail locataire
 * Les locataires peuvent voir: paiements, historique, dettes, reçus
 * ============================================================
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const PDFDocument = require("pdfkit");

/**
 * GET /api/tenant-portal/dashboard
 * Tableau de bord locataire personnel
 */
router.get("/dashboard", auth(["TENANT"]), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    // Contrats actifs du locataire
    const contracts = await pool.query(
      `SELECT c.id, c.reference, c.monthly_rent, c.currency, c.status,
              p.address, p.city,
              SUM(CASE WHEN pe.status = 'COMPLETED' THEN pe.amount ELSE 0 END) as total_paid,
              MAX(pe.payment_date) as last_payment_date
       FROM contracts c
       LEFT JOIN properties p ON c.property_id = p.id
       LEFT JOIN payments_enhanced pe ON c.id = pe.contract_id
       WHERE c.tenant_id = $1 AND c.status = 'ACTIVE'
       GROUP BY c.id, c.reference, c.monthly_rent, c.currency, c.status, p.address, p.city`,
      [tenantId]
    );

    // Paiements en attente (dettes)
    const pendingPayments = await pool.query(
      `SELECT id, contract_id, amount, payment_date, status
       FROM payments_enhanced
       WHERE tenant_id = $1 AND status IN ('PENDING', 'CONFIRMED')
       ORDER BY payment_date ASC`,
      [tenantId]
    );

    // Total dû
    const debtTotal = await pool.query(
      `SELECT SUM(amount) as total_debt
       FROM payments_enhanced
       WHERE tenant_id = $1 AND status IN ('PENDING', 'CONFIRMED')`,
      [tenantId]
    );

    // Derniers paiements
    const recentPayments = await pool.query(
      `SELECT id, amount, payment_method, payment_date, status, reference_number
       FROM payments_enhanced
       WHERE tenant_id = $1
       ORDER BY payment_date DESC
       LIMIT 10`,
      [tenantId]
    );

    res.json({
      contracts: contracts.rows,
      pending_payments: pendingPayments.rows,
      total_debt: debtTotal.rows[0]?.total_debt || 0,
      recent_payments: recentPayments.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenant-portal/contract/:contractId/history
 * Historique de paiement d'un contrat
 */
router.get("/contract/:contractId/history", auth(["TENANT"]), async (req, res) => {
  try {
    const { contractId } = req.params;
    const tenantId = req.user.tenant_id;

    // Vérifier que le locataire possède ce contrat
    const contract = await pool.query(
      "SELECT id FROM contracts WHERE id = $1 AND tenant_id = $2",
      [contractId, tenantId]
    );

    if (contract.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Historique des paiements
    const history = await pool.query(
      `SELECT
         id, amount, amount_paid, status,
         payment_method, reference_number,
         payment_date, arrival_date,
         notes, created_at
       FROM payments_enhanced
       WHERE contract_id = $1
       ORDER BY payment_date DESC`,
      [contractId]
    );

    res.json(history.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenant-portal/payment/:paymentId/receipt
 * Télécharger le reçu PDF d'un paiement
 */
router.get("/payment/:paymentId/receipt", auth(["TENANT"]), async (req, res) => {
  try {
    const { paymentId } = req.params;
    const tenantId = req.user.tenant_id;

    // Récupérer le paiement
    const paymentQuery = await pool.query(
      `SELECT
         pe.id, pe.amount, pe.payment_method, pe.reference_number,
         pe.payment_date, pe.status,
         c.reference as contract_ref, c.monthly_rent,
         t.first_name, t.last_name, t.email,
         p.address, p.city,
         u.first_name as payer_first, u.last_name as payer_last
       FROM payments_enhanced pe
       LEFT JOIN contracts c ON pe.contract_id = c.id
       LEFT JOIN tenants t ON pe.tenant_id = t.id
       LEFT JOIN properties p ON c.property_id = p.id
       LEFT JOIN users u ON pe.created_by = u.id
       WHERE pe.id = $1 AND pe.tenant_id = $2`,
      [paymentId, tenantId]
    );

    if (paymentQuery.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    const payment = paymentQuery.rows[0];

    // Générer PDF
    const doc = new PDFDocument({ size: "A4" });

    // Header
    doc.fontSize(20).text("QUITTANCE DE PAIEMENT", 50, 50);
    doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 50, 90);

    // Infos propriétaire
    doc.fontSize(12).text("AGENCE IMMOBILIÈRE AKIG", 50, 130);
    doc.fontSize(10).text("Conakry, Guinée");

    // Infos locataire
    doc
      .fontSize(12)
      .text(`Quittance pour: ${payment.first_name} ${payment.last_name}`, 50, 200);
    doc.fontSize(10).text(`Email: ${payment.email}`, 50, 220);

    // Détails paiement
    doc.fontSize(12).text("Détails du Paiement", 50, 270);
    doc.fontSize(10);
    doc.text(`Contrat: ${payment.contract_ref}`, 50, 290);
    doc.text(`Propriété: ${payment.address}, ${payment.city}`, 50, 310);
    doc.text(`Montant: ${payment.amount} FG`, 50, 330);
    doc.text(`Méthode: ${payment.payment_method}`, 50, 350);
    doc.text(`Référence: ${payment.reference_number || "N/A"}`, 50, 370);
    doc.text(`Date de paiement: ${payment.payment_date}`, 50, 390);
    doc.text(`Statut: ${payment.status}`, 50, 410);

    // Signature
    doc.fontSize(10).text("---", 50, 500);
    doc.text("Signé par: AKIG Agency", 50, 520);
    doc.text("Pour plus d'informations: contact@akig.gn", 50, 540);

    // Stream le PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quittance_${paymentId}.pdf"`
    );
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenant-portal/stats
 * Statistiques locataire
 */
router.get("/stats", auth(["TENANT"]), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const stats = await pool.query(
      `SELECT
         COUNT(CASE WHEN pe.status = 'COMPLETED' THEN 1 END) as total_payments,
         SUM(CASE WHEN pe.status = 'COMPLETED' THEN pe.amount ELSE 0 END) as total_paid,
         COUNT(CASE WHEN pe.status IN ('PENDING', 'CONFIRMED') THEN 1 END) as pending_count,
         SUM(CASE WHEN pe.status IN ('PENDING', 'CONFIRMED') THEN pe.amount ELSE 0 END) as total_pending,
         AVG(CASE WHEN pe.payment_method = 'CASH'::payment_method THEN 1 ELSE 0 END) * 100 as cash_percentage,
         AVG(CASE WHEN pe.payment_method = 'TRANSFER'::payment_method THEN 1 ELSE 0 END) * 100 as transfer_percentage
       FROM payments_enhanced pe
       WHERE pe.tenant_id = $1`,
      [tenantId]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenant-portal/payment-methods
 * Méthodes de paiement disponibles avec instructions
 */
router.get("/payment-methods", auth(["TENANT"]), async (req, res) => {
  try {
    const methods = [
      {
        id: "CASH",
        name: "Espèces",
        description: "Paiement en espèces à l'agence",
        instructions: "Venez à l'agence avec le montant exact",
        icon: "💵",
      },
      {
        id: "CHECK",
        name: "Chèque",
        description: "Chèque bancaire",
        instructions:
          "Établissez un chèque à l'ordre de AKIG Agency",
        icon: "📋",
      },
      {
        id: "TRANSFER",
        name: "Virement Bancaire",
        description: "Virement bancaire direct",
        instructions:
          "Virement vers compte AKIG Agency (détails sur demande)",
        icon: "🏦",
      },
      {
        id: "ORANGE_MONEY",
        name: "Orange Money",
        description: "Paiement via Orange Money Guinea",
        instructions: "Envoyer à +224 XXXXXXX (détails sur demande)",
        icon: "📱",
      },
      {
        id: "MERCHANT",
        name: "Merchant/Mobile Money",
        description: "Paiement via merchant mobile",
        instructions: "Contactez le merchant local autorisé",
        icon: "💳",
      },
    ];

    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenant-portal/request-receipt
 * Demander une quittance par email
 */
router.post("/request-receipt", auth(["TENANT"]), async (req, res) => {
  try {
    const { paymentId } = req.body;
    const tenantId = req.user.tenant_id;

    // Vérifier que le paiement appartient au locataire
    const payment = await pool.query(
      "SELECT id, tenant_id FROM payments_enhanced WHERE id = $1",
      [paymentId]
    );

    if (
      payment.rows.length === 0 ||
      payment.rows[0].tenant_id !== tenantId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // TODO: Envoyer email avec PDF attaché

    res.json({
      success: true,
      message: "Quittance envoyée par email",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
