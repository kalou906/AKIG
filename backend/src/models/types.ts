/**
 * Types et schémas TypeScript pour le système de préavis sophistiqué
 * Couverture: Contrats, préavis, parties prenantes, comptabilité, alertes IA
 */

// ============================================================================
// TYPES DE CONTRATS ET PARAMÈTRES LÉGAUX
// ============================================================================

export type BailType = 'residential' | 'commercial' | 'mixed';
export type NoticeType = 'termination' | 'rent_increase' | 'transfer' | 'works';
export type NoticeStatus = 
  | 'draft'
  | 'sent'
  | 'received'
  | 'validated'
  | 'contested'
  | 'mediation'
  | 'annulled'
  | 'expired'
  | 'closed';
export type CommunicationChannel = 'sms' | 'whatsapp' | 'email' | 'letter';
export type LitigationStatus = 'open' | 'mediation' | 'resolved' | 'escalated';

export interface LegalParameters {
  // Durée de préavis en jours calendaires
  noticeDurationDays: number;
  
  // Règles calendaires
  countBusinessDaysOnly: boolean;
  monthEndProration: boolean;
  
  // Clauses spécifiques
  earlyTerminationPenalty?: number; // % du loyer mensuel
  rentIncreaseLimit?: number; // % max autorisé
  
  // Suspend obligations si litige actif
  suspendOnLitigation: boolean;
}

export interface Contract {
  id: string;
  tenantId: string;
  propertyId: string;
  propertyManagerId: string;
  
  // Dates clés
  startDate: Date;
  endDate?: Date;
  tacitRenewalDays?: number; // Délai pour résiliation si reconduction tacite
  
  // Paramètres
  bailType: BailType;
  monthlyRent: number;
  currency: string; // EUR, XOF, etc.
  depositAmount: number;
  
  // Préférences communication
  preferredLanguage: 'fr' | 'en' | 'soussou' | 'peulh' | 'malinke';
  preferredChannels: CommunicationChannel[];
  
  // Règles légales
  legalParameters: LegalParameters;
  
  // Clauses spéciales
  specialClauses?: string[];
  allowableNoticeTypes: NoticeType[];
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  signedDocumentUrl?: string;
}

// ============================================================================
// PRÉAVIS ET TIMELINE
// ============================================================================

export interface NoticeAuditEntry {
  timestamp: Date;
  action: string; // 'created', 'sent', 'read', 'acknowledged', 'contested', 'mediation', 'closed'
  actor: string; // userId
  details?: Record<string, any>;
  metadata?: {
    channel?: CommunicationChannel;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface NoticeLegalCalculation {
  // Dates calculées
  emissionDate: Date;
  effectiveDate: Date;
  lastWithdrawalDate: Date; // J-1 avant effet
  
  // Justification légale
  legalBasis: string; // Chapitre/article
  daysUntilEffective: number;
  businessDaysUntilEffective: number;
  
  // Alertes de conformité
  warnings: string[];
  isWithinLegalDeadline: boolean;
}

export interface NoticeDocument {
  filename: string;
  mimeType: string;
  contentHash: string; // SHA-256 pour traçabilité
  uploadedAt: Date;
  requiredForClosure: boolean;
}

export interface Notice {
  id: string;
  contractId: string;
  
  // Type et motif
  type: NoticeType;
  motif: string;
  detailedReason?: string;
  
  // Dates et calculs légaux
  emissionDate: Date;
  effectiveDate: Date;
  legalCalculation: NoticeLegalCalculation;
  
  // Statut
  status: NoticeStatus;
  statusHistory: { status: NoticeStatus; date: Date; reason?: string }[];
  
  // Parties concernées
  initiatedBy: 'tenant' | 'owner' | 'manager' | 'system';
  responsibleAgentId?: string;
  
  // Communication et preuve
  communicationChannels: CommunicationChannel[];
  sentAt?: Date;
  receivedAt?: Date;
  acknowledgedAt?: Date;
  readAt?: Date;
  
  // Documents
  documents: NoticeDocument[];
  signatureHash?: string; // Signature numérique
  
  // Contestation et litige
  contestationDetails?: {
    contestedAt: Date;
    reason: string;
    supportingDocuments: NoticeDocument[];
  };
  litigationStatus?: LitigationStatus;
  mediation?: {
    startedAt: Date;
    mediatorId: string;
    proposal?: string;
    resolvedAt?: Date;
    agreement?: string;
  };
  
  // Audit immuable
  auditLog: NoticeAuditEntry[];
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PARTIES PRENANTES ET PRÉFÉRENCES
// ============================================================================

export type LiteracyLevel = 'low' | 'medium' | 'high';

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Communication
  preferredLanguage: string;
  preferredChannels: CommunicationChannel[];
  literacyLevel: LiteracyLevel;
  
  // Localisation
  timezone: string;
  region: string; // Code région ou zone géographique
  
  // Signaux d'intention de départ (IA)
  departureRiskScore?: number; // 0-100
  lastContactDate?: Date;
  communicationFrequency?: 'high' | 'normal' | 'low';
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Permissions et responsabilités
  permissions: string[];
  assignedProperties: string[];
  supportedLanguages: string[];
  
  // Performance
  avgNoticeResolutionTime?: number; // ms
  slaComplianceRate?: number; // %
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// COMPTABILITÉ DE SORTIE
// ============================================================================

export interface ExitAccountingItem {
  description: string;
  type: 'rent' | 'penalty' | 'deposit' | 'works' | 'inspection' | 'adjustment' | 'remission';
  amount: number;
  date: Date;
  reference?: string;
  documentation?: string;
}

export interface ExitAccounting {
  id: string;
  noticeId: string;
  contractId: string;
  
  // Sommes
  remainingRent: number;
  penalties: number;
  depositAmount: number;
  inspectionFees: number;
  worksCost: number;
  
  // Ajustements
  adjustments: ExitAccountingItem[];
  remissions: ExitAccountingItem[];
  
  // Solde final
  totalDebit: number; // Total à récupérer
  totalCredit: number; // Restitution (dépôt - débits)
  balanceDue: number; // Positif = tenant doit; négatif = on restitue
  
  // Paiement
  paymentPlan?: {
    status: 'proposed' | 'accepted' | 'partially_paid' | 'paid';
    installments: {
      dueDate: Date;
      amount: number;
      paidAt?: Date;
    }[];
  };
  
  // Dates clés
  calculatedAt: Date;
  depositReturnDeadline?: Date; // Légalement ≤ 30 jours si pas litige
  
  // Documents
  invoiceUrl?: string;
  receiptUrl?: string;
  
  // Audit
  auditLog: NoticeAuditEntry[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ALERTES IA ET SCORING
// ============================================================================

export interface AIRiskSignal {
  signal: string; // 'recurring_delays', 'low_communication', 'high_local_rent', 'unresolved_incident'
  severity: 'low' | 'medium' | 'high';
  evidence: any;
  timestamp: Date;
}

export interface DepartureRiskAssessment {
  tenantId: string;
  contractId: string;
  riskScore: number; // 0-100, >70 = à risque
  signals: AIRiskSignal[];
  
  // Recommandations
  retentionRecommendations: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }[];
  
  // Timing
  predictedDepartureWindow?: {
    startDate: Date;
    endDate: Date;
    confidence: number; // 0-100
  };
  
  calculatedAt: Date;
}

export interface AIAlert {
  id: string;
  type: 'deadline' | 'departure_risk' | 'litigation' | 'payment' | 'anomaly';
  severity: 'P1' | 'P2' | 'P3';
  entityId: string; // noticeId ou contractId
  title: string;
  description: string;
  actionRequired: string;
  assignedTo?: string;
  dueDate?: Date;
  
  // Explication IA
  reasoning: {
    rule: string;
    factors: Record<string, any>;
    confidence: number;
  };
  
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

// ============================================================================
// COMMUNICATIONS MULTI-CANAUX
// ============================================================================

export interface MessageTemplate {
  id: string;
  name: string;
  noticeType: NoticeType;
  channel: CommunicationChannel;
  language: string;
  
  // Contenu avec variables
  subject?: string; // Email
  body: string;
  variables: string[]; // ['contractId', 'tenantName', 'effectiveDate']
  
  // Simplification pour littératie faible
  simplifiedVersion?: string;
  pictograms?: string[]; // URLs ou identifiants
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationEvent {
  id: string;
  noticeId: string;
  
  // Routing
  channel: CommunicationChannel;
  recipientId: string;
  recipientAddress: string;
  
  // Contenu
  templateId: string;
  messageContent: string;
  attachments?: {
    filename: string;
    mimeType: string;
    url: string;
  }[];
  
  // Statut
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  statusHistory: { status: string; date: Date; reason?: string }[];
  
  // Tracking
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  clickedLinks?: { url: string; clickedAt: Date }[];
  
  // Retry
  retryCount: number;
  nextRetryAt?: Date;
  lastError?: string;
  
  // Acknowledgement
  acknowledgedAt?: Date;
  acknowledgementProof?: {
    type: string; // 'signature', 'sms_confirmation', 'email_reply'
    proof: string;
  };
  
  createdAt: Date;
}

export interface MessageBatch {
  id: string;
  noticeId: string;
  
  // Configuration
  triggerEvent: 'emission' | 'j_minus_30' | 'j_minus_15' | 'j_minus_7' | 'j_minus_3' | 'j_plus_1' | 'j_plus_3';
  scheduledFor: Date;
  
  // Sélection
  recipientIds: string[];
  channelStrategy: 'preferred' | 'adaptive' | 'fallback';
  
  // Exécution
  messages: CommunicationEvent[];
  status: 'scheduled' | 'executing' | 'completed' | 'partial_failure';
  
  // Métriques
  successRate: number;
  deliverabilityRate: number;
  averageReadTime?: number;
  
  createdAt: Date;
}

// ============================================================================
// WORKFLOWS ET SLA
// ============================================================================

export interface WorkflowStep {
  id: string;
  sequence: number;
  action: string; // 'send_notice', 'schedule_inspection', 'calculate_balance', 'mediate'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  
  // Timing
  dueDate?: Date;
  completedAt?: Date;
  
  // Détails
  parameters?: Record<string, any>;
  result?: Record<string, any>;
  
  // Audit
  assignedTo?: string;
  notes?: string;
}

export interface NoticeWorkflow {
  noticeId: string;
  
  // Étapes du workflow
  steps: WorkflowStep[];
  currentStep: number;
  
  // Jalons SLA
  slaCheckpoints: {
    checkpoint: string;
    dueDate: Date;
    escalationLevel: 0 | 1 | 2; // 0 = agent, 1 = manager, 2 = director
    status: 'on_track' | 'at_risk' | 'breached';
    breachedAt?: Date;
  }[];
  
  // Exceptions
  holdReasons?: string[]; // 'pending_documents', 'litigation', 'maintenance'
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DASHBOARDS ET REPORTING
// ============================================================================

export interface DashboardMetrics {
  period: { startDate: Date; endDate: Date };
  
  // Préavis
  totalNotices: number;
  noticesByStatus: Record<NoticeStatus, number>;
  averageResolutionTime: number;
  
  // Délais
  onTimeRate: number; // % respectant SLA
  atRiskNotices: number;
  breachedSLAs: number;
  
  // Litiges
  openLitigations: number;
  resolutionRate: number;
  mediationSuccessRate: number;
  
  // Sortie comptable
  totalBalanceDue: number;
  collectionRate: number;
  averageCollectionTime: number;
  
  // IA
  departureRiskTenants: number;
  retentionActionsExecuted: number;
  
  // Communication
  deliverabilityByChannel: Record<CommunicationChannel, number>;
  readRateByChannel: Record<CommunicationChannel, number>;
  
  // Sites
  topPerformingSites?: string[];
  atRiskSites?: string[];
}

export interface AuditReport {
  id: string;
  period: { startDate: Date; endDate: Date };
  
  // Couverture
  noticesReviewed: number;
  samplingRate: number;
  
  // Vérifications
  legalCompliance: number; // %
  documentationCompleteness: number; // %
  auditTrailIntegrity: boolean;
  dataSecurityStatus: 'compliant' | 'needs_review' | 'non_compliant';
  
  // Résultats
  findings: {
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
  }[];
  
  generatedAt: Date;
  generatedBy: string;
}
