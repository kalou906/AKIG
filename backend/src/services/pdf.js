const PDFDocument = require('pdfkit');
const getStream = require('get-stream');
const { formatGNF } = require('../utils/currency');

async function generateReceiptPDF(payment) {
  // payment: { id, contract_id, paid_at, amount, method, receipt_number, tenant_name, property_name }
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fontSize(24).font('Helvetica-Bold').text('AKIG', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Reçu de Paiement', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(10);
  doc.text(`Numéro de reçu: ${payment.receipt_number || payment.id}`, { bold: true });
  doc.text(`Date: ${new Date(payment.paid_at).toLocaleDateString('fr-FR')}`);
  doc.text(`Propriété: ${payment.property_name || 'N/A'}`);
  doc.text(`Locataire: ${payment.tenant_name || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(12).font('Helvetica-Bold').text('Détails du Paiement');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Montant: ${formatGNF(payment.amount)}`);
  doc.text(`Méthode: ${payment.method || 'Cash'}`);
  doc.moveDown(2);

  doc.fontSize(9).text('Merci pour votre paiement!', { align: 'center' });
  doc.text('AKIG - Gestion Immobilière Guinée', { align: 'center' });

  doc.end();

  // return Buffer
  const buffer = await getStream.buffer(doc);
  return buffer;
}

async function generateContractPDF(contract) {
  // contract: { title, property_name, tenant_name, amount, start_date, end_date }
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fontSize(20).font('Helvetica-Bold').text('CONTRAT DE LOCATION', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('Détails du Contrat');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Titre: ${contract.title || 'N/A'}`);
  doc.text(`Propriété: ${contract.property_name || 'N/A'}`);
  doc.text(`Locataire: ${contract.tenant_name || contract.party || 'N/A'}`);
  doc.text(`Montant mensuel: ${formatGNF(contract.amount || contract.monthly_rent || 0)}`);
  doc.moveDown();

  doc.fontSize(12).font('Helvetica-Bold').text('Période');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Début: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString('fr-FR') : 'N/A'}`);
  doc.text(`Fin: ${contract.end_date ? new Date(contract.end_date).toLocaleDateString('fr-FR') : 'N/A'}`);
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('Conditions');
  doc.fontSize(10).font('Helvetica');
  doc.text('1. Le locataire s\'engage à payer le loyer à la date convenue.');
  doc.text('2. Le propriétaire s\'engage à maintenir le bien en bon état.');
  doc.text('3. Toute modification doit faire l\'objet d\'un avenant écrit.');
  doc.moveDown(3);

  doc.text('_______________________          _______________________');
  doc.text('Signature Propriétaire          Signature Locataire');

  doc.end();

  const buffer = await getStream.buffer(doc);
  return buffer;
}

module.exports = { generateReceiptPDF, generateContractPDF };
