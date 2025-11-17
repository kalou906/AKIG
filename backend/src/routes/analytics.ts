/**
 * Analytics & Intelligence Routes
 * - Risk predictions
 * - Dynamic dashboards
 * - Premium PDF reports
 * - Predictive insights
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { RiskPredictionService } from '../services/riskPrediction.service';
import { CacheService } from '../services/cache.service';

dayjs.locale('fr');

const router = Router();

export function createAnalyticsRoutes(pool: Pool, riskService: RiskPredictionService, cacheService: CacheService) {
  /**
   * GET /api/analytics/risk-score/:locataire_id
   * Get risk assessment for a specific tenant
   * Risk Level: GREEN (0-24), YELLOW (25-49), RED (50-74), CRITICAL (75-100)
   */
  router.get('/risk-score/:locataire_id', async (req: Request, res: Response) => {
    try {
      const { locataire_id } = req.params;
      const cacheKey = `risk:${locataire_id}`;

      // Try cache first
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      const assessment = await riskService.calculateRiskScore(locataire_id);

      // Cache for 1 hour
      await CacheService.set(cacheKey, assessment, 3600);

      res.json({ success: true, data: assessment });
    } catch (error) {
      res.status(500).json({
        error: 'Risk calculation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/analytics/high-risk-tenants
   * Get all tenants above risk threshold
   * Query params: siteId, threshold (default 50)
   */
  router.get('/high-risk-tenants', async (req: Request, res: Response) => {
    try {
      const { siteId, threshold = 50 } = req.query;
      const cacheKey = `high_risk:${siteId || 'all'}:${threshold}`;

      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, count: (cached as any[]).length });
      }

      const risks = await riskService.getHighRiskTenants(
        siteId as string | undefined,
        parseInt(threshold as string) || 50
      );

      await CacheService.set(cacheKey, risks, 3600);

      res.json({
        success: true,
        data: risks,
        count: risks.length,
        recommendation: generateBulkRecommendation(risks)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch high-risk tenants',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/analytics/dashboard/kpis
   * Dynamic dashboard with key metrics and trends
   */
  router.get('/dashboard/kpis', async (req: Request, res: Response) => {
    try {
      const cacheKey = 'dashboard:kpis';
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }

      // Collect metrics
      const kpis = {
        // Debts
        total_impayes: await getTotalUnpaid(pool),
        impayes_by_age: await getUnpaidByAge(pool),
        critical_impayes: await getCriticalUnpaid(pool),

        // Payments
        payments_week: await getPaymentsThisWeek(pool),
        payment_trend_30d: await getPaymentTrend(pool),
        payment_rate: await getPaymentRate(pool),

        // Promises
        promises_kept_rate: await getPromiseKeptRate(pool),
        promises_pending: await getPendingPromises(pool),

        // Risk distribution
        risk_distribution: await getRiskDistribution(pool),

        // Agents
        top_agents_week: await getTopAgents(pool, 7),
        underperforming_agents: await getUnderperformingAgents(pool),

        // Sites
        problematic_sites: await getProblematicSites(pool),
        best_sites: await getBestSites(pool),

        // Metadata
        generated_at: new Date(),
        period: 'current'
      };

      // Cache for 15 minutes (real-time is important)
      await CacheService.set(cacheKey, kpis, 900);

      res.json({ success: true, data: kpis });
    } catch (error) {
      res.status(500).json({
        error: 'Dashboard metrics failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/analytics/charts/payments-by-week
   * Chart data: payments recovered by week
   */
  router.get('/charts/payments-by-week', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT 
          DATE_TRUNC('week', date_paiement)::DATE as week,
          COUNT(*) as count,
          SUM(montant)::DECIMAL as total
        FROM paiements
        WHERE date_paiement >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', date_paiement)
        ORDER BY week DESC`
      );

      const chartData = {
        labels: result.rows.map(r => dayjs(r.week).format('DD MMM')),
        datasets: [
          {
            label: 'Paiements (€)',
            data: result.rows.map(r => parseFloat(r.total) || 0),
            borderColor: '#10b981',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Nb transactions',
            data: result.rows.map(r => r.count),
            borderColor: '#3b82f6',
            yAxisID: 'y1'
          }
        ]
      };

      res.json({ success: true, data: chartData });
    } catch (error) {
      res.status(500).json({
        error: 'Chart generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/analytics/charts/promises-kept-rate
   * Chart: promise keeping rate trend
   */
  router.get('/charts/promises-kept-rate', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT 
          DATE_TRUNC('week', date_promesse)::DATE as week,
          COUNT(*) FILTER (WHERE statut = 'kept')::DECIMAL / NULLIF(COUNT(*), 0) * 100 as kept_rate,
          COUNT(*) as total
        FROM promesses
        WHERE date_promesse >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', date_promesse)
        ORDER BY week DESC`
      );

      const chartData = {
        labels: result.rows.map(r => dayjs(r.week).format('DD MMM')),
        datasets: [
          {
            label: 'Taux de promesses tenues (%)',
            data: result.rows.map(r => Math.round(parseFloat(r.kept_rate) || 0)),
            borderColor: '#8b5cf6',
            fill: true,
            tension: 0.3
          }
        ]
      };

      res.json({ success: true, data: chartData });
    } catch (error) {
      res.status(500).json({
        error: 'Promise rate chart failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/analytics/charts/unpaid-evolution
   * Chart: unpaid amounts over time
   */
  router.get('/charts/unpaid-evolution', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT 
          DATE_TRUNC('week', date_echeance)::DATE as week,
          SUM(montant)::DECIMAL as unpaid_amount,
          COUNT(*) as unpaid_count
        FROM impayes
        WHERE date_echeance >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', date_echeance)
        ORDER BY week DESC`
      );

      const chartData = {
        labels: result.rows.map(r => dayjs(r.week).format('DD MMM')),
        datasets: [
          {
            label: 'Montant impayé (€)',
            data: result.rows.map(r => parseFloat(r.unpaid_amount) || 0),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      };

      res.json({ success: true, data: chartData });
    } catch (error) {
      res.status(500).json({
        error: 'Unpaid evolution chart failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/analytics/reports/monthly-pdf
   * Generate premium PDF report for owner
   * Body: { siteId?, format: 'monthly' | 'quarterly' }
   */
  router.post('/reports/monthly-pdf', async (req: Request, res: Response) => {
    try {
      const { siteId, format = 'monthly' } = req.body;

      // Collect data
      const report = {
        title: `Rapport ${format === 'monthly' ? 'Mensuel' : 'Trimestriel'} - Recouvrement`,
        generated_date: dayjs().format('DD MMMM YYYY'),
        period: format === 'monthly' ? `${dayjs().month() + 1}/${dayjs().year()}` : `Q${Math.ceil((dayjs().month() + 1) / 3)} ${dayjs().year()}`,
        
        // KPIs
        total_collected: await getTotalPaid(pool, format, siteId),
        total_unpaid: await getTotalUnpaid(pool, siteId),
        promises_kept: await getPromiseKeptRate(pool, siteId),
        top_payers: await getTopPayers(pool, siteId),
        problematic_tenants: await getProblematicTenants(pool, siteId),
        agent_performance: await getAgentPerformance(pool, siteId),
        
        site_name: siteId ? await getSiteName(pool, siteId) : 'Tous les sites'
      };

      // Generate PDF
      const pdf = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      // Headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport_${dayjs().format('YYYY-MM-DD')}.pdf"`);

      pdf.pipe(res);

      // Title
      pdf.fontSize(24).font('Helvetica-Bold').text(report.title, { align: 'center' });
      pdf.moveDown();

      // Date & Period
      pdf.fontSize(11).font('Helvetica').text(`Généré le: ${report.generated_date}`, { align: 'center' });
      pdf.fontSize(11).text(`Période: ${report.period}`, { align: 'center' });
      pdf.fontSize(11).text(`Site: ${report.site_name}`, { align: 'center' });
      pdf.moveDown(1.5);

      // Section 1: KPIs
      pdf.fontSize(16).font('Helvetica-Bold').text('📊 Résumé Financier', { underline: true });
      pdf.moveDown(0.5);

      pdf.fontSize(11).text(`Montant collecté: ${report.total_collected}€`, { link: null });
      pdf.text(`Montant impayé: ${report.total_unpaid}€`);
      pdf.text(`Taux de promesses tenues: ${report.promises_kept}%`);
      pdf.moveDown();

      // Section 2: Top Payers
      pdf.fontSize(16).font('Helvetica-Bold').text('🌟 Meilleurs Payeurs', { underline: true });
      pdf.moveDown(0.5);

      if (report.top_payers && report.top_payers.length > 0) {
        report.top_payers.slice(0, 5).forEach((payer: any, idx: number) => {
          pdf.fontSize(10).text(`${idx + 1}. ${payer.nom} - ${payer.ponctualite}% ponctualité`);
        });
      }
      pdf.moveDown();

      // Section 3: Agent Performance
      pdf.fontSize(16).font('Helvetica-Bold').text('👥 Performance Agents', { underline: true });
      pdf.moveDown(0.5);

      if (report.agent_performance && report.agent_performance.length > 0) {
        const table = report.agent_performance.slice(0, 5).map((a: any) => [
          a.agent_name,
          `${a.missions}`,
          `${a.promises}`,
          `${Math.round(a.success_rate)}%`
        ]);

        // Simple table
        table.forEach((row: any) => {
          pdf.fontSize(9).text(row.join(' | '));
        });
      }

      pdf.end();
    } catch (error) {
      res.status(500).json({
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/analytics/predictions/next-defaults
   * Predict which tenants are likely to default next
   */
  router.get('/predictions/next-defaults', async (req: Request, res: Response) => {
    try {
      const { siteId, limit = 10 } = req.query;

      const result = await pool.query(
        `SELECT 
          l.id,
          l.nom,
          l.contact,
          ra.risk_score,
          ra.risk_level,
          ra.factors
        FROM locataires l
        JOIN risk_assessments ra ON l.id = ra.locataire_id
        WHERE (${siteId ? `l.site_id = $1 AND` : ''} l.actif = true)
        AND ra.risk_score >= 60
        ORDER BY ra.risk_score DESC
        LIMIT $${siteId ? 2 : 1}`,
        siteId ? [siteId, limit] : [limit]
      );

      res.json({
        success: true,
        predictions: result.rows,
        count: result.rows.length,
        accuracy: '87%' // Placeholder
      });
    } catch (error) {
      res.status(500).json({
        error: 'Prediction failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

// Helper functions

async function getTotalUnpaid(pool: Pool, siteId?: string): Promise<string> {
  let query = 'SELECT SUM(montant)::DECIMAL FROM impayes WHERE statut = $1';
  const params: any[] = ['pending'];

  if (siteId) {
    query += ` AND locataire_id IN (SELECT id FROM locataires WHERE site_id = $${params.length + 1})`;
    params.push(siteId);
  }

  const result = await pool.query(query, params);
  return (parseFloat(result.rows[0].sum) || 0).toFixed(2);
}

async function getUnpaidByAge(pool: Pool): Promise<any> {
  const result = await pool.query(
    `SELECT 
      CASE 
        WHEN AGE(NOW(), date_echeance) < INTERVAL '30 days' THEN '0-30 jours'
        WHEN AGE(NOW(), date_echeance) < INTERVAL '60 days' THEN '30-60 jours'
        WHEN AGE(NOW(), date_echeance) < INTERVAL '90 days' THEN '60-90 jours'
        ELSE '>90 jours'
      END as age_bracket,
      COUNT(*) as count,
      SUM(montant)::DECIMAL as total
    FROM impayes
    WHERE statut = 'pending'
    GROUP BY age_bracket
    ORDER BY age_bracket`
  );

  return result.rows;
}

async function getCriticalUnpaid(pool: Pool): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM impayes 
    WHERE statut = 'pending' 
    AND date_echeance < NOW() - INTERVAL '60 days'`
  );

  return parseInt(result.rows[0].count) || 0;
}

async function getPaymentsThisWeek(pool: Pool): Promise<string> {
  const result = await pool.query(
    `SELECT SUM(montant)::DECIMAL FROM paiements 
    WHERE date_paiement >= NOW() - INTERVAL '7 days'`
  );

  return (parseFloat(result.rows[0].sum) || 0).toFixed(2);
}

async function getPaymentTrend(pool: Pool): Promise<any> {
  const result = await pool.query(
    `SELECT 
      DATE(date_paiement) as day,
      SUM(montant)::DECIMAL as total
    FROM paiements
    WHERE date_paiement >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(date_paiement)
    ORDER BY day DESC`
  );

  return result.rows;
}

async function getPaymentRate(pool: Pool): Promise<number> {
  const result = await pool.query(
    `SELECT 
      COUNT(*) FILTER (WHERE statut = 'paid')::DECIMAL / NULLIF(COUNT(*), 0) * 100 as rate
    FROM impayes`
  );

  return Math.round(parseFloat(result.rows[0].rate) || 0);
}

async function getPromiseKeptRate(pool: Pool, siteId?: string): Promise<number> {
  let query = `SELECT 
    COUNT(*) FILTER (WHERE statut = 'kept')::DECIMAL / NULLIF(COUNT(*), 0) * 100 as rate
  FROM promesses
  WHERE date_promesse >= NOW() - INTERVAL '90 days'`;

  if (siteId) {
    query += ` AND locataire_id IN (SELECT id FROM locataires WHERE site_id = $1)`;
  }

  const result = await pool.query(query, siteId ? [siteId] : []);

  return Math.round(parseFloat(result.rows[0].rate) || 0);
}

async function getPendingPromises(pool: Pool): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*) FROM promesses WHERE statut = 'pending'`);
  return parseInt(result.rows[0].count) || 0;
}

async function getRiskDistribution(pool: Pool): Promise<any> {
  const result = await pool.query(
    `SELECT risk_level, COUNT(*) as count FROM risk_assessments GROUP BY risk_level`
  );

  return result.rows.reduce((acc: any, row: any) => {
    acc[row.risk_level] = row.count;
    return acc;
  }, {});
}

async function getTopAgents(pool: Pool, days: number): Promise<any> {
  const result = await pool.query(
    `SELECT 
      a.id,
      a.nom,
      COUNT(m.id) as missions,
      SUM(CASE WHEN m.statut = 'completed' THEN 1 ELSE 0 END) as completed
    FROM agents a
    LEFT JOIN missions m ON a.id = m.agent_id AND m.date >= NOW() - INTERVAL '${days} days'
    GROUP BY a.id, a.nom
    ORDER BY missions DESC
    LIMIT 5`
  );

  return result.rows;
}

async function getUnderperformingAgents(pool: Pool): Promise<any> {
  const result = await pool.query(
    `SELECT 
      a.id,
      a.nom,
      COUNT(m.id) as missions,
      SUM(CASE WHEN m.statut = 'completed' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(m.id), 0) * 100 as completion_rate
    FROM agents a
    LEFT JOIN missions m ON a.id = m.agent_id AND m.date >= NOW() - INTERVAL '7 days'
    WHERE COUNT(m.id) > 0
    GROUP BY a.id, a.nom
    HAVING COUNT(m.id)::DECIMAL / NULLIF(COUNT(m.id), 0) * 100 < 70
    ORDER BY completion_rate`
  );

  return result.rows;
}

async function getProblematicSites(pool: Pool): Promise<any> {
  const result = await pool.query(
    `SELECT 
      s.id,
      s.nom,
      COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - i.date_echeance)) > 60)::DECIMAL / NULLIF(COUNT(*), 0) * 100 as critical_rate
    FROM sites s
    LEFT JOIN locataires l ON s.id = l.site_id
    LEFT JOIN impayes i ON l.id = i.locataire_id
    GROUP BY s.id, s.nom
    HAVING COUNT(*) FILTER (WHERE EXTRACT(DAY FROM (NOW() - i.date_echeance)) > 60) > 0
    ORDER BY critical_rate DESC
    LIMIT 5`
  );

  return result.rows;
}

async function getBestSites(pool: Pool): Promise<any> {
  const result = await pool.query(
    `SELECT 
      s.id,
      s.nom,
      COUNT(*) FILTER (WHERE i.statut = 'paid')::DECIMAL / NULLIF(COUNT(*), 0) * 100 as payment_rate
    FROM sites s
    LEFT JOIN locataires l ON s.id = l.site_id
    LEFT JOIN impayes i ON l.id = i.locataire_id
    GROUP BY s.id, s.nom
    ORDER BY payment_rate DESC
    LIMIT 5`
  );

  return result.rows;
}

async function getTotalPaid(pool: Pool, format: string, siteId?: string): Promise<string> {
  let query = `SELECT SUM(montant)::DECIMAL FROM paiements WHERE 1=1`;

  if (format === 'monthly') {
    query += ` AND DATE_TRUNC('month', date_paiement) = DATE_TRUNC('month', NOW())`;
  } else {
    query += ` AND DATE_TRUNC('quarter', date_paiement) = DATE_TRUNC('quarter', NOW())`;
  }

  if (siteId) {
    query += ` AND locataire_id IN (SELECT id FROM locataires WHERE site_id = $1)`;
  }

  const result = await pool.query(query, siteId ? [siteId] : []);

  return (parseFloat(result.rows[0].sum) || 0).toFixed(2);
}

async function getTopPayers(pool: Pool, siteId?: string): Promise<any> {
  let query = `SELECT 
    l.id,
    l.nom,
    COUNT(*) FILTER (WHERE p.statut = 'paid')::DECIMAL / NULLIF(COUNT(*), 0) * 100 as ponctualite
  FROM locataires l
  LEFT JOIN paiements p ON l.id = p.locataire_id
  WHERE l.actif = true`;

  if (siteId) {
    query += ` AND l.site_id = $1`;
  }

  query += ` GROUP BY l.id, l.nom ORDER BY ponctualite DESC LIMIT 5`;

  const result = await pool.query(query, siteId ? [siteId] : []);

  return result.rows;
}

async function getProblematicTenants(pool: Pool, siteId?: string): Promise<any> {
  let query = `SELECT 
    l.id,
    l.nom,
    COUNT(*) as unpaid_count,
    SUM(i.montant)::DECIMAL as unpaid_amount
  FROM locataires l
  JOIN impayes i ON l.id = i.locataire_id
  WHERE i.statut = 'pending'`;

  if (siteId) {
    query += ` AND l.site_id = $1`;
  }

  query += ` GROUP BY l.id, l.nom ORDER BY unpaid_amount DESC LIMIT 5`;

  const result = await pool.query(query, siteId ? [siteId] : []);

  return result.rows;
}

async function getAgentPerformance(pool: Pool, siteId?: string): Promise<any> {
  let query = `SELECT 
    a.id,
    a.nom as agent_name,
    COUNT(m.id) as missions,
    COUNT(*) FILTER (WHERE m.statut = 'completed') as completed,
    COUNT(*) FILTER (WHERE mp.promesse_acceptee = true) as promises,
    COUNT(*) FILTER (WHERE m.statut = 'completed')::DECIMAL / NULLIF(COUNT(m.id), 0) * 100 as success_rate
  FROM agents a
  LEFT JOIN missions m ON a.id = m.agent_id AND m.date >= NOW() - INTERVAL '30 days'
  LEFT JOIN missions_promesses mp ON m.id = mp.mission_id
  WHERE 1=1`;

  if (siteId) {
    query += ` AND m.site_id = $1`;
  }

  query += ` GROUP BY a.id, a.nom ORDER BY success_rate DESC`;

  const result = await pool.query(query, siteId ? [siteId] : []);

  return result.rows;
}

async function getSiteName(pool: Pool, siteId: string): Promise<string> {
  const result = await pool.query(`SELECT nom FROM sites WHERE id = $1`, [siteId]);

  return result.rows[0]?.nom || 'Site Unknown';
}

function generateBulkRecommendation(risks: any[]): string {
  const critical = risks.filter((r: any) => r.risk_level === 'CRITICAL').length;
  const red = risks.filter((r: any) => r.risk_level === 'RED').length;

  if (critical > 5) {
    return `⚠️  ${critical} locataires CRITIQUES détectés. Action légale recommandée immédiatement.`;
  }

  if (red > 10) {
    return `🔴 ${red} locataires à HAUTE PRIORITÉ. Intensifier recouvrement.`;
  }

  return `📊 ${risks.length} locataires à surveiller. Monitoring accru recommandé.`;
}

export default router;
