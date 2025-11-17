-- Étendre contracts pour couvrir les articles du contrat (File 3)
ALTER TABLE IF NOT EXISTS contracts
  ADD COLUMN IF NOT EXISTS reference VARCHAR(50),
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(30) CHECK (property_type IN ('appartement','maison','local_commercial')),
  ADD COLUMN IF NOT EXISTS rooms INTEGER,
  ADD COLUMN IF NOT EXISTS living_rooms INTEGER,
  ADD COLUMN IF NOT EXISTS showers INTEGER,
  ADD COLUMN IF NOT EXISTS kitchen BOOLEAN,
  ADD COLUMN IF NOT EXISTS kitchen_equipped BOOLEAN,
  ADD COLUMN IF NOT EXISTS parking_spots INTEGER,
  ADD COLUMN IF NOT EXISTS others TEXT,
  ADD COLUMN IF NOT EXISTS full_address TEXT,
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS commune VARCHAR(100),
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS usage VARCHAR(20) CHECK (usage IN ('residentiel','commercial')),
  ADD COLUMN IF NOT EXISTS commercial_activity TEXT,
  ADD COLUMN IF NOT EXISTS entry_inspection_date DATE,
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS renewal_type VARCHAR(50) DEFAULT 'Annuelle tacite',
  ADD COLUMN IF NOT EXISTS agency_commission NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS payment_periodicity VARCHAR(20) CHECK (payment_periodicity IN ('trimestriel','semestriel','annuel')),
  ADD COLUMN IF NOT EXISTS signature_date TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS ux_contracts_reference ON contracts(reference);
