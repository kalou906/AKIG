/**
 * Service Export PDF Avancé
 * Quittances, rapports, contrats, bordereau impayés
 * backend/src/services/pdf.service.js
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const PDF_DIR = path.join(__dirname, '../../public/pdf');

// Créer dossier public/pdf s'il n'existe pas
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

const PdfService = {
  /**
   * Génère quittance de loyer PDF
   * @param {Object} quittance - Données quittance
   * @param {Object} tenant - Données locataire
   * @param {Object} property - Données propriété
   * @returns {Promise<string>} Chemin fichier PDF
   */
  async generateQuittance(quittance, tenant, property) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          bufferPages: true,
          margin: 50
        });

        const filename = `quittance-${quittance.id}-${Date.now()}.pdf`;
        const filepath = path.join(PDF_DIR, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Logo AKIG en haut à gauche
        const logoPath = path.join(__dirname, '../../public/assets/logos/logo.png');
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 50, 30, { width: 50, height: 50 });
          } catch (err) {
            logger.warn('Erreur ajout logo PDF', err);
          }
        }

        // En-tête avec logo décalé
        doc.fontSize(20).font('Helvetica-Bold').text('QUITTANCE DE LOYER', { align: 'center', y: 40 });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Date: ${new Date(quittance.dateQuittance).toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.text(`Référence: #${quittance.id}`, { align: 'right' });

        // Séparateur
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Propriété
        doc.fontSize(12).font('Helvetica-Bold').text('PROPRIÉTÉ');
        doc.fontSize(10).font('Helvetica');
        doc.text(property.nom || 'Propriété AKIG');
        doc.text(property.adresse || '');
        doc.moveDown();

        // Locataire
        doc.fontSize(12).font('Helvetica-Bold').text('LOCATAIRE');
        doc.fontSize(10).font('Helvetica');
        doc.text(tenant.nom);
        doc.text(tenant.telephone || '');
        doc.text(tenant.email || '');
        doc.moveDown();

        // Détails loyer
        doc.fontSize(11).font('Helvetica-Bold').text('DÉTAILS DU PAIEMENT');
        doc.fontSize(9).font('Helvetica');
        const table = [
          ['Élément', 'Montant (DA)'],
          ['Loyer', `${quittance.montant}€`],
          ['Charges', `${quittance.charges || 0}€`],
          ['Autres', `${quittance.autres || 0}€`],
          ['TOTAL', `${quittance.montantTotal || quittance.montant}€`]
        ];

        let y = doc.y;
        table.forEach((row, i) => {
          const isBold = i === 0 || i === table.length - 1;
          if (isBold) doc.font('Helvetica-Bold');

          doc.text(row[0], 60, y, { width: 250 });
          doc.text(row[1], 350, y, { width: 150, align: 'right' });
          y += 20;

          if (isBold) doc.font('Helvetica');
        });

        doc.moveDown();

        // Statut de paiement
        const statut = quittance.statut || 'Payé';
        const statusColor = statut === 'Payé' ? '#4caf50' : '#f44336';
        doc.fontSize(12).font('Helvetica-Bold').fillColor(statusColor).text(`✓ ${statut.toUpperCase()}`, { align: 'center' });
        doc.fillColor('black');
        doc.moveDown();

        // QR Code si montant fourni
        if (quittance.montant) {
          try {
            const qrData = `https://akig.local/verify/${quittance.id}`;
            const qrImage = await QRCode.toDataURL(qrData, {
              errorCorrectionLevel: 'M',
              type: 'image/png',
              width: 100
            });

            doc.image(Buffer.from(qrImage.split(',')[1], 'base64'), 450, 600, { width: 80 });
            doc.fontSize(8).text('Vérifier en ligne', 450, 690, { align: 'center' });
          } catch (err) {
            logger.warn('QR code génération échouée', err);
          }
        }

        // Pied de page
        doc.fontSize(8).text('Cette quittance atteste du paiement du loyer pour la période spécifiée.', { align: 'center', y: 750 });
        doc.text('Conservez-la à titre de preuve. AKIG © 2024', { align: 'center' });

        doc.end();
        
        stream.on('finish', () => {
          logger.info('Quittance PDF générée', { filename });
          resolve(filepath);
        });

        stream.on('error', reject);
      } catch (err) {
        logger.error('Erreur génération quittance', err);
        reject(err);
      }
    });
  },

  /**
   * Génère rapport impayés mensuel
   * @param {Array} impayes - List impayés
   * @param {Object} month - { year, month }
   * @returns {Promise<string>} Chemin fichier PDF
   */
  async generateArrearsReport(impayes, month = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          bufferPages: true,
          margin: 40
        });

        const { year, month: monthNum } = month;
        const now = new Date();
        const periode = year && monthNum 
          ? new Date(year, monthNum - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          : now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const filename = `rapport-impayes-${Date.now()}.pdf`;
        const filepath = path.join(PDF_DIR, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Logo AKIG en haut à gauche
        const logoPath = path.join(__dirname, '../../public/assets/logos/logo.png');
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 40, 30, { width: 45, height: 45 });
          } catch (err) {
            logger.warn('Erreur ajout logo PDF rapport', err);
          }
        }

        // En-tête avec logo décalé
        doc.fontSize(16).font('Helvetica-Bold').text('RAPPORT IMPAYÉS', { align: 'center', y: 40 });
        doc.fontSize(12).text(periode, { align: 'center' });
        doc.moveDown();

        // Statistiques
        const totalMontant = impayes.reduce((sum, i) => sum + i.montant, 0);
        const countOuvert = impayes.filter(i => i.statut === 'ouvert').length;
        const countPartiel = impayes.filter(i => i.statut === 'partiel').length;

        doc.fontSize(11).font('Helvetica-Bold').text('STATISTIQUES', 60);
        doc.fontSize(9).font('Helvetica');
        doc.text(`Total impayés: ${totalMontant}€`, 60);
        doc.text(`Dossiers ouverts: ${countOuvert}`, 60);
        doc.text(`Paiements partiels: ${countPartiel}`, 60);
        doc.moveDown();

        // Tableau impayés
        doc.fontSize(10).font('Helvetica-Bold').text('DÉTAIL DES IMPAYÉS');
        doc.moveDown(0.5);

        // En-têtes colonnes
        const headers = ['ID', 'Locataire', 'Montant', 'Période', 'Statut', 'Jours'];
        let x = 60;
        headers.forEach(h => {
          doc.fontSize(9).font('Helvetica-Bold').text(h, x, doc.y, { width: 70 });
          x += 80;
        });

        doc.y += 15;

        // Lignes impayés
        impayes.slice(0, 20).forEach(impaye => {
          const jours = Math.floor((new Date() - new Date(impaye.created_at)) / (1000 * 60 * 60 * 24));
          const color = jours > 60 ? '#d32f2f' : (jours > 30 ? '#f57c00' : '#000000');

          doc.fontSize(8).font('Helvetica').fillColor(color);
          let x = 60;
          doc.text(`#${impaye.id}`, x, doc.y, { width: 70 });
          x += 80;
          doc.text(impaye.nomTenant || '', x, doc.y - 15, { width: 70 });
          x += 80;
          doc.text(`${impaye.montant}€`, x, doc.y - 15, { width: 70 });
          x += 80;
          doc.text(impaye.periode || '', x, doc.y - 15, { width: 70 });
          x += 80;
          doc.text(impaye.statut, x, doc.y - 15, { width: 70 });
          x += 80;
          doc.text(`${jours}j`, x, doc.y - 15, { width: 70 });

          doc.fillColor('black');
          doc.y += 15;
        });

        // Pied de page
        doc.moveDown();
        doc.fontSize(8).text(`Généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          logger.info('Rapport impayés généré', { filename, count: impayes.length });
          resolve(filepath);
        });

        stream.on('error', reject);
      } catch (err) {
        logger.error('Erreur génération rapport', err);
        reject(err);
      }
    });
  },

  /**
   * Génère contrat locatif PDF
   * @param {Object} contract - Données contrat
   * @param {Object} tenant - Données locataire
   * @param {Object} property - Données propriété
   * @returns {Promise<string>} Chemin fichier PDF
   */
  async generateContract(contract, tenant, property) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          bufferPages: true,
          margin: 50
        });

        const filename = `contrat-${contract.id}-${Date.now()}.pdf`;
        const filepath = path.join(PDF_DIR, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Titre
        doc.fontSize(14).font('Helvetica-Bold').text('CONTRAT DE LOCATION', { align: 'center' });
        doc.fontSize(9).text(`Numéro: ${contract.numero}`, { align: 'center' });
        doc.moveDown();

        // Informations générales
        doc.fontSize(10).font('Helvetica-Bold').text('PARTIES AU CONTRAT');
        doc.fontSize(9).font('Helvetica');
        doc.text(`Locataire: ${tenant.nom}`);
        doc.text(`Propriété: ${property.nom || 'Propriété AKIG'}`);
        doc.moveDown();

        // Conditions
        doc.fontSize(10).font('Helvetica-Bold').text('CONDITIONS');
        doc.fontSize(9).font('Helvetica');
        doc.text(`Loyer mensuel: ${contract.montantMensuel}€`);
        doc.text(`Date début: ${new Date(contract.dateDebut).toLocaleDateString('fr-FR')}`);
        doc.text(`Durée: ${contract.duréeMois} mois`);
        doc.moveDown();

        // Signatures
        doc.fontSize(10).font('Helvetica-Bold').text('SIGNATURES');
        doc.moveDown(3);
        doc.fontSize(9).text('Locataire: _________________');
        doc.moveDown(2);
        doc.text('Propriétaire: _________________');

        doc.end();

        stream.on('finish', () => {
          logger.info('Contrat PDF généré', { filename });
          resolve(filepath);
        });

        stream.on('error', reject);
      } catch (err) {
        logger.error('Erreur génération contrat', err);
        reject(err);
      }
    });
  },

  /**
   * Génère bordereau paiements
   * @param {Array} payments - List paiements
   * @returns {Promise<string>} Chemin fichier PDF
   */
  async generatePaymentSlip(payments) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          bufferPages: true,
          margin: 40
        });

        const filename = `bordereau-paiements-${Date.now()}.pdf`;
        const filepath = path.join(PDF_DIR, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // En-tête
        doc.fontSize(14).font('Helvetica-Bold').text('BORDEREAU DE PAIEMENTS', { align: 'center' });
        doc.fontSize(9).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
        doc.moveDown();

        // Tableau
        let y = doc.y;
        const headers = ['Date', 'Locataire', 'Montant (€)', 'Méthode', 'Ref.'];
        const colWidths = [80, 150, 90, 80, 100];
        let x = 60;

        headers.forEach((h, i) => {
          doc.fontSize(9).font('Helvetica-Bold').text(h, x, y, { width: colWidths[i] });
          x += colWidths[i];
        });

        y += 20;
        let totalMontant = 0;

        payments.forEach(payment => {
          let x = 60;
          doc.fontSize(8).font('Helvetica');
          doc.text(new Date(payment.date).toLocaleDateString('fr-FR'), x, y, { width: colWidths[0] });
          x += colWidths[0];
          doc.text(payment.nomTenant, x, y - 8, { width: colWidths[1] });
          x += colWidths[1];
          doc.text(`${payment.montant}€`, x, y - 8, { width: colWidths[2] });
          totalMontant += payment.montant;
          x += colWidths[2];
          doc.text(payment.methode, x, y - 8, { width: colWidths[3] });
          x += colWidths[3];
          doc.text(payment.reference || '', x, y - 8, { width: colWidths[4] });

          y += 15;
        });

        // Total
        y += 10;
        doc.fontSize(10).font('Helvetica-Bold').text('TOTAL', 60, y);
        doc.text(`${totalMontant}€`, 350, y, { align: 'right' });

        doc.end();

        stream.on('finish', () => {
          logger.info('Bordereau paiements généré', { filename });
          resolve(filepath);
        });

        stream.on('error', reject);
      } catch (err) {
        logger.error('Erreur génération bordereau', err);
        reject(err);
      }
    });
  }
};

module.exports = PdfService;
