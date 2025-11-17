/**
 * Schéma PostgreSQL pour le système de préavis sophistiqué
 * Exécuter: psql -d akig -f schema-notice-system.sql
 */

-- ============================================================================
-- TABLES DE BASE: CONTRATS ET PARAMÈTRES LÉGAUX
-- ============================================================================

CREATE TABLE IF NOT EXISTS legal_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_duration_days INTEGER NOT NULL,
  count_business_days_only BOOLEAN DEFAULT FALSE,
  month_end_proration BOOLEAN DEFAULT FALSE,
  early_termination_penalty NUMERIC,
  rent_increase_limit NUMERIC,
  suspend_on_litigation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  property_id UUID NOT NULL,
  property_manager_id UUID NOT NULL,
  
  -- Dates clés
  start_date DATE NOT NULL,
  end_date DATE,
  tacit_renewal_days INTEGER,
  
  -- Paramètres
  bail_type VARCHAR(50) NOT NULL CHECK (bail_type IN ('residential', 'commercial', 'mixed')),
  monthly_rent NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  deposit_amount NUMERIC,
  
  -- Préférences communication
  preferred_language VARCHAR(20) DEFAULT 'fr',
  preferred_channels TEXT[] DEFAULT ARRAY['email', 'sms'],
  
  -- Clauses spéciales
  legal_parameters_id UUID REFERENCES legal_parameters(id),
  special_clauses TEXT[],
  allowable_notice_types VARCHAR(50)[] DEFAULT ARRAY['termination', 'rent_increase'],
  
  signed_document_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_contracts_property_id ON contracts(property_id);
CREATE INDEX idx_contracts_manager_id ON contracts(property_manager_id);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);

-- ============================================================================
-- PRÉAVIS ET AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  
  -- Type et motif
  type VARCHAR(50) NOT NULL CHECK (type IN ('termination', 'rent_increase', 'transfer', 'works')),
  motif TEXT,
  detailed_reason TEXT,
  
  -- Dates et calculs
  emission_date TIMESTAMP NOT NULL,
  effective_date TIMESTAMP NOT NULL,
  last_withdrawal_date TIMESTAMP,
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'received', 'validated', 'contested', 'mediation', 'annulled', 'expired', 'closed')
  ),
  
  -- Parties
  initiated_by VARCHAR(50) NOT NULL CHECK (initiated_by IN ('tenant', 'owner', 'manager', 'system')),
  responsible_agent_id UUID,
  
  -- Communication
  communication_channels TEXT[] DEFAULT ARRAY['email'],
  sent_at TIMESTAMP,
  received_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Signature numérique
  signature_hash VARCHAR(255),
  
  -- Contestation
  contested_at TIMESTAMP,
  contestation_reason TEXT,
  litigation_status VARCHAR(50) CHECK (litigation_status IN ('open', 'mediation', 'resolved', 'escalated')),
  
  -- Médiation
  mediation_started_at TIMESTAMP,
  mediator_id UUID,
  mediation_proposal TEXT,
  mediation_resolved_at TIMESTAMP,
  mediation_agreement TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notices_contract_id ON notices(contract_id);
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_notices_effective_date ON notices(effective_date);
CREATE INDEX idx_notices_initiated_by ON notices(initiated_by);

CREATE TABLE IF NOT EXISTS notice_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action VARCHAR(100) NOT NULL,
  actor_id UUID,
  details JSONB,
  
  -- Métadonnées
  ip_address INET,
  user_agent TEXT,
  
  CONSTRAINT audit_immutable CHECK (timestamp <= CURRENT_TIMESTAMP)
);

CREATE INDEX idx_notice_audit_log_notice_id ON notice_audit_log(notice_id);
CREATE INDEX idx_notice_audit_log_timestamp ON notice_audit_log(timestamp DESC);

CREATE TABLE IF NOT EXISTS notice_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  content_hash VARCHAR(255), -- SHA-256
  storage_url TEXT,
  
  required_for_closure BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notice_documents_notice_id ON notice_documents(notice_id);

-- ============================================================================
-- PARTIES PRENANTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  
  -- Communication
  preferred_language VARCHAR(20) DEFAULT 'fr',
  preferred_channels TEXT[] DEFAULT ARRAY['email', 'sms'],
  literacy_level VARCHAR(20) DEFAULT 'medium' CHECK (literacy_level IN ('low', 'medium', 'high')),
  
  -- Localisation
  timezone VARCHAR(50) DEFAULT 'UTC',
  region VARCHAR(100),
  
  -- IA
  departure_risk_score NUMERIC DEFAULT 0,
  last_contact_date TIMESTAMP,
  communication_frequency VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_departure_risk_score ON tenants(departure_risk_score DESC);

CREATE TABLE IF NOT EXISTS property_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  
  -- Permissions
  permissions TEXT[],
  assigned_properties UUID[],
  supported_languages TEXT[] DEFAULT ARRAY['fr', 'en'],
  
  -- Performance
  avg_notice_resolution_time_ms INTEGER,
  sla_compliance_rate NUMERIC,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_managers_email ON property_managers(email);

-- ============================================================================
-- COMPTABILITÉ DE SORTIE
-- ============================================================================

CREATE TABLE IF NOT EXISTS exit_accounting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  
  -- Sommes individuelles
  remaining_rent NUMERIC DEFAULT 0,
  penalties NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  inspection_fees NUMERIC DEFAULT 0,
  works_cost NUMERIC DEFAULT 0,
  
  -- Totaux calculés
  total_debit NUMERIC GENERATED ALWAYS AS (
    remaining_rent + penalties + inspection_fees + works_cost
  ) STORED,
  total_credit NUMERIC DEFAULT 0, -- Restitution
  balance_due NUMERIC GENERATED ALWAYS AS (
    total_debit - total_credit
  ) STORED,
  
  -- Échéancier
  payment_plan_status VARCHAR(50) CHECK (
    payment_plan_status IN ('proposed', 'accepted', 'partially_paid', 'paid')
  ),
  
  -- Dates
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deposit_return_deadline DATE,
  
  -- Documents
  invoice_url TEXT,
  receipt_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exit_accounting_notice_id ON exit_accounting(notice_id);
CREATE INDEX idx_exit_accounting_contract_id ON exit_accounting(contract_id);
CREATE INDEX idx_exit_accounting_balance_due ON exit_accounting(balance_due);

CREATE TABLE IF NOT EXISTS payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exit_accounting_id UUID NOT NULL REFERENCES exit_accounting(id) ON DELETE CASCADE,
  
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  paid_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_plan_installments_exit_accounting_id ON payment_plan_installments(exit_accounting_id);
CREATE INDEX idx_payment_plan_installments_due_date ON payment_plan_installments(due_date);

-- ============================================================================
-- ALERTES IA ET SCORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  type VARCHAR(50) NOT NULL CHECK (
    type IN ('deadline', 'departure_risk', 'litigation', 'payment', 'anomaly')
  ),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('P1', 'P2', 'P3')),
  entity_id UUID NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_required TEXT,
  assigned_to UUID,
  due_date TIMESTAMP,
  
  -- Explication IA
  reasoning JSONB,
  
  status VARCHAR(50) DEFAULT 'open' CHECK (
    status IN ('open', 'acknowledged', 'resolved')
  ),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_ai_alerts_entity_id ON ai_alerts(entity_id);
CREATE INDEX idx_ai_alerts_status ON ai_alerts(status);
CREATE INDEX idx_ai_alerts_severity ON ai_alerts(severity);
CREATE INDEX idx_ai_alerts_due_date ON ai_alerts(due_date);

CREATE TABLE IF NOT EXISTS departure_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  
  risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- Signaux
  signals JSONB, -- Array of {signal, severity, evidence}
  
  -- Recommandations
  retention_recommendations JSONB,
  
  -- Timing prédictif
  predicted_departure_start DATE,
  predicted_departure_end DATE,
  prediction_confidence NUMERIC,
  
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departure_risk_assessments_tenant_id ON departure_risk_assessments(tenant_id);
CREATE INDEX idx_departure_risk_assessments_risk_score ON departure_risk_assessments(risk_score DESC);

-- ============================================================================
-- COMMUNICATIONS MULTI-CANAUX
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  notice_type VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  language VARCHAR(20) NOT NULL,
  
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[], -- JSON array
  simplified_version TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(notice_type, channel, language)
);

CREATE TABLE IF NOT EXISTS communication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id),
  
  -- Routing
  channel VARCHAR(50) NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_address VARCHAR(255) NOT NULL,
  
  -- Contenu
  template_id UUID REFERENCES message_templates(id),
  message_content TEXT NOT NULL,
  
  -- Statut
  status VARCHAR(50) DEFAULT 'queued' CHECK (
    status IN ('queued', 'sending', 'sent', 'delivered', 'read', 'failed')
  ),
  
  -- Tracking
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  last_error TEXT,
  
  -- Accusé
  acknowledged_at TIMESTAMP,
  acknowledgement_type VARCHAR(50),
  acknowledgement_proof TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communication_events_notice_id ON communication_events(notice_id);
CREATE INDEX idx_communication_events_status ON communication_events(status);
CREATE INDEX idx_communication_events_channel ON communication_events(channel);
CREATE INDEX idx_communication_events_read_at ON communication_events(read_at);

CREATE TABLE IF NOT EXISTS message_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id),
  
  -- Configuration
  trigger_event VARCHAR(100) NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  
  -- Sélection
  recipient_ids UUID[] NOT NULL,
  channel_strategy VARCHAR(50) DEFAULT 'preferred',
  
  -- Statut
  status VARCHAR(50) DEFAULT 'scheduled',
  
  -- Métriques
  success_rate NUMERIC,
  deliverability_rate NUMERIC,
  avg_read_time_seconds INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_batches_notice_id ON message_batches(notice_id);
CREATE INDEX idx_message_batches_scheduled_for ON message_batches(scheduled_for);

-- ============================================================================
-- WORKFLOWS ET SLA
-- ============================================================================

CREATE TABLE IF NOT EXISTS notice_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL UNIQUE REFERENCES notices(id),
  
  current_step INTEGER DEFAULT 0,
  
  hold_reasons TEXT[],
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES notice_workflows(id) ON DELETE CASCADE,
  
  sequence INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  
  parameters JSONB,
  result JSONB,
  
  assigned_to UUID,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);

CREATE TABLE IF NOT EXISTS sla_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES notice_workflows(id) ON DELETE CASCADE,
  
  checkpoint VARCHAR(100) NOT NULL,
  due_date TIMESTAMP NOT NULL,
  escalation_level SMALLINT,
  status VARCHAR(50) DEFAULT 'on_track',
  breached_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sla_checkpoints_workflow_id ON sla_checkpoints(workflow_id);
CREATE INDEX idx_sla_checkpoints_status ON sla_checkpoints(status);

-- ============================================================================
-- MONITORING ET REPORTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Données agrégées
  metrics JSONB NOT NULL,
  
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  notices_reviewed INTEGER,
  sampling_rate NUMERIC,
  legal_compliance NUMERIC,
  documentation_completeness NUMERIC,
  audit_trail_integrity BOOLEAN,
  data_security_status VARCHAR(50),
  
  findings JSONB,
  
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by UUID
);

-- ============================================================================
-- VUES POUR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW v_notices_with_sla_status AS
SELECT 
  n.id,
  n.contract_id,
  n.status,
  n.effective_date,
  n.created_at,
  CASE 
    WHEN n.effective_date <= CURRENT_DATE - INTERVAL '3 days' THEN 'BREACHED'
    WHEN n.effective_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'AT_RISK'
    ELSE 'ON_TRACK'
  END as sla_status,
  (n.effective_date - CURRENT_DATE)::INTEGER as days_until_effective
FROM notices n
WHERE n.status != 'closed';

CREATE OR REPLACE VIEW v_exit_accounting_summary AS
SELECT 
  ea.contract_id,
  ea.balance_due,
  ea.payment_plan_status,
  COUNT(ppi.id) as installment_count,
  COALESCE(SUM(ppi.amount), 0) as total_installments,
  COALESCE(COUNT(CASE WHEN ppi.paid_at IS NOT NULL THEN 1 END), 0) as paid_installments
FROM exit_accounting ea
LEFT JOIN payment_plan_installments ppi ON ea.id = ppi.exit_accounting_id
GROUP BY ea.id, ea.contract_id, ea.balance_due, ea.payment_plan_status;

-- ============================================================================
-- FONCTIONS UTILES
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_notice_effective_date(
  emission_date TIMESTAMP,
  notice_duration_days INTEGER,
  count_business_days_only BOOLEAN,
  month_end_proration BOOLEAN
) RETURNS TIMESTAMP AS $$
DECLARE
  result_date TIMESTAMP;
  day_count INTEGER := 0;
  current_date TIMESTAMP;
BEGIN
  current_date := emission_date;
  
  WHILE day_count < notice_duration_days LOOP
    current_date := current_date + INTERVAL '1 day';
    
    -- Skip weekends if business days only
    IF NOT count_business_days_only OR 
       (EXTRACT(DOW FROM current_date) NOT IN (0, 6)) THEN
      day_count := day_count + 1;
    END IF;
  END LOOP;
  
  -- Month-end proration
  IF month_end_proration AND EXTRACT(DAY FROM current_date) < 15 THEN
    current_date := DATE_TRUNC('month', current_date) + INTERVAL '1 month' - INTERVAL '1 day';
  END IF;
  
  RETURN current_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PERMISSIONS ET SÉCURITÉ
-- ============================================================================

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_accounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_events ENABLE ROW LEVEL SECURITY;

-- Exemple: Property managers voient que leurs propriétés
CREATE POLICY notices_manager_policy ON notices
  FOR SELECT USING (
    responsible_agent_id = current_user_id() OR 
    EXISTS (
      SELECT 1 FROM contracts c 
      WHERE c.id = notices.contract_id 
      AND c.property_manager_id = current_user_id()
    )
  );
