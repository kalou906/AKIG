-- Migration: Ajout des jobs de facturation (table jobs_billing)
CREATE TABLE IF NOT EXISTS jobs_billing (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  month VARCHAR(7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  result JSONB
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_billing_name_month ON jobs_billing(job_name, month);
