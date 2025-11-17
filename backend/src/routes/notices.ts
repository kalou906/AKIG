/**
 * Routes API REST pour le système de préavis sophistiqué
 * Endpoints: créer, modifier, envoyer, suivre, contester, calculer, clôturer
 */

import { Router, Request, Response } from 'express';
import * as pg from 'pg';
import dayjs from 'dayjs';
import NoticeAIService from '../services/NoticeAIService';
import NoticeCommService from '../services/NoticeCommService';
import { Notice, ExitAccounting, AIAlert } from '../models/types';

const router = Router();

export function createNoticeRoutes(pool: typeof pg.Pool.prototype) {
  const aiService = new NoticeAIService(pool);
  const commService = new NoticeCommService(pool);

  /**
   * POST /api/notices - Créer un nouveau préavis
   * Body: { contractId, type, motif, effectiveDate?, properties }
   */
  router.post('/notices', async (req: Request, res: Response) => {
    try {
      const { contractId, type, motif, effectiveDate, documents } = req.body;

      // Récupère le contrat et les paramètres légaux
      const contractQuery = `
        SELECT c.*, lp.* 
        FROM contracts c
        LEFT JOIN legal_parameters lp ON c.legal_parameters_id = lp.id
        WHERE c.id = $1
      `;
      const contractResult = await pool.query(contractQuery, [contractId]);
      if (contractResult.rows.length === 0) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const contract = contractResult.rows[0];

      // Valide le type de préavis
      if (!contract.allowable_notice_types?.includes(type)) {
        return res.status(400).json({
          error: 'Notice type not allowed for this contract',
          allowedTypes: contract.allowable_notice_types,
        });
      }

      // Calcule les dates légales
      let noticeEffectiveDate = effectiveDate ? new Date(effectiveDate) : undefined;
      let calculatedEffectiveDate: string | null = null;

      if (!noticeEffectiveDate && contract.notice_duration_days) {
        // Utilise la fonction PostgreSQL
        const calcQuery = `
          SELECT calculate_notice_effective_date(
            CURRENT_TIMESTAMP,
            $1,
            $2,
            $3
          ) as effective_date
        `;
        const calcResult = await pool.query(calcQuery, [
          contract.notice_duration_days,
          contract.count_business_days_only,
          contract.month_end_proration,
        ]);
        calculatedEffectiveDate = calcResult.rows[0].effective_date;
        if (calculatedEffectiveDate) {
          noticeEffectiveDate = new Date(calculatedEffectiveDate as string);
        }
      }

      // Vérifie les délais légaux
      const daysUntilEffective = dayjs(noticeEffectiveDate).diff(dayjs(), 'days');
      if (daysUntilEffective < contract.notice_duration_days) {
        return res.status(400).json({
          error: 'Notice deadline not respected',
          minimumDays: contract.notice_duration_days,
          daysProvided: daysUntilEffective,
          recommendation: 'Extend deadline or seek exception',
        });
      }

      // Insère le préavis
      const insertQuery = `
        INSERT INTO notices 
        (contract_id, type, motif, emission_date, effective_date, initiated_by, status)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6)
        RETURNING *
      `;
      const noticeResult = await pool.query(insertQuery, [
        contractId,
        type,
        motif,
        noticeEffectiveDate,
        'manager',
        'draft',
      ]);

      const notice = noticeResult.rows[0];

      // Crée le workflow associé
      await pool.query(
        `INSERT INTO notice_workflows (notice_id, current_step)
         VALUES ($1, $2)`,
        [notice.id, 0]
      );

      // Ajoute les documents s'ils existent
      if (documents && Array.isArray(documents)) {
        for (const doc of documents) {
          await pool.query(
            `INSERT INTO notice_documents 
             (notice_id, filename, mime_type, content_hash, storage_url, required_for_closure)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [notice.id, doc.filename, doc.mimeType, doc.hash, doc.url, doc.required]
          );
        }
      }

      // Enregistre l'audit
      await pool.query(
        `INSERT INTO notice_audit_log (notice_id, action, actor_id, details)
         VALUES ($1, $2, $3, $4)`,
        [notice.id, 'created', req.user?.id || 'system', JSON.stringify(req.body)]
      );

      res.status(201).json({
        success: true,
        notice,
        legalCalculation: {
          emissionDate: dayjs().format('YYYY-MM-DD'),
          effectiveDate: dayjs(noticeEffectiveDate).format('YYYY-MM-DD'),
          daysUntilEffective,
          warnings: daysUntilEffective === contract.notice_duration_days ? ['Minimum deadline respected'] : [],
        },
      });
    } catch (error) {
      console.error('Error creating notice:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/notices/:id/send - Envoie un préavis
   * Body: { channels: ['sms', 'email'], language: 'fr' }
   */
  router.post('/notices/:id/send', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { channels = ['email'], language = 'fr' } = req.body;

      // Récupère le préavis et le locataire
      const noticeQuery = `
        SELECT n.*, c.tenant_id
        FROM notices n
        JOIN contracts c ON n.contract_id = c.id
        WHERE n.id = $1
      `;
      const noticeResult = await pool.query(noticeQuery, [id]);
      if (noticeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Notice not found' });
      }

      const notice = noticeResult.rows[0];

      // Envoie via chaque canal
      const communications: any[] = [];
      for (const channel of channels) {
        try {
          const comm = await commService.sendNoticeNotification(
            id,
            notice.tenant_id,
            channel,
            language
          );
          communications.push(comm);
        } catch (error) {
          console.error(`Error sending via ${channel}:`, error);
          communications.push({
            channel,
            status: 'failed',
            error: (error as Error).message,
          });
        }
      }

      // Met à jour le statut
      await pool.query(
        `UPDATE notices 
         SET status = $1, communication_channels = $2, sent_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        ['sent', channels, id]
      );

      // Enregistre l'audit
      await pool.query(
        `INSERT INTO notice_audit_log (notice_id, action, actor_id, details)
         VALUES ($1, $2, $3, $4)`,
        [id, 'sent', req.user?.id || 'system', JSON.stringify({ channels })]
      );

      res.json({
        success: true,
        notice: { id, status: 'sent' },
        communications,
      });
    } catch (error) {
      console.error('Error sending notice:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/notices/:id - Récupère un préavis avec l'historique complet
   */
  router.get('/notices/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          n.*,
          c.monthly_rent,
          c.deposit_amount,
          t.email as tenant_email,
          t.phone as tenant_phone,
          nw.current_step,
          COUNT(sc.id) as sla_breaches
        FROM notices n
        LEFT JOIN contracts c ON n.contract_id = c.id
        LEFT JOIN tenants t ON c.tenant_id = t.id
        LEFT JOIN notice_workflows nw ON n.id = nw.notice_id
        LEFT JOIN sla_checkpoints sc ON nw.id = sc.workflow_id AND sc.status = 'breached'
        WHERE n.id = $1
        GROUP BY n.id, c.id, t.id, nw.id
      `;

      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notice not found' });
      }

      const notice = result.rows[0];

      // Récupère l'historique d'audit
      const auditQuery = `
        SELECT * FROM notice_audit_log
        WHERE notice_id = $1
        ORDER BY timestamp DESC
        LIMIT 50
      `;
      const auditResult = await pool.query(auditQuery, [id]);

      // Récupère les communications
      const commQuery = `
        SELECT * FROM communication_events
        WHERE notice_id = $1
        ORDER BY created_at DESC
      `;
      const commResult = await pool.query(commQuery, [id]);

      // Récupère les alertes
      const alertsQuery = `
        SELECT * FROM ai_alerts
        WHERE entity_id = $1
        ORDER BY created_at DESC
      `;
      const alertsResult = await pool.query(alertsQuery, [id]);

      res.json({
        notice,
        auditLog: auditResult.rows,
        communications: commResult.rows,
        alerts: alertsResult.rows,
      });
    } catch (error) {
      console.error('Error getting notice:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/notices/:id/contest - Enregistre une contestation
   */
  router.post('/notices/:id/contest', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, documents } = req.body;

      const updateQuery = `
        UPDATE notices 
        SET status = $1, 
            contested_at = CURRENT_TIMESTAMP,
            contestation_reason = $2,
            litigation_status = $3
        WHERE id = $4
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        'contested',
        reason,
        'open',
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notice not found' });
      }

      // Ajoute les documents de contestation
      if (documents && Array.isArray(documents)) {
        for (const doc of documents) {
          await pool.query(
            `INSERT INTO notice_documents 
             (notice_id, filename, mime_type, content_hash, storage_url, required_for_closure)
             VALUES ($1, $2, $3, $4, $5, true)`,
            [id, doc.filename, doc.mimeType, doc.hash, doc.url]
          );
        }
      }

      // Crée alerte pour le manager
      await aiService.createAlert({
        type: 'litigation',
        severity: 'P1',
        entityId: id,
        title: `Contestation préavis: ${id}`,
        description: `Motif: ${reason}`,
        actionRequired: 'Initier médiation',
        dueDate: dayjs().add(3, 'days').toDate(),
        reasoning: {
          rule: 'NoticeContested',
          factors: { reason },
          confidence: 100,
        },
      });

      // Enregistre l'audit
      await pool.query(
        `INSERT INTO notice_audit_log (notice_id, action, actor_id, details)
         VALUES ($1, $2, $3, $4)`,
        [id, 'contested', req.user?.id || 'system', JSON.stringify({ reason })]
      );

      res.json({
        success: true,
        notice: result.rows[0],
      });
    } catch (error) {
      console.error('Error contesting notice:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/notices/:id/calculate-balance - Calcule le solde de sortie
   */
  router.post('/notices/:id/calculate-balance', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { remainingRent, penalties, inspectionFees, worksCost, remissions } = req.body;

      // Récupère le contrat
      const noticeQuery = `
        SELECT n.contract_id, c.deposit_amount
        FROM notices n
        JOIN contracts c ON n.contract_id = c.id
        WHERE n.id = $1
      `;
      const noticeResult = await pool.query(noticeQuery, [id]);
      if (noticeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Notice not found' });
      }

      const { contract_id, deposit_amount } = noticeResult.rows[0];

      // Calcule les totaux
      const totalDebit = (remainingRent || 0) + (penalties || 0) + (inspectionFees || 0) + (worksCost || 0);
      const totalRemissions = (remissions || []).reduce((sum: number, r: any) => sum + r.amount, 0);
      const totalCredit = deposit_amount - totalRemissions;
      const balanceDue = totalDebit - totalCredit;

      // Insère l'accounting
      const insertQuery = `
        INSERT INTO exit_accounting 
        (notice_id, contract_id, remaining_rent, penalties, deposit_amount, 
         inspection_fees, works_cost, total_credit, calculated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        id,
        contract_id,
        remainingRent || 0,
        penalties || 0,
        deposit_amount,
        inspectionFees || 0,
        worksCost || 0,
        totalCredit,
      ]);

      const accounting = result.rows[0];

      // Enregistre l'audit
      await pool.query(
        `INSERT INTO notice_audit_log (notice_id, action, actor_id, details)
         VALUES ($1, $2, $3, $4)`,
        [id, 'balance_calculated', req.user?.id || 'system', JSON.stringify(accounting)]
      );

      // Crée alerte si solde impayé
      if (balanceDue > 0) {
        await aiService.createAlert({
          type: 'payment',
          severity: 'P2',
          entityId: accounting.id,
          title: `Solde dû: ${balanceDue.toFixed(2)}€`,
          description: `${balanceDue.toFixed(2)}€ à recouvrer`,
          actionRequired: 'Planifier recouvrement',
          dueDate: dayjs().add(14, 'days').toDate(),
          reasoning: {
            rule: 'PaymentDue',
            factors: { balanceDue },
            confidence: 100,
          },
        });
      }

      res.status(201).json({
        success: true,
        accounting,
        summary: {
          totalDebit,
          totalRemissions,
          totalCredit,
          balanceDue,
          requiresPaymentPlan: balanceDue > 0,
        },
      });
    } catch (error) {
      console.error('Error calculating balance:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/notices/:id/close - Clôture un préavis
   */
  router.post('/notices/:id/close', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { finalDocuments, notes } = req.body;

      // Vérifie que les documents obligatoires sont présents
      const docsQuery = `
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN required_for_closure THEN 1 ELSE 0 END) as required
        FROM notice_documents
        WHERE notice_id = $1
      `;
      const docsResult = await pool.query(docsQuery, [id]);
      const { required } = docsResult.rows[0];

      if (required > 0) {
        // Vérifie que tous les docs requis sont fournis
        const providedDocsCount = (finalDocuments || []).length;
        if (providedDocsCount < required) {
          return res.status(400).json({
            error: 'Missing required documents for closure',
            requiredCount: required,
            providedCount: providedDocsCount,
          });
        }
      }

      // Met à jour le statut
      const updateQuery = `
        UPDATE notices
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(updateQuery, ['closed', id]);

      // Enregistre l'audit
      await pool.query(
        `INSERT INTO notice_audit_log (notice_id, action, actor_id, details)
         VALUES ($1, $2, $3, $4)`,
        [id, 'closed', req.user?.id || 'system', JSON.stringify({ notes })]
      );

      res.json({
        success: true,
        notice: result.rows[0],
        message: 'Notice closed successfully',
      });
    } catch (error) {
      console.error('Error closing notice:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/notices - Liste les préavis avec filtrage et pagination
   * Query: ?status=draft&contractId=xxx&page=1&limit=20
   */
  router.get('/notices', async (req: Request, res: Response) => {
    try {
      const { status, contractId, tenantId, page = 1, limit = 20 } = req.query;

      let query = `
        SELECT n.*, c.monthly_rent, c.tenant_id, t.first_name, t.last_name
        FROM notices n
        LEFT JOIN contracts c ON n.contract_id = c.id
        LEFT JOIN tenants t ON c.tenant_id = t.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND n.status = $${paramIndex++}`;
        params.push(status);
      }
      if (contractId) {
        query += ` AND n.contract_id = $${paramIndex++}`;
        params.push(contractId);
      }
      if (tenantId) {
        query += ` AND c.tenant_id = $${paramIndex++}`;
        params.push(tenantId);
      }

      query += ` ORDER BY n.created_at DESC`;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
      const offset = (pageNum - 1) * limitNum;

      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limitNum, offset);

      const result = await pool.query(query, params);

      // Compte total
      let countQuery = `SELECT COUNT(*) as total FROM notices n WHERE 1=1`;
      if (status) countQuery += ` AND n.status = ?`;
      if (contractId) countQuery += ` AND n.contract_id = ?`;
      if (tenantId) countQuery += ` AND (SELECT tenant_id FROM contracts WHERE id = n.contract_id) = ?`;

      const countResult = await pool.query(
        countQuery.replace(/\?/g, () => `$${paramIndex++}`),
        params.slice(0, -2)
      );

      res.json({
        data: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: parseInt(countResult.rows[0]?.total || 0),
          pages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error('Error listing notices:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/alerts - Récupère les alertes filtrées
   */
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const { severity, status = 'open', type } = req.query;

      let query = `
        SELECT * FROM ai_alerts
        WHERE status = $1
      `;
      const params: any[] = [status || 'open'];

      if (severity) {
        query += ` AND severity = $${params.length + 1}`;
        params.push(severity);
      }
      if (type) {
        query += ` AND type = $${params.length + 1}`;
        params.push(type);
      }

      query += ` ORDER BY severity DESC, due_date ASC LIMIT 100`;

      const result = await pool.query(query, params);

      res.json({
        alerts: result.rows,
        summary: {
          total: result.rows.length,
          byType: result.rows.reduce((acc: any, a: any) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
          }, {}),
          bySeverity: result.rows.reduce((acc: any, a: any) => {
            acc[a.severity] = (acc[a.severity] || 0) + 1;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      console.error('Error getting alerts:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}

export default router;
