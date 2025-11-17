-- Migration: Création de la table penalties
CREATE TABLE IF NOT EXISTS penalties (
  id SERIAL PRIMARY KEY,
  locataire_id INTEGER NOT NULL REFERENCES tenants(id),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_penalties_locataire_id ON penalties(locataire_id);
