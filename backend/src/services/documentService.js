// Squelette service de documents (DOCX/PDF)

class DocumentService {
  async generateRefLocataire(locataire) {
    // TODO: Utiliser docxtemplater/docx pour remplir REF_LOCATAIRE_VIERGE.docx
    // Retourner buffer ou chemin fichier
    return null;
  }

  async generateContrat(contrat) {
    // TODO: Remplir CONTRAT_AKIG_ORIGINALE.docx d’après les champs de contrat
    return null;
  }

  async generateEDLPDF(edlId) {
    // TODO: Génération PDF via pdfkit avec détails EDL
    return null;
  }
}

module.exports = new DocumentService();
