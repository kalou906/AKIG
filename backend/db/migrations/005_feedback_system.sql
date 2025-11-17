/**
 * Migration: Feedback and Customer Satisfaction System
 * Version: 001_feedback_system.sql
 * 
 * Crée les tables pour:
 * - Feedback utilisateur (locataires, propriétaires)
 * - Scores de satisfaction
 * - Analyse de sentiment
 * - Catégories feedback
 * - Réponses administrateur
 * - Historique et statistiques
 */

-- ============================================
-- Table: feedback_categories
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_feedback_categories_code ON feedback_categories(code);
CREATE INDEX idx_feedback_categories_active ON feedback_categories(is_active);

-- Insert default categories
INSERT INTO feedback_categories (code, name, description, icon, display_order) VALUES
  ('payment', 'Paiements', 'Concernant les paiements et factures', '💳', 1),
  ('maintenance', 'Maintenance', 'Concernant la maintenance des lieux', '🔧', 2),
  ('tenant_relations', 'Relations Locataires', 'Concernant les relations avec les locataires', '👥', 3),
  ('property', 'Propriété', 'Concernant l''état de la propriété', '🏠', 4),
  ('communication', 'Communication', 'Concernant la communication', '💬', 5),
  ('service', 'Service', 'Concernant le service général', '⭐', 6),
  ('other', 'Autre', 'Autres commentaires', '📝', 7)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Table: feedback_types
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_feedback_types_code ON feedback_types(code);

-- Insert default types
INSERT INTO feedback_types (code, name, description) VALUES
  ('suggestion', 'Suggestion', 'Suggestion d''amélioration'),
  ('complaint', 'Plainte', 'Plainte ou problème'),
  ('compliment', 'Compliment', 'Compliment ou satisfaction'),
  ('question', 'Question', 'Question'),
  ('bug_report', 'Rapport Bug', 'Rapport de bug ou problème technique')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Table: feedback
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id INT REFERENCES agencies(id) ON DELETE SET NULL,
  property_id INT REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id INT REFERENCES tenants(id) ON DELETE SET NULL,
  category_id INT NOT NULL REFERENCES feedback_categories(id),
  type_id INT NOT NULL REFERENCES feedback_types(id),
  
  -- Score et texte
  score INT NOT NULL CHECK (score BETWEEN 0 AND 10),
  title VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  
  -- Sentiment Analysis
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  sentiment_score DECIMAL(3, 2) CHECK (sentiment_score BETWEEN -1 AND 1),
  keywords TEXT[], -- Array of extracted keywords
  
  -- Status
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'acknowledged', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Metadata
  user_agent TEXT,
  ip_address INET,
  locale VARCHAR(10),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  
  CONSTRAINT feedback_score_valid CHECK (score >= 0 AND score <= 10)
);

-- Indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_agency_id ON feedback(agency_id);
CREATE INDEX idx_feedback_property_id ON feedback(property_id);
CREATE INDEX idx_feedback_tenant_id ON feedback(tenant_id);
CREATE INDEX idx_feedback_category_id ON feedback(category_id);
CREATE INDEX idx_feedback_type_id ON feedback(type_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_priority ON feedback(priority);
CREATE INDEX idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX idx_feedback_score ON feedback(score);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_sentiment_score ON feedback(sentiment_score);

-- Full text search index
CREATE INDEX idx_feedback_search ON feedback USING gin(to_tsvector('french', comment));

-- ============================================
-- Table: feedback_responses
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_responses (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  feedback_id INT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  admin_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Response
  response_text TEXT NOT NULL,
  response_type VARCHAR(50) DEFAULT 'reply', -- 'reply', 'acknowledgment', 'resolution'
  
  -- Metadata
  is_public BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_responses_feedback_id ON feedback_responses(feedback_id);
CREATE INDEX idx_feedback_responses_admin_id ON feedback_responses(admin_id);
CREATE INDEX idx_feedback_responses_created_at ON feedback_responses(created_at DESC);

-- ============================================
-- Table: feedback_attachments
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_attachments (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  feedback_id INT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  
  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_attachments_feedback_id ON feedback_attachments(feedback_id);

-- ============================================
-- Table: feedback_ratings
-- ============================================
-- Table pour les évaluations détaillées (NPS, CSAT, CES)
CREATE TABLE IF NOT EXISTS feedback_ratings (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  feedback_id INT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  
  -- Ratings
  nps_score INT CHECK (nps_score BETWEEN 0 AND 10), -- Net Promoter Score
  csat_score INT CHECK (csat_score BETWEEN 1 AND 5), -- Customer Satisfaction Score
  ces_score INT CHECK (ces_score BETWEEN 1 AND 5), -- Customer Effort Score
  quality_score INT CHECK (quality_score BETWEEN 1 AND 5), -- Qualité service
  responsiveness_score INT CHECK (responsiveness_score BETWEEN 1 AND 5), -- Réactivité
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_ratings_feedback_id ON feedback_ratings(feedback_id);
CREATE INDEX idx_feedback_ratings_nps ON feedback_ratings(nps_score);

-- ============================================
-- Table: feedback_sentiment_audit
-- ============================================
-- Audit trail pour les changements de sentiment
CREATE TABLE IF NOT EXISTS feedback_sentiment_audit (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  feedback_id INT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  
  -- Changes
  old_sentiment VARCHAR(20),
  new_sentiment VARCHAR(20),
  old_sentiment_score DECIMAL(3, 2),
  new_sentiment_score DECIMAL(3, 2),
  
  -- Metadata
  reason VARCHAR(255),
  analyzed_by INT REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_sentiment_audit_feedback_id ON feedback_sentiment_audit(feedback_id);

-- ============================================
-- Table: feedback_stats_daily
-- ============================================
-- Cache pour les statistiques quotidiennes
CREATE TABLE IF NOT EXISTS feedback_stats_daily (
  id SERIAL PRIMARY KEY,
  
  -- Date
  date DATE UNIQUE NOT NULL,
  
  -- Counts
  total_feedback INT DEFAULT 0,
  new_feedback INT DEFAULT 0,
  resolved_feedback INT DEFAULT 0,
  
  -- Scores
  avg_score DECIMAL(3, 2),
  avg_nps DECIMAL(3, 2),
  avg_csat DECIMAL(3, 2),
  
  -- Sentiment
  positive_count INT DEFAULT 0,
  neutral_count INT DEFAULT 0,
  negative_count INT DEFAULT 0,
  
  -- Metadata
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_stats_daily_date ON feedback_stats_daily(date DESC);

-- ============================================
-- Table: feedback_tags
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_tags (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  feedback_id INT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  
  -- Tag
  tag_name VARCHAR(100) NOT NULL,
  tag_color VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(feedback_id, tag_name)
);

-- Indexes
CREATE INDEX idx_feedback_tags_feedback_id ON feedback_tags(feedback_id);
CREATE INDEX idx_feedback_tags_name ON feedback_tags(tag_name);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update feedback updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto update updated_at
CREATE TRIGGER trg_feedback_updated_at
BEFORE UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_feedback_updated_at();

-- Function: Calculate sentiment from score
CREATE OR REPLACE FUNCTION calculate_sentiment_from_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score >= 8 THEN
    NEW.sentiment := 'positive';
    NEW.sentiment_score := (NEW.score::DECIMAL / 10.0);
  ELSIF NEW.score >= 5 THEN
    NEW.sentiment := 'neutral';
    NEW.sentiment_score := ((NEW.score::DECIMAL - 5) / 5.0) * 0.5;
  ELSE
    NEW.sentiment := 'negative';
    NEW.sentiment_score := ((NEW.score::DECIMAL - 5) / 5.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calculate sentiment on insert/update
CREATE TRIGGER trg_feedback_sentiment
BEFORE INSERT OR UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION calculate_sentiment_from_score();

-- Function: Get feedback summary for user
CREATE OR REPLACE FUNCTION get_user_feedback_summary(p_user_id INT)
RETURNS TABLE (
  total_feedback INT,
  avg_score DECIMAL,
  positive_count INT,
  neutral_count INT,
  negative_count INT,
  unresolved_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT as total_feedback,
    AVG(f.score)::DECIMAL as avg_score,
    COUNT(CASE WHEN f.sentiment = 'positive' THEN 1 END)::INT as positive_count,
    COUNT(CASE WHEN f.sentiment = 'neutral' THEN 1 END)::INT as neutral_count,
    COUNT(CASE WHEN f.sentiment = 'negative' THEN 1 END)::INT as negative_count,
    COUNT(CASE WHEN f.status != 'closed' THEN 1 END)::INT as unresolved_count
  FROM feedback f
  WHERE f.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get feedback by sentiment
CREATE OR REPLACE FUNCTION get_feedback_by_sentiment(p_sentiment VARCHAR, p_limit INT DEFAULT 20)
RETURNS TABLE (
  feedback_id INT,
  user_id INT,
  title VARCHAR,
  score INT,
  created_at TIMESTAMP,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.user_id,
    f.title,
    f.score,
    f.created_at,
    f.status
  FROM feedback f
  WHERE f.sentiment = p_sentiment
  ORDER BY f.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Update daily stats
CREATE OR REPLACE FUNCTION update_daily_feedback_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  v_total INT;
  v_new INT;
  v_resolved INT;
  v_avg_score DECIMAL;
  v_avg_nps DECIMAL;
  v_avg_csat DECIMAL;
  v_positive INT;
  v_neutral INT;
  v_negative INT;
BEGIN
  -- Calculate stats
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN f.status = 'new' THEN 1 END),
    COUNT(CASE WHEN f.status = 'resolved' THEN 1 END),
    AVG(f.score),
    AVG(fr.nps_score),
    AVG(fr.csat_score),
    COUNT(CASE WHEN f.sentiment = 'positive' THEN 1 END),
    COUNT(CASE WHEN f.sentiment = 'neutral' THEN 1 END),
    COUNT(CASE WHEN f.sentiment = 'negative' THEN 1 END)
  INTO 
    v_total, v_new, v_resolved, v_avg_score, v_avg_nps, v_avg_csat, 
    v_positive, v_neutral, v_negative
  FROM feedback f
  LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
  WHERE DATE(f.created_at) = p_date;

  -- Insert or update stats
  INSERT INTO feedback_stats_daily 
    (date, total_feedback, new_feedback, resolved_feedback, avg_score, avg_nps, avg_csat, positive_count, neutral_count, negative_count)
  VALUES 
    (p_date, COALESCE(v_total, 0), COALESCE(v_new, 0), COALESCE(v_resolved, 0), v_avg_score, v_avg_nps, v_avg_csat, v_positive, v_neutral, v_negative)
  ON CONFLICT (date) DO UPDATE SET
    total_feedback = EXCLUDED.total_feedback,
    new_feedback = EXCLUDED.new_feedback,
    resolved_feedback = EXCLUDED.resolved_feedback,
    avg_score = EXCLUDED.avg_score,
    avg_nps = EXCLUDED.avg_nps,
    avg_csat = EXCLUDED.avg_csat,
    positive_count = EXCLUDED.positive_count,
    neutral_count = EXCLUDED.neutral_count,
    negative_count = EXCLUDED.negative_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- View: Feedback with details
CREATE OR REPLACE VIEW vw_feedback_with_details AS
SELECT 
  f.id,
  f.user_id,
  u.email as user_email,
  u.first_name,
  u.last_name,
  f.agency_id,
  f.property_id,
  f.tenant_id,
  f.category_id,
  fc.name as category_name,
  f.type_id,
  ft.name as type_name,
  f.score,
  f.title,
  f.comment,
  f.sentiment,
  f.sentiment_score,
  f.status,
  f.priority,
  COUNT(DISTINCT fr.id) as response_count,
  COUNT(DISTINCT fa.id) as attachment_count,
  f.created_at,
  f.updated_at,
  f.resolved_at
FROM feedback f
LEFT JOIN users u ON f.user_id = u.id
LEFT JOIN feedback_categories fc ON f.category_id = fc.id
LEFT JOIN feedback_types ft ON f.type_id = ft.id
LEFT JOIN feedback_responses fr ON f.id = fr.feedback_id
LEFT JOIN feedback_attachments fa ON f.id = fa.feedback_id
GROUP BY f.id, u.id, fc.id, ft.id;

-- View: Unresolved feedback
CREATE OR REPLACE VIEW vw_unresolved_feedback AS
SELECT * FROM vw_feedback_with_details
WHERE status != 'closed'
ORDER BY priority DESC, created_at ASC;

-- View: Feedback by agency
CREATE OR REPLACE VIEW vw_feedback_by_agency AS
SELECT 
  f.agency_id,
  a.name as agency_name,
  COUNT(*) as total_feedback,
  AVG(f.score) as avg_score,
  COUNT(CASE WHEN f.sentiment = 'positive' THEN 1 END) as positive_count,
  COUNT(CASE WHEN f.sentiment = 'neutral' THEN 1 END) as neutral_count,
  COUNT(CASE WHEN f.sentiment = 'negative' THEN 1 END) as negative_count,
  COUNT(CASE WHEN f.status != 'closed' THEN 1 END) as unresolved_count
FROM feedback f
LEFT JOIN agencies a ON f.agency_id = a.id
WHERE f.agency_id IS NOT NULL
GROUP BY f.agency_id, a.id;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Allow users to read their own feedback
GRANT SELECT ON feedback TO authenticated_users;
GRANT SELECT ON feedback_responses TO authenticated_users;
GRANT SELECT ON vw_feedback_with_details TO authenticated_users;

-- Allow admins full access
GRANT ALL ON feedback TO admin_role;
GRANT ALL ON feedback_responses TO admin_role;
GRANT ALL ON feedback_attachments TO admin_role;
GRANT ALL ON feedback_ratings TO admin_role;
GRANT ALL ON feedback_categories TO admin_role;
GRANT ALL ON feedback_types TO admin_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE feedback IS 'Stockage des retours utilisateur avec analyse de sentiment';
COMMENT ON COLUMN feedback.score IS 'Score de 0-10, utilisé pour calculer le sentiment';
COMMENT ON COLUMN feedback.sentiment IS 'Sentiment analysé (positive, neutral, negative)';
COMMENT ON COLUMN feedback.sentiment_score IS 'Score de sentiment entre -1 et 1';
COMMENT ON COLUMN feedback.status IS 'Statut: new, acknowledged, resolved, closed';
COMMENT ON COLUMN feedback.priority IS 'Priorité: low, normal, high, critical';
COMMENT ON TABLE feedback_ratings IS 'Évaluations détaillées (NPS, CSAT, CES)';
COMMENT ON TABLE feedback_stats_daily IS 'Cache des statistiques quotidiennes pour performance';
