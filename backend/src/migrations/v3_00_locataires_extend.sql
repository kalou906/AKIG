-- Étendre tenants selon Référence Locataire (File 1)
ALTER TABLE IF EXISTS tenants
  ADD COLUMN IF NOT EXISTS family_status VARCHAR(20) CHECK (family_status IN ('celibataire','marie')),
  ADD COLUMN IF NOT EXISTS children_total INTEGER CHECK (children_total >= 0),
  ADD COLUMN IF NOT EXISTS children_in_apartment INTEGER CHECK (children_in_apartment >= 0),
  ADD COLUMN IF NOT EXISTS id_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS id_document_path VARCHAR(255),
  ADD COLUMN IF NOT EXISTS current_address TEXT,
  ADD COLUMN IF NOT EXISTS employer VARCHAR(100),
  ADD COLUMN IF NOT EXISTS net_monthly_income NUMERIC(12,2) CHECK (net_monthly_income >= 0),
  ADD COLUMN IF NOT EXISTS employer_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS work_location TEXT,
  ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guarantor_relation VARCHAR(50),
  ADD COLUMN IF NOT EXISTS guarantor_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS guarantor_job VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact1_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact1_relation VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact1_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact2_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact2_relation VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact2_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS desired_type VARCHAR(20) CHECK (desired_type IN ('appartement','villa','studio')),
  ADD COLUMN IF NOT EXISTS persons_count INTEGER CHECK (persons_count >= 0),
  ADD COLUMN IF NOT EXISTS comp_rooms INTEGER CHECK (comp_rooms >= 0),
  ADD COLUMN IF NOT EXISTS comp_living BOOLEAN,
  ADD COLUMN IF NOT EXISTS comp_kitchen BOOLEAN,
  ADD COLUMN IF NOT EXISTS comp_showers INTEGER CHECK (comp_showers >= 0);

-- Unicité de la pièce d'identité si fournie
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenants_id_number ON tenants (id_number) WHERE id_number IS NOT NULL;

-- Numéro guinéen
ALTER TABLE IF EXISTS tenants
  ADD CONSTRAINT IF NOT EXISTS chk_tenant_phone_gn
  CHECK (phone ~ '^(\+224|00224)?[62345678][0-9]{7}$');
