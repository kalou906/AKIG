// src/services/aiPrescriptive.js
/**
 * Service IA: Actions prescriptives basées sur score probabilité
 * Détermine: quelle action, quand, comment contacter, escalade si nécessaire
 */

/**
 * Obtenir actions recommandées pour un locataire
 * @param {number} probability - Probabilité de paiement (0..1)
 * @param {number} lateCount - Nombre de retards enregistrés
 * @param {object} tenant - Données locataire {name, phone, email, guarantor}
 * @returns {array} Liste actions prescriptives ordonnées par urgence
 */
export function getNextActions(probability, lateCount = 0, tenant = {}) {
  const actions = [];

  if (probability >= 0.8) {
    // ZONE VERTE: Fiable, pas d'intervention
    actions.push({
      type: 'Informatif',
      priority: 'LOW',
      priority_level: 1,
      action: 'Aucune relance nécessaire',
      description: 'Locataire fiable. Maintenir suivi standard mensuel.',
      contact_method: 'NONE',
      timing: 'Mensuel',
      urgency: 'NONE',
      estimated_resolution_days: 0
    });
  } else if (probability >= 0.6) {
    // ZONE JAUNE: Préventif
    actions.push({
      type: 'Préventif',
      priority: 'MEDIUM',
      priority_level: 2,
      action: 'Rappel 5 jours avant échéance',
      description: 'SMS ou WhatsApp courtois pour confirmer paiement prévu',
      contact_method: 'SMS_WHATSAPP',
      timing: 'J-5',
      urgency: 'MEDIUM',
      estimated_resolution_days: 5,
      template: 'Rappel amical du paiement du loyer prévu le {{due_date}}'
    });
  } else if (probability >= 0.4) {
    // ZONE ORANGE: Proactif + Financier
    actions.push(
      {
        type: 'Proactif',
        priority: 'HIGH',
        priority_level: 3,
        action: 'Séquence d\'escalade multi-canaux',
        description: 'Trois contacts successifs via canaux différents',
        contact_method: 'MULTI',
        timing: 'J-7, J-5, J-3',
        urgency: 'HIGH',
        estimated_resolution_days: 7,
        contacts: [
          {
            day: -7,
            method: 'SMS',
            message: 'Rappel du paiement prévu: {{amount}} pour le {{due_date}}'
          },
          {
            day: -5,
            method: 'WHATSAPP',
            message: 'Nous n\'avons pas encore reçu votre paiement. Confirmez-vous pour le {{due_date}}?'
          },
          {
            day: -3,
            method: 'PHONE',
            message: 'Appel pour vérifier la situation du paiement'
          }
        ]
      },
      {
        type: 'Financier',
        priority: 'HIGH',
        priority_level: 3,
        action: 'Proposer plan d\'échéancier',
        description: 'Si non-paiement à J+3: négocier étalement',
        condition: 'Si paiement non reçu à J+3',
        contact_method: 'PHONE',
        timing: 'J+3',
        urgency: 'HIGH',
        estimated_resolution_days: 10,
        template: 'Nous proposons un plan de paiement: X FNG/semaine pendant 4 semaines'
      }
    );
  } else {
    // ZONE ROUGE: CRITIQUE
    actions.push(
      {
        type: 'Urgent',
        priority: 'CRITICAL',
        priority_level: 4,
        action: 'Intervention directe + Visite terrain',
        description: 'Appel immédiat + visite locaux pour diagnostic',
        contact_method: 'PHONE_VISIT',
        timing: 'Immédiat',
        urgency: 'CRITICAL',
        estimated_resolution_days: 1,
        visit_priority: 'URGENT'
      },
      {
        type: 'Légal',
        priority: 'CRITICAL',
        priority_level: 4,
        action: 'Préparer dossier recouvrement',
        description: 'Documenter non-paiement, consulter avocat, mise en demeure',
        condition: 'Si défaut paiement > 15 jours',
        contact_method: 'LEGAL',
        timing: 'J+15',
        urgency: 'CRITICAL',
        estimated_resolution_days: 30
      },
      {
        type: 'Escalade',
        priority: 'CRITICAL',
        priority_level: 5,
        action: 'Contacteur garant + Mediation',
        description: 'Solliciter garant, initier médiation',
        condition: 'Si défaut paiement > 20 jours',
        contact_method: 'GUARANTOR_MEDIATION',
        timing: 'J+20',
        urgency: 'CRITICAL',
        estimated_resolution_days: 30,
        guarantor_name: tenant.guarantor || 'Garant'
      }
    );
  }

  // Pattern de retards -> alerte supplémentaire
  if (lateCount && lateCount > 3) {
    actions.unshift({
      type: 'Alerte',
      priority: 'HIGH',
      priority_level: 3,
      action: '⚠️ Pattern de retards confirmé',
      description: `${lateCount} retards enregistrés. Comportement systématique.`,
      urgency: 'HIGH',
      flag_account: true,
      note: 'Signaler au manager. Envisager ajustement loyer ou garanties supplémentaires.'
    });
  }

  return actions.sort((a, b) => b.priority_level - a.priority_level);
}

/**
 * Déterminer niveau de risque textuel
 */
export function getRiskLevel(probability) {
  if (probability >= 0.8) return 'LOW';
  if (probability >= 0.6) return 'MEDIUM';
  if (probability >= 0.4) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Obtenir couleur pour affichage
 */
export function getRiskColor(probability) {
  if (probability >= 0.8) return '#4CAF50'; // Vert
  if (probability >= 0.6) return '#8BC34A'; // Vert clair
  if (probability >= 0.4) return '#FFC107'; // Orange
  return '#F44336'; // Rouge
}

/**
 * Obtenir emoji pour niveau de risque
 */
export function getRiskEmoji(probability) {
  if (probability >= 0.8) return '✅';
  if (probability >= 0.6) return '⚠️';
  if (probability >= 0.4) return '🚨';
  return '🔴';
}

/**
 * Formatter message prescriptif pour UI
 */
export function formatPrescriptiveMessage(actions) {
  const critical = actions.filter(a => a.priority === 'CRITICAL');
  const high = actions.filter(a => a.priority === 'HIGH');
  const medium = actions.filter(a => a.priority === 'MEDIUM');

  let message = '';

  if (critical.length > 0) {
    message += '🔴 **CRITIQUE**: ' + critical.map(a => a.action).join(' | ') + '\n\n';
  }

  if (high.length > 0) {
    message += '🟠 **URGENT**: ' + high.map(a => a.action).join(' | ') + '\n\n';
  }

  if (medium.length > 0) {
    message += '🟡 **À SUIVRE**: ' + medium.map(a => a.action).join(' | ') + '\n\n';
  }

  return message;
}

/**
 * Calculer score risque composite (0..100)
 */
export function calculateCompositeRiskScore(probability, lateCount, payRatio, partialRatio) {
  let score = 0;

  // Composante 1: Probabilité inverse (0..30 points)
  score += (1 - probability) * 30;

  // Composante 2: Nombre de retards (0..40 points)
  const lateScore = Math.min(40, lateCount * 8);
  score += lateScore;

  // Composante 3: Pay ratio (0..20 points)
  score += (1 - payRatio) * 20;

  // Composante 4: Partial payments (0..10 points)
  score += partialRatio * 10;

  return Math.round(Math.min(100, score));
}

/**
 * Déterminer action urgente pour affichage prioritaire
 */
export function getUrgentAction(actions) {
  return actions.find(a => a.urgency === 'CRITICAL' || a.urgency === 'HIGH') || null;
}

/**
 * Template SMS/WhatsApp
 */
export const MESSAGE_TEMPLATES = {
  REMINDER_J5: 'Bonjour! Rappel: votre loyer de {{amount}} FNG est prévu le {{due_date}}. Merci de confirmer.',
  REMINDER_J0: 'Merci de nous confirmer la date de paiement de votre loyer: {{amount}} FNG.',
  OVERDUE_J3: 'Attention: votre paiement de {{amount}} FNG était dû le {{due_date}}. Veuillez régulariser dès que possible.',
  PAYMENT_PLAN: 'Nous vous proposons un plan de paiement: {{amount_partial}} FNG/semaine pendant 4 semaines. Confirmez-vous?',
  ESCALATION: 'Nous avons essayé de vous contacter plusieurs fois. Veuillez nous appeler d\'urgence pour régulariser cette situation.',
  GUARANTOR: 'Monsieur/Madame {{guarantor}}, votre garant {{tenant}} n\'a pas payé son loyer depuis {{days}} jours. Pouvez-vous intervenir?'
};

/**
 * Traduire contact_method en affichage
 */
export function getContactMethodLabel(method) {
  const labels = {
    'NONE': 'Aucun',
    'SMS': '📱 SMS',
    'WHATSAPP': '💬 WhatsApp',
    'PHONE': '☎️ Appel',
    'MULTI': '🔄 Multi-canaux',
    'PHONE_VISIT': '🚗 Appel + Visite',
    'LEGAL': '⚖️ Légal',
    'GUARANTOR_MEDIATION': '👥 Garant + Médiation'
  };
  return labels[method] || method;
}

export default {
  getNextActions,
  getRiskLevel,
  getRiskColor,
  getRiskEmoji,
  formatPrescriptiveMessage,
  calculateCompositeRiskScore,
  getUrgentAction,
  MESSAGE_TEMPLATES,
  getContactMethodLabel
};
