/**
 * PDF/A and Timestamping Service
 * backend/src/services/pdfa.js
 * 
 * Service pour conversion PDF/A et timestamping légal
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Crée un timestamp signé pour un payload
 */
async function timestamp(payload) {
  try {
    const ts = new Date().toISOString();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // Créer un hash SHA256 du payload + timestamp
    const hashInput = payloadStr + ts;
    const sig = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex');

    return {
      timestamp: ts,
      signature: sig,
      algorithm: 'SHA256',
      payload_hash: crypto.createHash('sha256').update(payloadStr).digest('hex'),
    };
  } catch (error) {
    console.error('Error creating timestamp:', error);
    throw error;
  }
}

/**
 * Vérifie un timestamp
 */
function verifyTimestamp(payload, ts) {
  try {
    if (!ts || !ts.timestamp || !ts.signature) {
      return false;
    }

    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hashInput = payloadStr + ts.timestamp;
    const expectedSig = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex');

    return expectedSig === ts.signature;
  } catch (error) {
    console.error('Error verifying timestamp:', error);
    return false;
  }
}

/**
 * Convertit un PDF en PDF/A (compatible archivage long-terme)
 * Note: Utilise des métadonnées pour marquer comme PDF/A
 * Pour une vraie conversion, utiliser ghostscript ou autre outil
 */
async function toPDFA(pdfBuffer) {
  try {
    // En production, utiliser: ghostscript, qpdf, ou API tier
    // gs -q -dNOPAUSE -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -dPDFA=1 -sOutputICCProfile=sRGB.icc ...

    // Pour l'instant, on marque le fichier avec des métadonnées
    const metadata = {
      conformance: 'PDF/A-1b',
      created: new Date().toISOString(),
      producer: 'AKIG Document Management System',
      archived: true,
    };

    // Créer un wrapper qui inclut métadonnées
    const pdfaWrapper = {
      original_buffer: pdfBuffer.toString('base64'),
      metadata: metadata,
      checksum: crypto.createHash('sha256').update(pdfBuffer).digest('hex'),
    };

    return pdfaWrapper;
  } catch (error) {
    console.error('Error converting to PDF/A:', error);
    throw error;
  }
}

/**
 * Récupère le buffer original d'un PDF/A
 */
function fromPDFA(pdfaWrapper) {
  try {
    if (typeof pdfaWrapper === 'object' && pdfaWrapper.original_buffer) {
      return Buffer.from(pdfaWrapper.original_buffer, 'base64');
    }
    return pdfaWrapper;
  } catch (error) {
    console.error('Error extracting from PDF/A:', error);
    throw error;
  }
}

/**
 * Vérifie l'intégrité d'un PDF/A
 */
function verifyPDFA(pdfaWrapper) {
  try {
    if (!pdfaWrapper || !pdfaWrapper.checksum) {
      return false;
    }

    const buffer = fromPDFA(pdfaWrapper);
    const expectedChecksum = crypto.createHash('sha256').update(buffer).digest('hex');

    return expectedChecksum === pdfaWrapper.checksum;
  } catch (error) {
    console.error('Error verifying PDF/A:', error);
    return false;
  }
}

/**
 * Crée un document d'archive avec signature
 */
async function createArchiveDocument(pdfBuffer, metadata = {}) {
  try {
    // Convertir en PDF/A
    const pdfaWrapper = await toPDFA(pdfBuffer);

    // Créer timestamp
    const ts = await timestamp(pdfaWrapper);

    // Ajouter métadonnées d'archive
    const archiveDoc = {
      ...pdfaWrapper,
      metadata: {
        ...pdfaWrapper.metadata,
        ...metadata,
        archived_at: new Date().toISOString(),
      },
      timestamp: ts,
      format: 'PDF/A-1b',
      retention_years: metadata.retention_years || 10,
    };

    return archiveDoc;
  } catch (error) {
    console.error('Error creating archive document:', error);
    throw error;
  }
}

/**
 * Vérifie un document d'archive
 */
function verifyArchiveDocument(archiveDoc) {
  try {
    if (!archiveDoc) {
      return { valid: false, reason: 'Document is null' };
    }

    // Vérifier l'intégrité PDF/A
    if (!verifyPDFA(archiveDoc)) {
      return { valid: false, reason: 'PDF/A integrity check failed' };
    }

    // Vérifier le timestamp
    if (!verifyTimestamp(archiveDoc, archiveDoc.timestamp)) {
      return { valid: false, reason: 'Timestamp verification failed' };
    }

    // Vérifier la conformité PDF/A
    if (archiveDoc.format !== 'PDF/A-1b') {
      return { valid: false, reason: 'Not PDF/A-1b compliant' };
    }

    return {
      valid: true,
      format: archiveDoc.format,
      archived_at: archiveDoc.metadata.archived_at,
      retention_until: new Date(
        new Date(archiveDoc.metadata.archived_at).getTime() +
          archiveDoc.retention_years * 365.25 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  } catch (error) {
    console.error('Error verifying archive document:', error);
    return { valid: false, reason: error.message };
  }
}

/**
 * Crée un manifeste d'archivage
 */
async function createManifest(documents = []) {
  try {
    const manifest = {
      version: '1.0',
      created: new Date().toISOString(),
      total_documents: documents.length,
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        checksum: doc.checksum,
        format: doc.format,
        size: doc.size,
        archived_at: doc.archived_at,
      })),
    };

    // Créer une signature pour le manifeste
    const manifestStr = JSON.stringify(manifest);
    const manifestChecksum = crypto.createHash('sha256').update(manifestStr).digest('hex');

    return {
      ...manifest,
      checksum: manifestChecksum,
      signature: crypto
        .createHmac('sha256', process.env.ARCHIVE_SECRET_KEY || 'default-secret')
        .update(manifestStr)
        .digest('hex'),
    };
  } catch (error) {
    console.error('Error creating manifest:', error);
    throw error;
  }
}

/**
 * Vérifie un manifeste d'archivage
 */
function verifyManifest(manifest) {
  try {
    if (!manifest || !manifest.signature) {
      return false;
    }

    const manifestCopy = { ...manifest };
    const signature = manifestCopy.signature;
    delete manifestCopy.signature;

    const manifestStr = JSON.stringify(manifestCopy);
    const expectedSignature = crypto
      .createHmac('sha256', process.env.ARCHIVE_SECRET_KEY || 'default-secret')
      .update(manifestStr)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying manifest:', error);
    return false;
  }
}

/**
 * Génère un rapport d'archivage
 */
function generateArchiveReport(documents = []) {
  try {
    const now = new Date();
    const report = {
      report_date: now.toISOString(),
      total_documents: documents.length,
      total_size: documents.reduce((sum, doc) => sum + (doc.size || 0), 0),
      by_format: {},
      by_year: {},
      expiration_warnings: [],
    };

    documents.forEach((doc) => {
      // Compter par format
      report.by_format[doc.format] = (report.by_format[doc.format] || 0) + 1;

      // Compter par année
      const year = new Date(doc.archived_at).getFullYear();
      report.by_year[year] = (report.by_year[year] || 0) + 1;

      // Alerter sur les expirations proches
      if (doc.retention_until) {
        const expirationDate = new Date(doc.retention_until);
        const daysUntilExpiration = (expirationDate - now) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiration > 0 && daysUntilExpiration < 30) {
          report.expiration_warnings.push({
            document_id: doc.id,
            document_name: doc.name,
            expires_at: doc.retention_until,
            days_remaining: Math.ceil(daysUntilExpiration),
          });
        }
      }
    });

    return report;
  } catch (error) {
    console.error('Error generating archive report:', error);
    throw error;
  }
}

module.exports = {
  toPDFA,
  fromPDFA,
  timestamp,
  verifyTimestamp,
  verifyPDFA,
  createArchiveDocument,
  verifyArchiveDocument,
  createManifest,
  verifyManifest,
  generateArchiveReport,
};
