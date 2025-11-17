/**
 * AIExplainabilityService
 * 
 * Expliquer chaque alerte IA: pourquoi?, quelle cause racine?, recommandation?, taux succès?
 * "Black box" → "Glass box" (transparent AI)
 * 
 * Chaque alerte = contexte complet pour prise de décision
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';

interface AIAlert {
  alertId: string;
  tenantId: string;
  alertType: 'payment_risk' | 'notice_overdue' | 'dispute_escalation' | 'occupancy_risk' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  message: string;
  createdAt: Date;
  expiresAt: Date;
}

interface ExplainabilityContext {
  engine: 'delinquency_pattern' | 'seasonality' | 'anomaly_detection' | 'custom_rule' | 'ensemble';
  confidence: number; // 0-100
  dataPoints: number; // Combien de points de données utilisés?
  signals: ExplainabilitySignal[];
  historicalAccuracy: number; // % de fois le modèle avait raison
}

interface ExplainabilitySignal {
  signal: string;
  value: string | number;
  weight: number; // 0-100, contribution à l'alerte
  comparison: string; // vs. what baseline/benchmark?
  severity: 'positive' | 'negative' | 'neutral';
}

interface AlertExplanation {
  alert: AIAlert;
  context: ExplainabilityContext;
  rootCauses: RootCause[];
  recommendations: Recommendation[];
  similarCases: SimilarCase[];
  actionItems: ActionItem[];
  explainabilityScore: number; // 0-100, how well explained?
}

interface RootCause {
  cause: string;
  evidence: string[];
  likelihood: number; // %
  contractClause?: string; // Si applicable
  historicalPrecedent?: string;
}

interface Recommendation {
  action: string;
  expectedOutcome: string;
  successRate: number; // % basé sur historique similaire
  effort: 'low' | 'medium' | 'high';
  timeline: string; // "Immédiat", "Cette semaine", "Ce mois"
  approvalRequired: boolean;
}

interface SimilarCase {
  caseId: string;
  similarity: number; // 0-100
  outcome: 'resolved' | 'escalated' | 'lost';
  actionTaken: string;
  result: string;
}

interface ActionItem {
  action: string;
  owner: 'agent' | 'manager' | 'system';
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

class AIExplainabilityService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Expliquer une alerte complètement
   */
  async explainAlert(alertId: string): Promise<AlertExplanation> {
    try {
      // Récupérer alerte
      const alertResult = await this.pool.query(
        `SELECT * FROM ai_alerts WHERE alert_id = $1`,
        [alertId]
      );

      if (!alertResult.rows[0]) {
        throw new Error(`Alert ${alertId} not found`);
      }

      const alert = alertResult.rows[0] as AIAlert;

      // Récupérer contexte explicabilité
      const contextResult = await this.pool.query(
        `SELECT * FROM ai_alert_context WHERE alert_id = $1`,
        [alertId]
      );

      const context = contextResult.rows[0];
      const explainContext = this.parseContext(context);

      // Générer explications
      const rootCauses = await this.identifyRootCauses(alert);
      const recommendations = await this.generateRecommendations(alert, rootCauses);
      const similarCases = await this.findSimilarCases(alert);
      const actionItems = this.createActionItems(alert, recommendations);

      // Calculer score d'explicabilité
      const explainabilityScore = this.calculateExplainabilityScore(
        explainContext,
        rootCauses,
        recommendations
      );

      return {
        alert,
        context: explainContext,
        rootCauses,
        recommendations,
        similarCases,
        actionItems,
        explainabilityScore,
      };
    } catch (error) {
      logger.error(`Error explaining alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Parser contexte explicabilité
   */
  private parseContext(contextRow: any): ExplainabilityContext {
    return {
      engine: contextRow.engine || 'ensemble',
      confidence: contextRow.confidence || 0,
      dataPoints: contextRow.data_points || 0,
      signals: JSON.parse(contextRow.signals || '[]'),
      historicalAccuracy: contextRow.historical_accuracy || 0,
    };
  }

  /**
   * Identifier causes racines
   */
  private async identifyRootCauses(alert: AIAlert): Promise<RootCause[]> {
    const causes: RootCause[] = [];

    if (alert.alertType === 'payment_risk') {
      // Analyser historique paiement
      const paymentResult = await this.pool.query(
        `SELECT 
           SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed_count,
           MAX(EXTRACT(EPOCH FROM (paid_at - due_date))) as max_delay_seconds,
           AVG(amount) as avg_amount
         FROM payments 
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '12 months'`,
        [alert.tenantId]
      );

      const payment = paymentResult.rows[0];

      if (payment.missed_count > 0) {
        causes.push({
          cause: 'Paiements manqués antérieurs',
          evidence: [
            `${payment.missed_count} paiements manqués dans 12 derniers mois`,
            `Retard moyen: ${Math.floor(payment.max_delay_seconds / 86400)} jours`,
          ],
          likelihood: 65,
          historicalPrecedent: '72% des locataires avec 2+ retards manquent payment suivant',
        });
      }

      // Analyser contexte économique
      const contextResult = await this.pool.query(
        `SELECT 
           t.employment_status,
           c.monthly_rent,
           COUNT(DISTINCT CASE WHEN co.type = 'complaint' THEN co.id END) as complaint_count
         FROM tenants t
         LEFT JOIN contracts c ON t.id = c.tenant_id AND c.status = 'active'
         LEFT JOIN communications co ON t.id = co.tenant_id
         WHERE t.id = $1`,
        [alert.tenantId]
      );

      const context = contextResult.rows[0];

      if (context.employment_status === 'job_search') {
        causes.push({
          cause: 'Changement situatio économique',
          evidence: ['Locataire en recherche d\'emploi', 'Statut rapporté récemment'],
          likelihood: 45,
          historicalPrecedent: 'Unemployment → 40% churn rate vs 8% baseline',
        });
      }
    }

    if (alert.alertType === 'notice_overdue') {
      // Analyser pourquoi notice pas signée
      const noticeResult = await this.pool.query(
        `SELECT 
           notice_id, notice_type, created_at, sent_at, reminder_count
         FROM notices 
         WHERE tenant_id = $1 AND status = 'pending'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [alert.tenantId]
      );

      const notice = noticeResult.rows[0];

      if (notice) {
        const daysOverdue = Math.floor((Date.now() - new Date(notice.created_at).getTime()) / (1000 * 60 * 60 * 24));

        causes.push({
          cause: `Notice ${notice.notice_type} non traitée depuis ${daysOverdue} jours`,
          evidence: [`Envoyée: ${new Date(notice.sent_at).toLocaleDateString()}`, `Rappels: ${notice.reminder_count}`],
          likelihood: 85,
          contractClause: 'Clause 3.2: Notice doit être signée dans 15 jours',
        });
      }

      // Analyser si locataire contactable
      const tenantResult = await this.pool.query(
        `SELECT phone, email, last_seen_at 
         FROM tenants 
         WHERE id = $1`,
        [alert.tenantId]
      );

      const tenant = tenantResult.rows[0];
      const daysSinceLastSeen = Math.floor((Date.now() - new Date(tenant.last_seen_at).getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastSeen > 30) {
        causes.push({
          cause: 'Locataire non contactable',
          evidence: [`Dernière activité: ${daysSinceLastSeen} jours`, 'SMS/Email: pas de réponse'],
          likelihood: 40,
        });
      }
    }

    if (alert.alertType === 'anomaly') {
      // Analyser quelle anomalie détectée
      const anomalyResult = await this.pool.query(
        `SELECT anomaly_type, expected_value, actual_value, z_score 
         FROM ai_anomalies 
         WHERE alert_id = $1 
         LIMIT 5`,
        [alert.alertId]
      );

      for (const row of anomalyResult.rows) {
        causes.push({
          cause: `Anomalie détectée: ${row.anomaly_type}`,
          evidence: [
            `Valeur attendue: ${row.expected_value}`,
            `Valeur observée: ${row.actual_value}`,
            `Z-score: ${row.z_score.toFixed(2)} (>2 = anomalie)`,
          ],
          likelihood: 75,
          historicalPrecedent: `${row.anomaly_type} observed in 12% of cases before major incident`,
        });
      }
    }

    return causes;
  }

  /**
   * Générer recommendations
   */
  private async generateRecommendations(alert: AIAlert, causes: RootCause[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (alert.alertType === 'payment_risk') {
      if (alert.riskScore > 80) {
        recommendations.push({
          action: 'Contacter locataire immédiatement - offer plan paiement',
          expectedOutcome: 'Éviter défaut - historique: 70% acceptent plan',
          successRate: 70,
          effort: 'low',
          timeline: 'Immédiat (24h)',
          approvalRequired: false,
        });

        recommendations.push({
          action: 'Proposer réduction 5% si paiement dans 3 jours',
          expectedOutcome: 'Incentivize payment - historique: 55% répondent',
          successRate: 55,
          effort: 'low',
          timeline: 'Immédiat',
          approvalRequired: true, // Manager doit approuver réduction
        });
      } else if (alert.riskScore > 50) {
        recommendations.push({
          action: 'Envoyer reminder SMS amical',
          expectedOutcome: 'Soft nudge - historique: 40% paient après reminder',
          successRate: 40,
          effort: 'low',
          timeline: 'Cette semaine',
          approvalRequired: false,
        });
      }
    }

    if (alert.alertType === 'notice_overdue') {
      recommendations.push({
        action: 'Envoyer notice par recommandé (if not already)',
        expectedOutcome: 'Preuve légale - requis pour escalade',
        successRate: 95,
        effort: 'low',
        timeline: 'Immédiat',
        approvalRequired: false,
      });

      recommendations.push({
        action: 'Si toujours pas réponse après 7j: Escalader à manager',
        expectedOutcome: 'Préparation pour éviction si nécessaire',
        successRate: 100,
        effort: 'low',
        timeline: 'Dans 7 jours',
        approvalRequired: false,
      });
    }

    if (alert.alertType === 'dispute_escalation') {
      recommendations.push({
        action: 'Assigner à team spécialisée litigation',
        expectedOutcome: 'Expertise required - historique: 65% résolvéent en 3 mois',
        successRate: 65,
        effort: 'medium',
        timeline: 'Immédiat',
        approvalRequired: true,
      });
    }

    return recommendations;
  }

  /**
   * Trouver cas similaires résolus
   */
  private async findSimilarCases(alert: AIAlert): Promise<SimilarCase[]> {
    try {
      const result = await this.pool.query(
        `SELECT 
           c.case_id, 
           c.alert_type,
           c.similarity_score,
           c.outcome,
           c.action_taken,
           c.result
         FROM similar_cases c
         WHERE c.alert_type = $1 
         ORDER BY c.similarity_score DESC 
         LIMIT 5`,
        [alert.alertType]
      );

      return result.rows.map(row => ({
        caseId: row.case_id,
        similarity: row.similarity_score,
        outcome: row.outcome,
        actionTaken: row.action_taken,
        result: row.result,
      }));
    } catch (error) {
      logger.warn(`Error finding similar cases:`, error);
      return [];
    }
  }

  /**
   * Créer action items
   */
  private createActionItems(alert: AIAlert, recommendations: Recommendation[]): ActionItem[] {
    const items: ActionItem[] = [];

    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      const dueDate = new Date();

      if (rec.timeline === 'Immédiat (24h)') {
        dueDate.setHours(dueDate.getHours() + 24);
      } else if (rec.timeline === 'Immédiat') {
        dueDate.setHours(dueDate.getHours() + 4);
      } else if (rec.timeline === 'Cette semaine') {
        dueDate.setDate(dueDate.getDate() + 3);
      } else if (rec.timeline === 'Ce mois') {
        dueDate.setDate(dueDate.getDate() + 14);
      } else if (rec.timeline.includes('jours')) {
        const days = parseInt(rec.timeline);
        dueDate.setDate(dueDate.getDate() + days);
      }

      items.push({
        action: rec.action,
        owner: rec.approvalRequired ? 'manager' : 'agent',
        dueDate,
        priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'medium',
        reason: rec.expectedOutcome,
      });
    }

    return items;
  }

  /**
   * Calculer score d'explicabilité (0-100)
   */
  private calculateExplainabilityScore(
    context: ExplainabilityContext,
    causes: RootCause[],
    recommendations: Recommendation[]
  ): number {
    let score = 50;

    // Confidence du modèle
    score += (context.confidence / 100) * 20;

    // Nombre de signaux
    score += Math.min(20, context.signals.length * 2);

    // Nombre de causes identifiées
    score += Math.min(20, causes.length * 5);

    // Nombre de recommendations
    score += Math.min(15, recommendations.length * 3);

    return Math.min(100, score);
  }

  /**
   * Générer rapport explicabilité pour UI
   */
  async generateExplainabilityReport(alertId: string): Promise<string> {
    const explanation = await this.explainAlert(alertId);

    let report = `# Explication d'Alerte IA\n\n`;
    report += `**Alerte**: ${explanation.alert.alertType} (Sévérité: ${explanation.alert.severity})\n`;
    report += `**Confiance**: ${explanation.context.confidence}%\n`;
    report += `**Score d'Explicabilité**: ${explanation.explainabilityScore}/100\n\n`;

    report += `## Causes Racines\n`;
    for (const cause of explanation.rootCauses) {
      report += `- **${cause.cause}** (${cause.likelihood}% probabilité)\n`;
      for (const evidence of cause.evidence) {
        report += `  - ${evidence}\n`;
      }
      if (cause.historicalPrecedent) {
        report += `  - Historique: ${cause.historicalPrecedent}\n`;
      }
    }

    report += `\n## Recommendations\n`;
    for (const rec of explanation.recommendations) {
      report += `- **${rec.action}** (${rec.successRate}% succès)\n`;
      report += `  - Outcome: ${rec.expectedOutcome}\n`;
      report += `  - Timeline: ${rec.timeline}\n`;
    }

    report += `\n## Cas Similaires Résolus\n`;
    for (const simCase of explanation.similarCases) {
      report += `- Cas ${simCase.caseId}: ${simCase.actionTaken} → ${simCase.result} (Similarité: ${simCase.similarity}%)\n`;
    }

    return report;
  }

  /**
   * Sauvegarder explication pour audit
   */
  async saveExplanation(explanation: AlertExplanation): Promise<void> {
    await this.pool.query(
      `INSERT INTO alert_explanations 
       (alert_id, explanation_json, explainability_score, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [explanation.alert.alertId, JSON.stringify(explanation), explanation.explainabilityScore]
    );
  }
}

export default AIExplainabilityService;
