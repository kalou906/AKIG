-- Migration: Création de la table tenants_solvency
CREATE TABLE IF NOT EXISTS tenants_solvency (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  solvency_score INTEGER NOT NULL,
  details JSONB,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
