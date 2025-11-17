/**
 * ============================================================
 * backend/src/utils/receipt-generator.js - Générateur de Reçus
 * Génère des PDF de quittance selon la méthode de paiement
 * ============================================================
 */

const PDFDocument = require("pdfkit");
const { pool } = require("../db");

/**
 * Générer un reçu PDF complet
 */
async function generateReceipt(paymentId, res) {
  try {
    // Récupérer détails du paiement
    const paymentQuery = await pool.query(
      `SELECT
         pe.id, pe.amount, pe.amount_paid, pe.payment_method,
         pe.reference_number, pe.payment_date, pe.status,
         pe.check_number, pe.orange_money_id, pe.merchant_id,
         pe.transfer_bank, pe.bank_account,
         c.reference as contract_ref, c.monthly_rent,
         t.first_name, t.last_name, t.email, t.phone,
         p.address, p.city, p.postal_code,
         u.first_name as agent_first, u.last_name as agent_last
       FROM payments_enhanced pe
       LEFT JOIN contracts c ON pe.contract_id = c.id
       LEFT JOIN tenants t ON pe.tenant_id = t.id
       LEFT JOIN properties p ON c.property_id = p.id
       LEFT JOIN users u ON pe.created_by = u.id
       WHERE pe.id = $1`,
      [paymentId]
    );

    if (paymentQuery.rows.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = paymentQuery.rows[0];

    // Créer le document PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quittance_${payment.reference_number}.pdf"`
    );

    doc.pipe(res);

    // ========== HEADER ==========
    doc.fontSize(20).font("Helvetica-Bold").text("QUITTANCE DE PAIEMENT", {
      align: "center",
    });

    doc.fontSize(10).font("Helvetica").text("AKIG Agency - Conakry, Guinée", {
      align: "center",
    });

    doc.moveTo(50, 100).lineTo(545, 100).stroke();

    // ========== INFOS AGENCE ==========
    doc.fontSize(9).font("Helvetica").text("AGENCE IMMOBILIÈRE AKIG", 50, 120);
    doc.fontSize(8).text("📍 Conakry, Guinée");
    doc.text("📧 contact@akig.gn");
    doc.text("📱 +224 XXXXXXX");

    // ========== INFOS LOCATAIRE ==========
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Quittance pour:", 50, 180);
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(`${payment.first_name} ${payment.last_name}`);
    doc.text(`${payment.address}, ${payment.city}`);
    doc.text(`📧 ${payment.email}`);
    if (payment.phone) doc.text(`📱 ${payment.phone}`);

    // ========== DÉTAILS PAIEMENT ==========
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Détails du Paiement", 50, 260);

    const detailsY = 280;
    const detailsWidth = 245;

    // Colonne gauche
    doc.fontSize(9).font("Helvetica");
    doc.text("Contrat:", 50, detailsY);
    doc
      .font("Helvetica-Bold")
      .text(payment.contract_ref, 100, detailsY);

    doc.font("Helvetica").text("Montant:", 50, detailsY + 20);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`${payment.amount.toLocaleString()} FG`, 100, detailsY + 20);

    doc.fontSize(9).font("Helvetica").text("Loyer mensuel:", 50, detailsY + 45);
    doc
      .font("Helvetica-Bold")
      .text(`${payment.monthly_rent} FG`, 100, detailsY + 45);

    doc
      .font("Helvetica")
      .text("Référence:", 50, detailsY + 65);
    doc
      .font("Helvetica-Bold")
      .text(payment.reference_number || "N/A", 100, detailsY + 65);

    // Colonne droite
    doc
      .font("Helvetica")
      .text("Date de paiement:", 320, detailsY);
    doc
      .font("Helvetica-Bold")
      .text(formatDate(payment.payment_date), 420, detailsY);

    doc
      .font("Helvetica")
      .text("Statut:", 320, detailsY + 20);
    const statusColor = getStatusColor(payment.status);
    doc
      .fillColor(statusColor)
      .font("Helvetica-Bold")
      .text(payment.status, 420, detailsY + 20);
    doc.fillColor("black");

    doc
      .font("Helvetica")
      .text("Méthode:", 320, detailsY + 45);
    doc
      .font("Helvetica-Bold")
      .text(formatPaymentMethod(payment.payment_method), 420, detailsY + 45);

    // ========== DÉTAILS MÉTHODE DE PAIEMENT ==========
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Détails Spécifiques", 50, detailsY + 100);

    const methodY = detailsY + 120;
    doc.fontSize(9).font("Helvetica");

    if (payment.payment_method === "CHECK") {
      doc.text(`Numéro de chèque: ${payment.check_number || "N/A"}`, 50, methodY);
      doc.text("Banque: À spécifier par l'agence", 50, methodY + 20);
    } else if (payment.payment_method === "TRANSFER") {
      doc.text(`Banque: ${payment.transfer_bank || "N/A"}`, 50, methodY);
      doc.text(
        `Compte: ${payment.bank_account || "N/A"}`,
        50,
        methodY + 20
      );
    } else if (payment.payment_method === "ORANGE_MONEY") {
      doc.text(`ID Orange Money: ${payment.orange_money_id || "N/A"}`, 50, methodY);
      doc.text("Service: Orange Money Guinea", 50, methodY + 20);
    } else if (payment.payment_method === "MERCHANT") {
      doc.text(
        `ID Merchant: ${payment.merchant_id || "N/A"}`,
        50,
        methodY
      );
      doc.text("Service: Mobile Money Merchant", 50, methodY + 20);
    } else if (payment.payment_method === "CASH") {
      doc.text("Paiement en espèces à l'agence", 50, methodY);
      doc.text("Veuillez conserver cette quittance", 50, methodY + 20);
    }

    // ========== MONTANTS ==========
    doc.moveTo(50, methodY + 60).lineTo(545, methodY + 60).stroke();

    const amountsY = methodY + 80;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Montant facturé:", 350, amountsY);
    doc
      .text(
        `${payment.amount.toLocaleString()} FG`,
        450,
        amountsY,
        { align: "right" }
      );

    if (payment.amount_paid && payment.amount_paid !== payment.amount) {
      doc
        .font("Helvetica")
        .text("Montant payé:", 350, amountsY + 20);
      doc
        .text(
          `${payment.amount_paid.toLocaleString()} FG`,
          450,
          amountsY + 20,
          { align: "right" }
        );
    }

    doc.moveTo(350, amountsY + 45).lineTo(545, amountsY + 45).stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Total à payer:", 350, amountsY + 55);
    doc
      .text(
        `${payment.amount.toLocaleString()} FG`,
        450,
        amountsY + 55,
        { align: "right" }
      );

    // ========== NOTES ET CONDITIONS ==========
    const notesY = amountsY + 100;
    doc.fontSize(9).font("Helvetica-Bold").text("Conditions", 50, notesY);
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        "Cette quittance constitue la preuve de votre paiement. " +
          "Conservez-la précieusement pour votre dossier.",
        50,
        notesY + 20,
        { width: 445 }
      );

    doc.text(
      "En cas de litige ou de question, veuillez contacter l'agence AKIG " +
        "avec cette quittance.",
      50,
      notesY + 50,
      { width: 445 }
    );

    // ========== SIGNATURE ==========
    const signatureY = notesY + 100;
    doc
      .moveTo(50, signatureY)
      .lineTo(200, signatureY)
      .stroke();
    doc
      .moveTo(350, signatureY)
      .lineTo(500, signatureY)
      .stroke();

    doc
      .fontSize(9)
      .font("Helvetica")
      .text("Agent:", 50, signatureY + 10);
    if (payment.agent_first) {
      doc
        .font("Helvetica-Bold")
        .text(`${payment.agent_first} ${payment.agent_last}`, 50, signatureY + 25);
    }

    doc
      .font("Helvetica")
      .text("Locataire:", 350, signatureY + 10);
    doc
      .font("Helvetica-Bold")
      .text(
        `${payment.first_name} ${payment.last_name}`,
        350,
        signatureY + 25
      );

    // ========== FOOTER ==========
    const footerY = signatureY + 70;
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke();

    doc
      .fontSize(7)
      .font("Helvetica")
      .text(
        `Généré le: ${new Date().toLocaleString("fr-FR")}`,
        50,
        footerY + 10
      );
    doc.text(`Document ID: ${paymentId}`, 50, footerY + 20);
    doc.text(
      "© AKIG Agency 2024 - Tous droits réservés",
      50,
      footerY + 30,
      { align: "center", width: 445 }
    );

    // Finaliser le PDF
    doc.end();
  } catch (error) {
    console.error("Receipt generation error:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Générer un PDF de reçu en mémoire (blob)
 */
async function generateReceiptBuffer(paymentId) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentQuery = await pool.query(
        `SELECT
           pe.id, pe.amount, pe.amount_paid, pe.payment_method,
           pe.reference_number, pe.payment_date, pe.status,
           pe.check_number, pe.orange_money_id, pe.merchant_id,
           pe.transfer_bank, pe.bank_account,
           c.reference as contract_ref, c.monthly_rent,
           t.first_name, t.last_name, t.email, t.phone,
           p.address, p.city
         FROM payments_enhanced pe
         LEFT JOIN contracts c ON pe.contract_id = c.id
         LEFT JOIN tenants t ON pe.tenant_id = t.id
         LEFT JOIN properties p ON c.property_id = p.id
         WHERE pe.id = $1`,
        [paymentId]
      );

      if (paymentQuery.rows.length === 0) {
        throw new Error("Payment not found");
      }

      const payment = paymentQuery.rows[0];
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // (Identique au contenu ci-dessus)
      doc.fontSize(20).font("Helvetica-Bold").text("QUITTANCE DE PAIEMENT", {
        align: "center",
      });

      doc.fontSize(10).font("Helvetica").text("AKIG Agency - Conakry, Guinée", {
        align: "center",
      });

      doc.moveTo(50, 100).lineTo(545, 100).stroke();

      doc.fontSize(9).font("Helvetica").text("AGENCE IMMOBILIÈRE AKIG", 50, 120);
      doc.fontSize(8).text("contact@akig.gn | +224 XXXXXXX");

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Quittance pour:", 50, 180);
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`${payment.first_name} ${payment.last_name}`);
      doc.text(
        `${payment.address}, ${payment.city}`
      );
      doc.text(`${payment.email}`);

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Détails du Paiement", 50, 260);

      const detailsY = 280;
      doc.fontSize(9).font("Helvetica");
      doc.text("Contrat: " + payment.contract_ref, 50, detailsY);
      doc.text("Montant: " + payment.amount + " FG", 50, detailsY + 20);
      doc.text("Référence: " + (payment.reference_number || "N/A"), 50, detailsY + 40);
      doc.text("Date: " + formatDate(payment.payment_date), 50, detailsY + 60);
      doc.text("Méthode: " + formatPaymentMethod(payment.payment_method), 50, detailsY + 80);
      doc.text("Statut: " + payment.status, 50, detailsY + 100);

      doc.fontSize(8).text("Document généré automatiquement", 50, 700, {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Utilitaires
 */
function formatDate(date) {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPaymentMethod(method) {
  const methods = {
    CASH: "Espèces",
    CHECK: "Chèque",
    TRANSFER: "Virement Bancaire",
    ORANGE_MONEY: "Orange Money",
    MTN_MOBILE_MONEY: "MTN Mobile Money",
    MERCHANT: "Merchant Mobile Money",
    CREDIT_CARD: "Carte de Crédit",
    MOBILE_WALLET: "Portefeuille Mobile",
    BANK_DEPOSIT: "Dépôt Bancaire",
  };
  return methods[method] || method;
}

function getStatusColor(status) {
  const colors = {
    PENDING: "#ff9800",
    CONFIRMED: "#ff9800",
    VERIFIED: "#2196f3",
    COMPLETED: "#4caf50",
    FAILED: "#f44336",
    CANCELLED: "#9e9e9e",
    DISPUTED: "#e91e63",
  };
  return colors[status] || "#333";
}

module.exports = {
  generateReceipt,
  generateReceiptBuffer,
  formatDate,
  formatPaymentMethod,
  getStatusColor,
};
