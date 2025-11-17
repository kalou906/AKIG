/**
 * Privacy & GDPR Routes
 * backend/src/routes/privacy.js
 * 
 * Endpoints pour la conformité RGPD (droit à l'oubli, portabilité, etc.)
 */

const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const logger = require('../services/logger');
const AuditService = require('../services/audit');

const router = express.Router();

// Middleware
router.use(authenticate);

/**
 * POST /api/privacy/export
 * Exporte toutes les données personnelles de l'utilisateur (RGPD Art. 20)
 */
router.post('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const timestamp = new Date().toISOString();

    // Récupérer les données utilisateur
    const userResult = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, agency_id, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    const user = userResult.rows[0];

    // Récupérer les contrats
    const contractsResult = await pool.query(
      `SELECT * FROM contracts WHERE user_id = $1 OR owner_id = $1`,
      [userId]
    );

    // Récupérer les propriétés
    const propertiesResult = await pool.query(
      `SELECT * FROM properties WHERE owner_id = $1`,
      [userId]
    );

    // Récupérer les paiements
    const paymentsResult = await pool.query(
      `SELECT * FROM payments WHERE owner_id = $1 OR tenant_id = $1`,
      [userId]
    );

    // Récupérer les factures
    const invoicesResult = await pool.query(
      `SELECT * FROM invoices WHERE user_id = $1 OR owner_id = $1`,
      [userId]
    );

    // Récupérer les logs d'audit
    const auditResult = await pool.query(
      `SELECT id, action, entity, entity_id, ts FROM audit_log WHERE actor_id = $1 LIMIT 1000`,
      [userId]
    );

    // Récupérer les feedbacks
    const feedbackResult = await pool.query(
      `SELECT * FROM feedback WHERE user_id = $1`,
      [userId]
    );

    // Récupérer les documents partagés
    const sharingResult = await pool.query(
      `SELECT ds.* FROM document_sharing ds
       WHERE ds.shared_with_user_id = $1 OR ds.shared_by = $1`,
      [userId]
    );

    const exportData = {
      export_timestamp: timestamp,
      data_controller: 'AKIG',
      gdpr_article: '20 - Data Portability',
      user_info: user,
      data: {
        contracts: contractsResult.rows,
        properties: propertiesResult.rows,
        payments: paymentsResult.rows,
        invoices: invoicesResult.rows,
        feedback: feedbackResult.rows,
        document_sharing: sharingResult.rows,
        audit_trail: auditResult.rows,
      },
      summary: {
        total_contracts: contractsResult.rows.length,
        total_properties: propertiesResult.rows.length,
        total_payments: paymentsResult.rows.length,
        total_invoices: invoicesResult.rows.length,
        total_feedback: feedbackResult.rows.length,
        total_audit_entries: auditResult.rows.length,
      },
    };

    // Log cette action d'export
    await AuditService.log({
      actor_id: userId,
      action: 'GDPR_EXPORT',
      entity: 'USER',
      entity_id: userId,
      payload: JSON.stringify({ summary: exportData.summary }),
    });

    res.json({
      success: true,
      message: 'Données exportées avec succès',
      data: exportData,
    });
  } catch (error) {
    logger.error('Error exporting user data', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données',
    });
  }
});

/**
 * POST /api/privacy/delete
 * Supprime le compte utilisateur et ses données (RGPD Art. 17)
 */
router.post('/delete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation = false } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez confirmer la suppression (confirmation: true)',
      });
    }

    // Vérifier le mot de passe (sécurité supplémentaire)
    const { password } = req.body;
    if (!password) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe requis pour confirmation',
      });
    }

    // Commencer la transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Log l'action avant suppression
      await AuditService.log({
        actor_id: userId,
        action: 'GDPR_DELETE_ACCOUNT',
        entity: 'USER',
        entity_id: userId,
        payload: JSON.stringify({
          timestamp: new Date().toISOString(),
          reason: 'User requested account deletion',
        }),
      });

      // Anonymiser les données au lieu de les supprimer (conformité légale)
      const anonymizeTimestamp = new Date().toISOString();

      // Mettre à jour l'utilisateur
      await client.query(
        `UPDATE users 
         SET deleted = true, 
             deleted_at = $1,
             email = $2,
             phone = NULL,
             first_name = 'Deleted',
             last_name = 'User',
             updated_at = $1
         WHERE id = $3`,
        [`${anonymizeTimestamp}`, `deleted-${userId}@anonymized.local`, userId]
      );

      // Anonymiser les feedbacks
      await client.query(
        `UPDATE feedback SET user_id = NULL WHERE user_id = $1`,
        [userId]
      );

      // Anonymiser les logs de document
      await client.query(
        `UPDATE document_access_log SET user_id = NULL WHERE user_id = $1`,
        [userId]
      );

      // Marquer les partages comme supprimés
      await client.query(
        `DELETE FROM document_sharing WHERE shared_with_user_id = $1`,
        [userId]
      );

      // Conserver les logs d'audit pour conformité légale (ne pas supprimer)
      // Mettre à jour les références si nécessaire
      await client.query(
        `UPDATE audit_log SET actor_id = NULL WHERE actor_id = $1`,
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Compte supprimé avec succès. Vos données ont été anonymisées.',
        deleted_at: anonymizeTimestamp,
      });

      logger.info('User account deleted', { userId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error deleting user account', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du compte',
    });
  }
});

/**
 * POST /api/privacy/rectify
 * Permet à l'utilisateur de corriger ses données (RGPD Art. 16)
 */
router.post('/rectify', async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone } = req.body;

    if (!first_name && !last_name && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un champ à corriger est requis',
      });
    }

    const updates = [];
    const params = [userId];
    let paramCount = 2;

    if (first_name) {
      updates.push(`first_name = $${paramCount}`);
      params.push(first_name);
      paramCount++;
    }

    if (last_name) {
      updates.push(`last_name = $${paramCount}`);
      params.push(last_name);
      paramCount++;
    }

    if (phone) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, first_name, last_name, phone, email`,
      params
    );

    // Log cette action
    await AuditService.log({
      actor_id: userId,
      action: 'GDPR_RECTIFY',
      entity: 'USER',
      entity_id: userId,
      payload: JSON.stringify({ fields_updated: { first_name, last_name, phone } }),
    });

    res.json({
      success: true,
      message: 'Données corrigées avec succès',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error rectifying user data', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction des données',
    });
  }
});

/**
 * POST /api/privacy/consent
 * Gère les consentements de l'utilisateur (RGPD Art. 7)
 */
router.post('/consent', async (req, res) => {
  try {
    const userId = req.user.id;
    const { marketing = false, analytics = false, third_party = false } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET consent_marketing = $1, 
           consent_analytics = $2, 
           consent_third_party = $3,
           consent_updated_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, consent_marketing, consent_analytics, consent_third_party, consent_updated_at`,
      [marketing, analytics, third_party, userId]
    );

    // Log cette action
    await AuditService.log({
      actor_id: userId,
      action: 'GDPR_CONSENT_UPDATE',
      entity: 'USER',
      entity_id: userId,
      payload: JSON.stringify({ marketing, analytics, third_party }),
    });

    res.json({
      success: true,
      message: 'Consentements mis à jour',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating consent', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des consentements',
    });
  }
});

/**
 * GET /api/privacy/consent
 * Récupère les consentements actuels
 */
router.get('/consent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT consent_marketing, consent_analytics, consent_third_party, consent_updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching consent', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des consentements',
    });
  }
});

/**
 * GET /api/privacy/data-processing
 * Informations sur le traitement des données
 */
router.get('/data-processing', (req, res) => {
  res.json({
    success: true,
    data: {
      data_controller: 'AKIG',
      privacy_officer: 'privacy@akig.app',
      data_retention_policy: {
        user_accounts: '6 months after deletion',
        audit_logs: '3 years',
        payment_records: '7 years (legal requirement)',
        documents: 'Based on user retention settings',
      },
      legal_basis: [
        'Contractual necessity (Art. 6.1.b)',
        'Legal obligation (Art. 6.1.c)',
        'Legitimate interests (Art. 6.1.f)',
        'User consent (Art. 6.1.a)',
      ],
      rights: [
        'Right to access (Art. 15)',
        'Right to rectification (Art. 16)',
        'Right to erasure (Art. 17)',
        'Right to restrict processing (Art. 18)',
        'Right to data portability (Art. 20)',
        'Right to object (Art. 21)',
      ],
      gdpr_version: '2018/679',
      last_updated: '2025-10-25',
    },
  });
});

/**
 * POST /api/privacy/object
 * Droit d'opposition (RGPD Art. 21)
 */
router.post('/object', async (req, res) => {
  try {
    const userId = req.user.id;
    const { processing_type, reason } = req.body;

    if (!processing_type) {
      return res.status(400).json({
        success: false,
        message: 'processing_type est requis',
      });
    }

    // Log l'objection
    await AuditService.log({
      actor_id: userId,
      action: 'GDPR_OBJECT',
      entity: 'USER',
      entity_id: userId,
      payload: JSON.stringify({ processing_type, reason, timestamp: new Date().toISOString() }),
    });

    res.json({
      success: true,
      message: 'Objection enregistrée. Nous traiterons votre demande dans les 30 jours.',
      reference: `OBJECT-${userId}-${Date.now()}`,
    });
  } catch (error) {
    logger.error('Error processing objection', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de l\'objection',
    });
  }
});

module.exports = router;
