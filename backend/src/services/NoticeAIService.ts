/**
 * Service IA pour détection proactive, scoring et alertes du système de préavis
 * Fonctionnalités: Intention de départ, SLA, anomalies, priorisation tâches
 */

import { Pool } from 'pg';
import dayjs from 'dayjs';
import { 
  DepartureRiskAssessment, 
  AIAlert, 
  AIRiskSignal,
  Tenant,
  Contract,
  Notice
} from '../models/types';

export class NoticeAIService {
  constructor(private pool: Pool) {}

  /**
   * Calcule le score de risque de départ d'un locataire
   * Score 0-100: <30 = faible, 30-70 = moyen, >70 = à risque
   */
  async assessDepartureRisk(tenantId: string): Promise<DepartureRiskAssessment> {
    const signals: AIRiskSignal[] = [];
    let riskScore = 0;

    try {
      // Signal 1: Retards de paiement récurrents
      const paymentDelaysQuery = `
        SELECT 
          COUNT(*) as delay_count,
          AVG(EXTRACT(DAY FROM (payment_date - due_date))::INT) as avg_days_late
        FROM payments
        WHERE tenant_id = $1
          AND payment_date > due_date
          AND payment_date >= CURRENT_DATE - INTERVAL '6 months'
      `;
      const paymentDelays = await this.pool.query(paymentDelaysQuery, [tenantId]);
      const delayCount = parseInt(paymentDelays.rows[0]?.delay_count || 0);
      const avgDaysLate = parseInt(paymentDelays.rows[0]?.avg_days_late || 0);

      if (delayCount >= 3) {
        signals.push({
          signal: 'recurring_delays',
          severity: delayCount >= 6 ? 'high' : 'medium',
          evidence: { delayCount, avgDaysLate },
          timestamp: new Date(),
        });
        riskScore += delayCount >= 6 ? 25 : 15;
      }

      // Signal 2: Baisse des communications / interactions
      const communicationQuery = `
        SELECT 
          COUNT(*) as contact_count,
          MAX(contacted_at) as last_contact,
          AVG(EXTRACT(DAY FROM (CURRENT_DATE - contacted_at))::INT) as avg_days_since_contact
        FROM tenant_interactions
        WHERE tenant_id = $1
          AND contacted_at >= CURRENT_DATE - INTERVAL '3 months'
      `;
      const comData = await this.pool.query(communicationQuery, [tenantId]);
      const contactCount = parseInt(comData.rows[0]?.contact_count || 0);
      const avgDaysSinceContact = parseInt(comData.rows[0]?.avg_days_since_contact || 0);

      if (contactCount < 2) {
        signals.push({
          signal: 'low_communication',
          severity: contactCount === 0 ? 'high' : 'medium',
          evidence: { contactCount, avgDaysSinceContact },
          timestamp: new Date(),
        });
        riskScore += contactCount === 0 ? 20 : 10;
      }

      // Signal 3: Comparaison loyer avec marché local
      const tenantQuery = `
        SELECT c.monthly_rent, c.property_id, c.start_date
        FROM contracts c
        WHERE c.tenant_id = $1 AND c.end_date IS NULL
      `;
      const tenantData = await this.pool.query(tenantQuery, [tenantId]);
      if (tenantData.rows.length > 0) {
        const currentRent = tenantData.rows[0].monthly_rent;
        
        const marketQuery = `
          SELECT AVG(monthly_rent) as avg_market_rent
          FROM contracts c
          WHERE c.property_id = $1 
            AND c.id != (
              SELECT id FROM contracts WHERE tenant_id = $2 
            )
            AND c.created_at >= CURRENT_DATE - INTERVAL '12 months'
        `;
        const marketData = await this.pool.query(marketQuery, [
          tenantData.rows[0].property_id,
          tenantId
        ]);
        const avgMarketRent = parseFloat(marketData.rows[0]?.avg_market_rent || 0);

        if (avgMarketRent > 0 && currentRent < avgMarketRent * 0.85) {
          signals.push({
            signal: 'low_rent_vs_market',
            severity: 'medium',
            evidence: { currentRent, avgMarketRent, diff: avgMarketRent - currentRent },
            timestamp: new Date(),
          });
          riskScore += 8; // Locataire heureux, peu risque
        } else if (avgMarketRent > currentRent * 1.15) {
          signals.push({
            signal: 'high_local_rent_pressure',
            severity: 'high',
            evidence: { currentRent, avgMarketRent, percentIncrease: (avgMarketRent / currentRent - 1) * 100 },
            timestamp: new Date(),
          });
          riskScore += 20; // Marché tendus, risque accru
        }
      }

      // Signal 4: Incidents non résolus ou réclamations
      const incidentsQuery = `
        SELECT 
          COUNT(*) as open_incidents,
          MAX(reported_at) as last_incident
        FROM incidents
        WHERE tenant_id = $1
          AND status IN ('open', 'in_progress')
      `;
      const incidentsData = await this.pool.query(incidentsQuery, [tenantId]);
      const openIncidents = parseInt(incidentsData.rows[0]?.open_incidents || 0);

      if (openIncidents > 0) {
        signals.push({
          signal: 'unresolved_incidents',
          severity: openIncidents > 2 ? 'high' : 'medium',
          evidence: { openIncidents },
          timestamp: new Date(),
        });
        riskScore += openIncidents > 2 ? 18 : 10;
      }

      // Signal 5: Changements démographiques/situation
      const situationQuery = `
        SELECT 
          family_status,
          employment_status,
          updated_at
        FROM tenant_profiles
        WHERE tenant_id = $1
        ORDER BY updated_at DESC
        LIMIT 2
      `;
      const situationData = await this.pool.query(situationQuery, [tenantId]);
      if (situationData.rows.length > 1) {
        const current = situationData.rows[0];
        const previous = situationData.rows[1];
        
        if (current.family_status !== previous.family_status ||
            current.employment_status !== previous.employment_status) {
          signals.push({
            signal: 'situation_change',
            severity: 'medium',
            evidence: { previous, current },
            timestamp: new Date(),
          });
          riskScore += 12;
        }
      }

      // Capper le score
      riskScore = Math.min(riskScore, 100);

      // Recommandations de rétention
      const retentionRecommendations = this.generateRetentionRecommendations(signals, riskScore);

      // Fenêtre de départ prédictive (si score > 70)
      let predictedDepartureWindow = undefined;
      if (riskScore > 70) {
        const currentDate = dayjs();
        predictedDepartureWindow = {
          startDate: currentDate.add(2, 'weeks').toDate(),
          endDate: currentDate.add(8, 'weeks').toDate(),
          confidence: Math.min(90, 50 + riskScore / 2),
        };
      }

      // Mettre à jour le tenant
      await this.pool.query(
        'UPDATE tenants SET departure_risk_score = $1, last_contact_date = CURRENT_TIMESTAMP WHERE id = $2',
        [riskScore, tenantId]
      );

      const assessment: DepartureRiskAssessment = {
        tenantId,
        contractId: tenantData.rows[0]?.id || '',
        riskScore,
        signals,
        retentionRecommendations,
        predictedDepartureWindow,
        calculatedAt: new Date(),
      };

      // Enregistrer l'évaluation
      await this.pool.query(
        `INSERT INTO departure_risk_assessments 
         (tenant_id, contract_id, risk_score, signals, retention_recommendations, 
          predicted_departure_start, predicted_departure_end, prediction_confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId,
          assessment.contractId,
          riskScore,
          JSON.stringify(signals),
          JSON.stringify(retentionRecommendations),
          predictedDepartureWindow?.startDate,
          predictedDepartureWindow?.endDate,
          predictedDepartureWindow?.confidence,
        ]
      );

      // Créer une alerte si risque élevé
      if (riskScore > 70) {
        await this.createAlert({
          type: 'departure_risk',
          severity: 'P2',
          entityId: tenantId,
          title: `Risque de départ élevé: ${assessment.tenantId}`,
          description: `Score de risque: ${riskScore}/100. Signaux: ${signals.map(s => s.signal).join(', ')}`,
          actionRequired: 'Initier appel de rétention ou médiation',
          reasoning: {
            rule: 'DepartureRiskThreshold',
            factors: { riskScore, signalCount: signals.length },
            confidence: riskScore >= 85 ? 95 : 70,
          },
        });
      }

      return assessment;
    } catch (error) {
      console.error('Error assessing departure risk:', error);
      throw error;
    }
  }

  /**
   * Génère des recommandations de rétention basées sur les signaux
   */
  private generateRetentionRecommendations(signals: AIRiskSignal[], riskScore: number) {
    const recommendations = [];

    for (const signal of signals) {
      if (signal.signal === 'recurring_delays') {
        recommendations.push({
          action: 'schedule_payment_review',
          priority: signal.severity === 'high' ? 'high' : 'medium',
          expectedImpact: 'Restructure échéancier, réduit stress financier',
        });
      }
      if (signal.signal === 'low_communication') {
        recommendations.push({
          action: 'initiate_personal_outreach',
          priority: signal.severity === 'high' ? 'high' : 'medium',
          expectedImpact: 'Renforce relation, détecte issues cachées',
        });
      }
      if (signal.signal === 'high_local_rent_pressure') {
        recommendations.push({
          action: 'offer_commercial_gesture',
          priority: 'high',
          expectedImpact: 'Réduit incitatif de changement, fidélise',
        });
      }
      if (signal.signal === 'unresolved_incidents') {
        recommendations.push({
          action: 'fast_track_maintenance',
          priority: signal.severity === 'high' ? 'high' : 'medium',
          expectedImpact: 'Augmente satisfaction, démontre engagement',
        });
      }
    }

    if (riskScore > 85) {
      recommendations.unshift({
        action: 'escalate_to_manager',
        priority: 'high',
        expectedImpact: 'Mobilise décision-maker senior',
      });
    }

    return recommendations;
  }

  /**
   * Crée des alertes SLA basées sur les délais de préavis
   */
  async createNoticeDeadlineAlerts(): Promise<void> {
    try {
      // Jalons clés
      const deadlinePoints = [
        { daysFromNow: 30, trigger: 'j_minus_30' },
        { daysFromNow: 15, trigger: 'j_minus_15' },
        { daysFromNow: 7, trigger: 'j_minus_7' },
        { daysFromNow: 3, trigger: 'j_minus_3' },
        { daysFromNow: 1, trigger: 'j_minus_1' },
      ];

      for (const point of deadlinePoints) {
        const targetDate = dayjs().add(point.daysFromNow, 'days').startOf('day').toDate();
        const nextDate = dayjs().add(point.daysFromNow + 1, 'days').startOf('day').toDate();

        const query = `
          SELECT n.id, n.contract_id, c.tenant_id, c.property_manager_id
          FROM notices n
          JOIN contracts c ON n.contract_id = c.id
          WHERE n.status NOT IN ('closed', 'annulled', 'expired')
            AND n.effective_date >= $1 
            AND n.effective_date < $2
            AND NOT EXISTS (
              SELECT 1 FROM ai_alerts 
              WHERE entity_id = n.id 
              AND type = 'deadline'
              AND created_at > CURRENT_DATE - INTERVAL '1 day'
            )
        `;
        const notices = await this.pool.query(query, [targetDate, nextDate]);

        for (const notice of notices.rows) {
          await this.createAlert({
            type: 'deadline',
            severity: point.daysFromNow <= 3 ? 'P1' : 'P2',
            entityId: notice.id,
            title: `Préavis J-${point.daysFromNow}: ${notice.id}`,
            description: `Préavis prend effet dans ${point.daysFromNow} jours (${dayjs(targetDate).format('DD/MM/YYYY')})`,
            actionRequired: point.daysFromNow <= 3 
              ? 'Vérifier réception, planifier état des lieux'
              : 'Préparer documentation',
            assignedTo: notice.property_manager_id,
            dueDate: targetDate,
            reasoning: {
              rule: 'NoticeDeadlineRule',
              factors: { daysUntilEffective: point.daysFromNow },
              confidence: 100,
            },
          });
        }
      }

      // Alertes post-effet (suivi non-accusé)
      const postEffectQuery = `
        SELECT n.id, n.contract_id, c.property_manager_id, n.effective_date
        FROM notices n
        JOIN contracts c ON n.contract_id = c.id
        WHERE n.status NOT IN ('closed', 'annulled')
          AND n.effective_date <= CURRENT_DATE
          AND n.acknowledged_at IS NULL
          AND n.effective_date >= CURRENT_DATE - INTERVAL '3 days'
          AND NOT EXISTS (
            SELECT 1 FROM ai_alerts 
            WHERE entity_id = n.id 
            AND type = 'deadline'
            AND created_at > CURRENT_DATE - INTERVAL '1 day'
          )
      `;
      const postEffectNotices = await this.pool.query(postEffectQuery);

      for (const notice of postEffectNotices.rows) {
        const daysOverdue = dayjs().diff(dayjs(notice.effective_date), 'days');
        await this.createAlert({
          type: 'deadline',
          severity: daysOverdue >= 3 ? 'P1' : 'P2',
          entityId: notice.id,
          title: `⚠️ Pas d'accusé de réception: ${notice.id}`,
          description: `Le préavis a pris effet il y a ${daysOverdue} jours sans accusé de réception`,
          actionRequired: 'Relancer par tous canaux, escalade si J+3',
          assignedTo: notice.property_manager_id,
          dueDate: dayjs(notice.effective_date).add(3, 'days').toDate(),
          reasoning: {
            rule: 'MissingAcknowledgement',
            factors: { daysOverdue },
            confidence: 100,
          },
        });
      }
    } catch (error) {
      console.error('Error creating deadline alerts:', error);
    }
  }

  /**
   * Détecte litiges et anomalies
   */
  async detectLitigationAnomalies(): Promise<void> {
    try {
      // Détecte textes de contestation (NLP simple)
      const contestQuery = `
        SELECT n.id, n.contract_id, n.contested_at, n.contestation_reason
        FROM notices n
        WHERE n.status = 'contested'
          AND n.contested_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM ai_alerts 
            WHERE entity_id = n.id 
            AND type = 'litigation'
            AND created_at > CURRENT_DATE - INTERVAL '7 days'
          )
      `;
      const contestedNotices = await this.pool.query(contestQuery);

      for (const notice of contestedNotices.rows) {
        // Détection simple de keywords
        const reason = (notice.contestation_reason || '').toLowerCase();
        const keywordSeverity = this.analyzeContestationKeywords(reason);

        await this.createAlert({
          type: 'litigation',
          severity: keywordSeverity,
          entityId: notice.id,
          title: `Contestation préavis: ${notice.id}`,
          description: `Motif: ${notice.contestation_reason}`,
          actionRequired: 'Initier médiation, documenter réponse',
          dueDate: dayjs(notice.contested_at).add(3, 'days').toDate(),
          reasoning: {
            rule: 'LitigationDetection',
            factors: { reason: notice.contestation_reason },
            confidence: 80,
          },
        });
      }

      // Détecte incohérences contrat/préavis
      const inconsistencyQuery = `
        SELECT 
          n.id,
          n.contract_id,
          c.allowable_notice_types,
          n.type
        FROM notices n
        JOIN contracts c ON n.contract_id = c.id
        WHERE NOT (n.type = ANY(c.allowable_notice_types))
          AND NOT EXISTS (
            SELECT 1 FROM ai_alerts 
            WHERE entity_id = n.id 
            AND type = 'anomaly'
            AND created_at > CURRENT_DATE - INTERVAL '7 days'
          )
      `;
      const inconsistencies = await this.pool.query(inconsistencyQuery);

      for (const inc of inconsistencies.rows) {
        await this.createAlert({
          type: 'anomaly',
          severity: 'P1',
          entityId: inc.id,
          title: `Préavis non autorisé: ${inc.id}`,
          description: `Type "${inc.type}" non autorisé par contrat. Types autorisés: ${inc.allowable_notice_types.join(', ')}`,
          actionRequired: 'Réviser contrat ou annuler préavis',
          reasoning: {
            rule: 'ContractInconsistency',
            factors: { requestedType: inc.type, allowedTypes: inc.allowable_notice_types },
            confidence: 100,
          },
        });
      }

      // Détecte pièces manquantes
      const missingDocsQuery = `
        SELECT 
          n.id,
          n.contract_id,
          STRING_AGG(DISTINCT 'state_of_property', ', ') as missing_docs
        FROM notices n
        WHERE n.status IN ('sent', 'received', 'validated')
          AND NOT EXISTS (
            SELECT 1 FROM notice_documents nd
            WHERE nd.notice_id = n.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM ai_alerts 
            WHERE entity_id = n.id 
            AND type = 'anomaly'
            AND description LIKE '%documents%'
            AND created_at > CURRENT_DATE - INTERVAL '7 days'
          )
      `;
      const missingDocs = await this.pool.query(missingDocsQuery);

      for (const notice of missingDocs.rows) {
        await this.createAlert({
          type: 'anomaly',
          severity: 'P2',
          entityId: notice.id,
          title: `Pièces manquantes: ${notice.id}`,
          description: 'État des lieux manquant - requis pour clôture',
          actionRequired: 'Planifier inspection, générer PV',
          reasoning: {
            rule: 'MissingDocuments',
            factors: { missingDocs: ['state_of_property'] },
            confidence: 100,
          },
        });
      }
    } catch (error) {
      console.error('Error detecting litigation anomalies:', error);
    }
  }

  /**
   * Analyse simple des mots-clés dans contestation
   */
  private analyzeContestationKeywords(text: string): 'P1' | 'P2' | 'P3' {
    const p1Keywords = ['non-respect', 'harcèlement', 'discrimination', 'conditions habitables', 'fraude'];
    const p2Keywords = ['délai insuffisant', 'erreur calcul', 'pièce manquante'];

    if (p1Keywords.some(kw => text.includes(kw))) return 'P1';
    if (p2Keywords.some(kw => text.includes(kw))) return 'P2';
    return 'P3';
  }

  /**
   * Priorise les tâches des agents
   */
  async getPrioritizedAgentTasks(managerId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          aa.id,
          aa.type,
          aa.severity,
          aa.title,
          aa.entity_id,
          aa.due_date,
          CASE 
            WHEN aa.severity = 'P1' THEN 1
            WHEN aa.severity = 'P2' THEN 2
            ELSE 3
          END as severity_order,
          EXTRACT(DAY FROM (aa.due_date - CURRENT_DATE))::INT as days_until_due,
          COUNT(*) OVER (PARTITION BY aa.assigned_to) as agent_load
        FROM ai_alerts aa
        WHERE aa.assigned_to = $1
          AND aa.status = 'open'
        ORDER BY 
          aa.severity DESC,
          aa.due_date ASC,
          aa.created_at ASC
        LIMIT 20
      `;

      const result = await this.pool.query(query, [managerId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting prioritized tasks:', error);
      throw error;
    }
  }

  /**
   * Crée une alerte IA
   */
  async createAlert(alert: Partial<AIAlert>): Promise<AIAlert> {
    try {
      const query = `
        INSERT INTO ai_alerts 
        (type, severity, entity_id, title, description, action_required, assigned_to, due_date, reasoning, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        alert.type,
        alert.severity,
        alert.entityId,
        alert.title,
        alert.description,
        alert.actionRequired,
        alert.assignedTo,
        alert.dueDate,
        JSON.stringify(alert.reasoning),
        'open',
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Résout une alerte
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE ai_alerts SET status = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['resolved', alertId]
      );
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Exécute tâches de maintenance IA (appeler régulièrement via cron)
   */
  async runMaintenanceTasks(): Promise<void> {
    try {
      console.log('[IA] Executing maintenance tasks...');
      
      // Crée alertes SLA
      await this.createNoticeDeadlineAlerts();
      
      // Détecte anomalies
      await this.detectLitigationAnomalies();
      
      // Évalue risques de départ pour locataires actifs
      const tenantsQuery = `
        SELECT DISTINCT t.id 
        FROM tenants t
        JOIN contracts c ON t.id = c.tenant_id
        WHERE c.end_date IS NULL
        ORDER BY RANDOM()
        LIMIT 50 -- Batch pour ne pas surcharger
      `;
      const tenants = await this.pool.query(tenantsQuery);
      
      for (const tenant of tenants.rows) {
        await this.assessDepartureRisk(tenant.id);
      }
      
      console.log('[IA] Maintenance tasks completed');
    } catch (error) {
      console.error('Error running maintenance tasks:', error);
    }
  }
}

export default NoticeAIService;
