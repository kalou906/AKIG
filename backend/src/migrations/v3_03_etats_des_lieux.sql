CREATE TABLE IF NOT EXISTS etats_des_lieux (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('ENTREE','SORTIE')),
  furnished BOOLEAN NOT NULL,
  performed_on DATE NOT NULL,
  degradation_score INTEGER DEFAULT 0,
  caution_retained BOOLEAN DEFAULT FALSE,
  retained_amount NUMERIC(12,2) DEFAULT 0,
  pdf_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS details_edl (
  id SERIAL PRIMARY KEY,
  edl_id INTEGER REFERENCES etats_des_lieux(id) ON DELETE CASCADE,
  category VARCHAR(100),
  designation VARCHAR(255),
  qty INTEGER,
  state VARCHAR(20) CHECK (state IN ('bon','mauvais','non_present')),
  comments TEXT,
  photos TEXT[]
);
