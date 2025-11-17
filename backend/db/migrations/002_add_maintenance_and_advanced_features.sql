-- Migration: 002_add_maintenance_and_advanced_features.sql
-- Description: Ajoute les tables pour la maintenance, les appels d'offre et autres fonctionnalités avancées

-- Table pour les demandes de maintenance
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  type TEXT NOT NULL CHECK(type IN ('preventive', 'corrective', 'emergency')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  requested_date DATE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_property ON maintenance(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance(priority);

-- Table pour les appels d'offre de maintenance
CREATE TABLE IF NOT EXISTS maintenance_quotes (
  id SERIAL PRIMARY KEY,
  maintenance_id INTEGER NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  contractor_email TEXT,
  contractor_phone TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  validity_date DATE,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_maintenance ON maintenance_quotes(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON maintenance_quotes(status);

-- Ajouter des colonnes aux tables existantes si nécessaire
ALTER TABLE payment_reports ADD COLUMN IF NOT EXISTS notes TEXT;

-- Table pour les documents (contrats, factures)
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('contract', 'invoice', 'receipt', 'quote', 'report', 'other')),
  reference_number TEXT UNIQUE,
  related_entity_type TEXT CHECK(related_entity_type IN ('property', 'contract', 'maintenance', 'payment')),
  related_entity_id INTEGER,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(related_entity_type, related_entity_id);

-- Table pour les tâches/reminders
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK(task_type IN ('reminder', 'follow_up', 'maintenance', 'payment_reminder', 'other')),
  assigned_to INTEGER REFERENCES users(id),
  related_entity_type TEXT,
  related_entity_id INTEGER,
  due_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completion_date TIMESTAMP,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Table pour les communications (appels, emails, SMS)
CREATE TABLE IF NOT EXISTS communications (
  id SERIAL PRIMARY KEY,
  communication_type TEXT NOT NULL CHECK(communication_type IN ('email', 'sms', 'call', 'letter', 'in_person')),
  subject TEXT,
  content TEXT NOT NULL,
  recipient_id INTEGER REFERENCES users(id),
  related_entity_type TEXT,
  related_entity_id INTEGER,
  status TEXT DEFAULT 'sent' CHECK(status IN ('draft', 'sent', 'failed', 'read')),
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communications_recipient ON communications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);

-- Table pour les notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('payment_due', 'payment_received', 'arrears', 'maintenance', 'document', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  related_entity_type TEXT,
  related_entity_id INTEGER,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- Vue pour les statistiques rapides
CREATE OR REPLACE VIEW property_statistics AS
SELECT 
  p.id,
  p.name,
  COUNT(u.id) as total_units,
  COUNT(CASE WHEN u.status = 'rented' THEN 1 END) as rented_units,
  ROUND(100.0 * COUNT(CASE WHEN u.status = 'rented' THEN 1 END) / NULLIF(COUNT(u.id), 0), 2) as occupancy_rate,
  COALESCE(SUM(u.rent_amount), 0) as expected_monthly_revenue,
  COALESCE(SUM(CASE WHEN u.status = 'rented' THEN u.rent_amount ELSE 0 END), 0) as actual_monthly_revenue,
  COUNT(DISTINCT c.tenant_id) as active_tenants
FROM properties p
LEFT JOIN units u ON p.id = u.property_id
LEFT JOIN contracts c ON u.id = c.unit_id AND c.status = 'active'
GROUP BY p.id, p.name;

-- Vue pour les arriérés
CREATE OR REPLACE VIEW arrears_summary AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT pr.contract_id) as affected_contracts,
  COALESCE(SUM(pr.balance), 0) as total_arrears,
  MAX(EXTRACT(DAY FROM NOW() - pr.due_date)) as oldest_days_overdue,
  COUNT(CASE WHEN pr.status = 'overdue' THEN 1 END) as overdue_count
FROM users t
LEFT JOIN payment_reports pr ON t.id = pr.tenant_id AND pr.balance > 0
WHERE t.role = 'tenant'
GROUP BY t.id, t.name;

COMMIT;
