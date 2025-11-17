/**
 * ============================================================
 * noticeAlertsMatrix.ts - Matrice d'alerte IA pour préavis
 * Implémente lifecy: J-30/J-15/J-7/J-3/J-1 + détection intention départ
 * ============================================================
 */

export interface NoticeAlert {
  id: string;
  type: 'reminder' | 'urgent' | 'critical' | 'dispute' | 'intent_signal';
  window: string; // J-30, J-15, J-7, J-3, J-1
  message: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipient: 'agent' | 'manager' | 'legal';
  channel: 'email' | 'sms' | 'push' | 'dashboard';
  dueDate?: string;
  triggerSignals?: string[];
}

export interface TenantIntentScoring {
  tenantId: string;
  departureRiskScore: number; // 0-1
  signals: string[];
  lastUpdated: string;
}

/**
 * Calcule les fenêtres de préavis basées sur date fin bail
 */
export function calculateNoticeWindows(leaseEndDate: string) {
  const endDate = new Date(leaseEndDate);
  const today = new Date();
  const daysRemaining = Math.floor(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    j30: daysRemaining <= 30 && daysRemaining > 15,
    j15: daysRemaining <= 15 && daysRemaining > 7,
    j7: daysRemaining <= 7 && daysRemaining > 3,
    j3: daysRemaining <= 3 && daysRemaining > 1,
    j1: daysRemaining <= 1,
    expired: daysRemaining < 0,
    daysRemaining,
  };
}

/**
 * Génère alertes pour fenêtre préavis
 */
export function generateNoticeAlerts(
  leaseId: string,
  leaseEndDate: string,
  tenantName: string,
  agentName: string
): NoticeAlert[] {
  const windows = calculateNoticeWindows(leaseEndDate);
  const alerts: NoticeAlert[] = [];

  if (windows.j30) {
    alerts.push({
      id: `notice-${leaseId}-j30`,
      type: 'reminder',
      window: 'J-30',
      message: `Préavis à préparer pour ${tenantName} - Fin de bail dans 30 jours`,
      action: 'Préparer documents légaux, vérifier respect délai',
      priority: 'low',
      recipient: 'agent',
      channel: 'email',
      dueDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      triggerSignals: ['lease_ending_30_days'],
    });
  }

  if (windows.j15) {
    alerts.push({
      id: `notice-${leaseId}-j15`,
      type: 'reminder',
      window: 'J-15',
      message: `Préavis à réviser pour ${tenantName} - Fin de bail dans 15 jours`,
      action: 'Valider conformité juridique, planifier envoi',
      priority: 'medium',
      recipient: 'agent',
      channel: 'email',
      dueDate: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      triggerSignals: ['lease_ending_15_days'],
    });
  }

  if (windows.j7) {
    alerts.push({
      id: `notice-${leaseId}-j7`,
      type: 'urgent',
      window: 'J-7',
      message: `⚠️ URGENT: Préavis à envoyer pour ${tenantName} - Fin de bail dans 7 jours`,
      action: 'Envoyer préavis immédiatement par recommandé + SMS/Email',
      priority: 'high',
      recipient: 'agent',
      channel: 'sms',
      dueDate: new Date(new Date().getTime() + 12 * 60 * 60 * 1000).toISOString(),
      triggerSignals: ['lease_ending_7_days', 'notice_not_sent'],
    });
  }

  if (windows.j3) {
    alerts.push({
      id: `notice-${leaseId}-j3`,
      type: 'critical',
      window: 'J-3',
      message: `🚨 CRITIQUE: Préavis DOIT être envoyé pour ${tenantName} - Fin de bail dans 3 jours`,
      action: 'Escalade vers manager - Risque légal imminent',
      priority: 'critical',
      recipient: 'manager',
      channel: 'push',
      dueDate: new Date(new Date().getTime() + 4 * 60 * 60 * 1000).toISOString(),
      triggerSignals: ['lease_ending_3_days', 'notice_not_sent', 'deadline_critical'],
    });

    // Alerter aussi l'agent
    alerts.push({
      id: `notice-${leaseId}-j3-agent`,
      type: 'critical',
      window: 'J-3',
      message: `ACTION REQUISE: Préavis OBLIGATOIRE aujourd'hui pour ${tenantName}`,
      action: 'Envoyer immédiatement - Votre manager a été alerté',
      priority: 'critical',
      recipient: 'agent',
      channel: 'push',
      triggerSignals: ['lease_ending_3_days'],
    });
  }

  if (windows.j1) {
    alerts.push({
      id: `notice-${leaseId}-j1`,
      type: 'critical',
      window: 'J-1',
      message: `🚨 DÉFAUT LÉGAL: Préavis NON envoyé pour ${tenantName} - AUJOURD'HUI DERNIER JOUR`,
      action: 'Escalade critique - Implication légale directe',
      priority: 'critical',
      recipient: 'manager',
      channel: 'push',
      triggerSignals: ['lease_ending_1_day', 'notice_not_sent', 'legal_breach'],
    });
  }

  if (windows.expired) {
    alerts.push({
      id: `notice-${leaseId}-expired`,
      type: 'dispute',
      window: 'EXPIRED',
      message: `❌ DÉPASSÉ: Délai légal expiré pour préavis de ${tenantName}`,
      action: 'Consulter legal - Options limitées (renouvellement?)',
      priority: 'critical',
      recipient: 'manager',
      channel: 'email',
      triggerSignals: ['notice_deadline_expired'],
    });
  }

  return alerts;
}

/**
 * Détecte signaux intention départ locataire
 */
export function scoreDepartureIntent(tenantData: any): TenantIntentScoring {
  let score = 0;
  const signals: string[] = [];

  // Signal 1: Retards paiement récents (2+ dans 6 mois)
  if (tenantData.recentDelayedPayments && tenantData.recentDelayedPayments >= 2) {
    score += 0.25;
    signals.push('recurring_payment_delays');
  }

  // Signal 2: Taux lecture messages bas (<30%)
  if (tenantData.messageReadRate !== undefined && tenantData.messageReadRate < 0.3) {
    score += 0.15;
    signals.push('low_message_engagement');
  }

  // Signal 3: Signalements maintenance non résolus (>3)
  if (tenantData.unresolvedMaintenanceTickets && tenantData.unresolvedMaintenanceTickets > 3) {
    score += 0.15;
    signals.push('unresolved_maintenance');
  }

  // Signal 4: Baisse activité plateforme (pas de login 30+ jours)
  if (tenantData.daysSinceLastLogin && tenantData.daysSinceLastLogin > 30) {
    score += 0.1;
    signals.push('dormant_account');
  }

  // Signal 5: Plaintes ou contestations récentes
  if (tenantData.recentDisputes && tenantData.recentDisputes > 0) {
    score += 0.2;
    signals.push('recent_disputes');
  }

  // Signal 6: Demande d'informations contractuelles (sortie?)
  if (tenantData.queriedExitClause === true) {
    score += 0.3;
    signals.push('queried_exit_terms');
  }

  // Plafonner score à 1
  score = Math.min(score, 1);

  return {
    tenantId: tenantData.id,
    departureRiskScore: score,
    signals,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Détecte contestation préavis via NLP keywords
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
    'demande annulation',
    'recours',
    'arbitrage',
    'avocat',
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
 * Workflow médiation pour contestation
 */
export function initiateDisputeMediation(
  leaseId: string,
  tenantName: string,
  agentName: string,
  disputeReason: string
) {
  return {
    workflowId: `dispute-${leaseId}-${Date.now()}`,
    status: 'open',
    createdAt: new Date().toISOString(),
    steps: [
      {
        step: 1,
        title: 'Agent Review',
        description: `Agent ${agentName} examine la contestation`,
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
        description: 'Communication décision finale au locataire',
        status: 'pending',
        deadline: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
      },
    ],
    participants: [
      { role: 'tenant', name: tenantName },
      { role: 'agent', name: agentName },
      { role: 'manager', name: 'TBD' },
    ],
    disputeReason,
  };
}

/**
 * Hook React pour intégration alertes
 */
export function useNoticeAlerts(leases: any[]) {
  const alerts: NoticeAlert[] = [];
  const riskTenants: TenantIntentScoring[] = [];

  leases.forEach((lease) => {
    const leaseAlerts = generateNoticeAlerts(
      lease.id,
      lease.endDate,
      lease.tenantName,
      lease.agentName
    );
    alerts.push(...leaseAlerts);

    // Calculer risque départ
    const riskScore = scoreDepartureIntent(lease.tenant);
    if (riskScore.departureRiskScore > 0.6) {
      riskTenants.push(riskScore);
    }
  });

  return { alerts, riskTenants };
}

export default {
  calculateNoticeWindows,
  generateNoticeAlerts,
  scoreDepartureIntent,
  detectDisputeIntent,
  initiateDisputeMediation,
  useNoticeAlerts,
};
