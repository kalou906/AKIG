CREATE TABLE IF NOT EXISTS factures (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(30) UNIQUE,
  date_facture DATE DEFAULT CURRENT_DATE,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  contrat_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  total NUMERIC(12,2) DEFAULT 0,
  caution NUMERIC(12,2) DEFAULT 0,
  net_a_payer NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facture_lignes (
  id SERIAL PRIMARY KEY,
  facture_id INTEGER REFERENCES factures(id) ON DELETE CASCADE,
  ligne_no INTEGER,
  designation TEXT,
  prix_unitaire NUMERIC(12,2),
  quantite INTEGER,
  total_ligne NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS recus (
  id SERIAL PRIMARY KEY,
  contrat_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  proprietaire_nom VARCHAR(255), proprietaire_tel VARCHAR(50),
  montant NUMERIC(12,2), mode_paiement VARCHAR(50), reference VARCHAR(50),
  objet VARCHAR(255) DEFAULT 'RECU DE PAYEMENT',
  date_recu DATE DEFAULT CURRENT_DATE,
  pdf_path VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_factures_contrat ON factures(contrat_id);
