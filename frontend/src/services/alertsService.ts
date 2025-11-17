/**
 * ============================================================
 * services/alertsService.ts - Service d'alertes IA avancé
 * Analyse préavis, contestes, départ locataire, risques
 * ============================================================
 */

export interface PreavisAlert {
  preavis_id: number;
  contrat_id: number;
  locataire_id: number;
  type: 'J-30' | 'J-15' | 'J-7' | 'J-3' | 'J-1' | 'EXPIRED' | 'DISPUTE' | 'INTENT_SIGNAL';
  window: string;
  message: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipient: 'agent' | 'manager' | 'legal';
  date_effet: string;
  timestamp: string;
}

/**
 * Calculer les alertes pour un seul préavis
 */
export function calculatePreavisAlerts(preavis: any): PreavisAlert[] {
  const alerts: PreavisAlert[] = [];
  const today = new Date();
  const dateEffet = new Date(preavis.date_effet);
  const daysRemaining = Math.floor((dateEffet.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const baseAlert: any = {
    preavis_id: preavis.id,
    contrat_id: preavis.contrat_id,
    locataire_id: preavis.locataire_id,
    date_effet: preavis.date_effet,
    timestamp: new Date().toISOString(),
  };

  // J-30: Rappel de préparation
  if (daysRemaining <= 30 && daysRemaining > 15 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-30',
      window: 'J-30',
      message: `📋 Préavis #${preavis.id}: Préparation nécessaire (${daysRemaining} jours)`,
      action: 'Vérifier documents légaux et délais',
      priority: 'low',
      recipient: 'agent',
    });
  }

  // J-15: Révision
  if (daysRemaining <= 15 && daysRemaining > 7 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-15',
      window: 'J-15',
      message: `📋 Préavis #${preavis.id}: Révision requise (${daysRemaining} jours)`,
      action: 'Valider conformité juridique des documents',
      priority: 'medium',
      recipient: 'agent',
    });
  }

  // J-7: Urgence
  if (daysRemaining <= 7 && daysRemaining > 3 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-7',
      window: 'J-7',
      message: `⚠️ URGENT: Préavis #${preavis.id} doit être envoyé (${daysRemaining} jours)`,
      action: 'Envoyer immédiatement par recommandé + SMS/Email',
      priority: 'high',
      recipient: 'agent',
    });
  }

  // J-3: Critique
  if (daysRemaining <= 3 && daysRemaining > 0 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-3',
      window: 'J-3',
      message: `🚨 CRITIQUE: Préavis #${preavis.id} DOIT être envoyé (${daysRemaining} jours)`,
      action: 'Escalade vers manager - Risque légal imminent',
      priority: 'critical',
      recipient: 'manager',
    });

    // Aussi alerter l'agent
    alerts.push({
      ...baseAlert,
      type: 'J-3',
      window: 'J-3',
      message: `ACTION REQUISE: Préavis #${preavis.id} - URGENT (${daysRemaining} jours)`,
      action: 'Votre manager a été alerté',
      priority: 'critical',
      recipient: 'agent',
    });
  }

  // J-1: Dernier jour
  if (daysRemaining <= 1 && daysRemaining >= 0 && preavis.statut === 'EN_COURS') {
    alerts.push({
      ...baseAlert,
      type: 'J-1',
      window: 'J-1',
      message: `🚨 CRITIQUE: Préavis #${preavis.id} - DERNIER JOUR`,
      action: 'Escalade légale - Implication juridique directe',
      priority: 'critical',
      recipient: 'manager',
    });
  }

  // EXPIRED: Dépassé
  if (daysRemaining < 0) {
    alerts.push({
      ...baseAlert,
      type: 'EXPIRED',
      window: 'EXPIRED',
      message: `❌ DÉFAUT LÉGAL: Préavis #${preavis.id} n'a pas été envoyé à temps`,
      action: 'Consulter service juridique - Options limitées',
      priority: 'critical',
      recipient: 'manager',
    });
  }

  return alerts;
}

/**
 * Analyser ensemble de préavis + retourner alertes groupées
 */
export function analyzeAllPreavis(preavisList: any[]) {
  const allAlerts: PreavisAlert[] = [];

  preavisList.forEach((preavis) => {
    const alerts = calculatePreavisAlerts(preavis);
    allAlerts.push(...alerts);
  });

  // Grouper par priorité
  const byPriority = {
    critical: allAlerts.filter((a) => a.priority === 'critical'),
    high: allAlerts.filter((a) => a.priority === 'high'),
    medium: allAlerts.filter((a) => a.priority === 'medium'),
    low: allAlerts.filter((a) => a.priority === 'low'),
  };

  // Grouper par destinataire
  const byRecipient = {
    manager: allAlerts.filter((a) => a.recipient === 'manager'),
    agent: allAlerts.filter((a) => a.recipient === 'agent'),
    legal: allAlerts.filter((a) => a.recipient === 'legal'),
  };

  return {
    total: allAlerts.length,
    by_priority: byPriority,
    by_recipient: byRecipient,
    all_alerts: allAlerts,
  };
}

/**
 * Détecter contestations via keywords NLP
 */
export function detectDisputeIntent(message: string): {
  isDispute: boolean;
  confidence: number;
  keywords: string[];
} {
  const frenchDisputeKeywords = [
    'conteste',
    'refuse',
    'erreur',
    'non d\'accord',
    'inexact',
    'faux',
    'illégal',
    'abusif',
    'contestation',
    'recours',
    'arbitrage',
    'avocat',
    'injuste',
    'anormal',
    'problème',
  ];

  const lowerMessage = message.toLowerCase();
  const foundKeywords = frenchDisputeKeywords.filter((kw) =>
    lowerMessage.includes(kw)
  );

  return {
    isDispute: foundKeywords.length > 0,
    confidence: foundKeywords.length / frenchDisputeKeywords.length,
    keywords: foundKeywords,
  };
}

/**
 * Score du risque de départ locataire (0-1 scale)
 */
export function scoreDepartureIntent(tenantData: any): {
  score: number;
  signals: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  let score = 0;
  const signals: string[] = [];

  // Signal 1: 2+ retards paiement dans 6 derniers mois
  if (tenantData.recentDelayedPayments && tenantData.recentDelayedPayments >= 2) {
    score += 0.25;
    signals.push('recurring_payment_delays');
  }

  // Signal 2: Taux de lecture messages bas (<30%)
  if (tenantData.messageReadRate !== undefined && tenantData.messageReadRate < 0.3) {
    score += 0.15;
    signals.push('low_message_engagement');
  }

  // Signal 3: Tickets maintenance non résolus (>3)
  if (tenantData.unresolvedMaintenanceTickets && tenantData.unresolvedMaintenanceTickets > 3) {
    score += 0.15;
    signals.push('unresolved_maintenance');
  }

  // Signal 4: Account dormant (pas de login 30+ jours)
  if (tenantData.daysSinceLastLogin && tenantData.daysSinceLastLogin > 30) {
    score += 0.1;
    signals.push('dormant_account');
  }

  // Signal 5: Reclamations récentes
  if (tenantData.recentDisputes && tenantData.recentDisputes > 0) {
    score += 0.2;
    signals.push('recent_disputes');
  }

  // Signal 6: Demande d'info sur clause de sortie
  if (tenantData.queriedExitClause === true) {
    score += 0.3;
    signals.push('queried_exit_terms');
  }

  // Plafonner score
  score = Math.min(score, 1);

  // Déterminer niveau de risque
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (score > 0.7) {
    riskLevel = 'high';
  } else if (score > 0.4) {
    riskLevel = 'medium';
  }

  return { score, signals, riskLevel };
}

/**
 * Workflow médiation automatique
 */
export function initiateDisputeMediation(preavis: any, disputeReason: string) {
  return {
    workflow_id: `dispute-${preavis.id}-${Date.now()}`,
    preavis_id: preavis.id,
    status: 'open',
    created_at: new Date().toISOString(),
    steps: [
      {
        step: 1,
        title: 'Agent Review',
        description: 'Agent examine la contestation',
        status: 'pending',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        step: 2,
        title: 'PV Checklist',
        description: 'Validation des documents (bail, préavis, remise)',
        status: 'pending',
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        step: 3,
        title: 'Manager Arbitration',
        description: 'Manager examine et arbitre',
        status: 'pending',
        deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
      {
        step: 4,
        title: 'Decision & Communication',
        description: 'Communication décision au locataire',
        status: 'pending',
        deadline: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
      },
    ],
    participants: [
      { role: 'tenant', name: 'TBD' },
      { role: 'agent', name: 'TBD' },
      { role: 'manager', name: 'TBD' },
    ],
    dispute_reason: disputeReason,
  };
}

/**
 * Hook React pour alertes temps réel
 */
export function useNoticeAlerts(preavisList: any[]) {
  const analysis = analyzeAllPreavis(preavisList || []);

  return {
    total_alerts: analysis.total,
    critical_count: analysis.by_priority.critical.length,
    high_count: analysis.by_priority.high.length,
    by_priority: analysis.by_priority,
    by_recipient: analysis.by_recipient,
    all_alerts: analysis.all_alerts,
  };
}

export default {
  calculatePreavisAlerts,
  analyzeAllPreavis,
  detectDisputeIntent,
  scoreDepartureIntent,
  initiateDisputeMediation,
  useNoticeAlerts,
};
