CREATE TABLE IF NOT EXISTS proprietaires (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100), prenom VARCHAR(100),
  date_naissance DATE, lieu_naissance VARCHAR(100),
  cni VARCHAR(50), adresse TEXT, telephone VARCHAR(20), email VARCHAR(100),
  statut VARCHAR(20) DEFAULT 'ACTIF'
);

CREATE TABLE IF NOT EXISTS contrats_gerance (
  id SERIAL PRIMARY KEY,
  proprietaire_id INTEGER REFERENCES proprietaires(id) ON DELETE CASCADE,
  adresse_bien TEXT, usage_bien VARCHAR(20) CHECK (usage_bien IN ('Habitation','Bureau','Magasin')),
  loyer_global_mensuel NUMERIC(12,2),
  periodicite_paiement VARCHAR(20) CHECK (periodicite_paiement IN ('Trimestriel','Semestriel','Annuel')),
  taux_commission NUMERIC(5,2) DEFAULT 15.00,
  date_debut DATE, date_fin DATE,
  statut VARCHAR(20) DEFAULT 'ACTIF'
);

CREATE TABLE IF NOT EXISTS reversements (
  id SERIAL PRIMARY KEY,
  contrat_gerance_id INTEGER REFERENCES contrats_gerance(id) ON DELETE CASCADE,
  proprietaire_id INTEGER REFERENCES proprietaires(id) ON DELETE CASCADE,
  periode_debut DATE, periode_fin DATE,
  montant_percu NUMERIC(12,2), commission NUMERIC(12,2), montant_reverse NUMERIC(12,2),
  date_reversement DATE,
  statut VARCHAR(20) DEFAULT 'EN_ATTENTE'
);

CREATE INDEX IF NOT EXISTS idx_reversements_proprio ON reversements(proprietaire_id);
