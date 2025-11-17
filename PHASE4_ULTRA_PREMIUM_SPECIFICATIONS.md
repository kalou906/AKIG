# 🚀 PHASE 4 - ULTRA-PREMIUM COMPLETE SPECIFICATIONS

**Objectif:** Transformer AKIG en logiciel PREMIUM EXHAUSTIF où chaque bouton ouvre une fiche COMPLÈTE avec tous les champs organisés en onglets.

**Status:** 🟢 SPECIFICATION PHASE  
**Estimated Implementation:** 3-4 weeks full team  
**Complexity:** ENTERPRISE GRADE  

---

## 📋 TABLE DES MATIÈRES

1. [Module 1: Locataire](#-module-1--locataire)
2. [Module 2: Propriétaire](#-module-2--propriétaire)
3. [Module 3: Bien Immobilier](#-module-3--bien-immobilier)
4. [Module 4: Contrat](#-module-4--contrat)
5. [Module 5: Paiement](#-module-5--paiement)
6. [Module 6: Charges & Fiscalité](#-module-6--charges--fiscalité)
7. [Module 7: Communication](#-module-7--communication)
8. [Module 8: Maintenance](#-module-8--maintenance)
9. [Module 9: Rapports](#-module-9--rapports)
10. [Architecture & Database](#architecture--database)
11. [Implementation Roadmap](#implementation-roadmap)

---

## 👤 MODULE 1 – LOCATAIRE

### 📄 FICHE LOCATAIRE - Structure Complète

**Tab 1: Identité & Infos Personnelles**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| Nom | Text | ✅ | Max 100 chars |
| Prénom | Text | ✅ | Max 100 chars |
| Sexe | Select | ❌ | M/F/Autre |
| Date de naissance | Date | ❌ | Format DD/MM/YYYY |
| Lieu de naissance | Text | ❌ | Pays, ville |
| Nationalité | Select | ❌ | Dropdown avec pays |
| Photo | Image | ❌ | JPG/PNG, max 5MB |
| Titre | Text | ❌ | Ex: "Mr.", "Mme" |
| Marital Status | Select | ❌ | Célibataire/Marié/Divorcé/Veuf |
| Nombre d'enfants | Number | ❌ | Pour évaluation risque |

**DB Schema:**
```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  birth_date DATE,
  birth_place VARCHAR(200),
  nationality VARCHAR(100),
  photo_url TEXT,
  title VARCHAR(10),
  marital_status VARCHAR(50),
  number_of_children INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

**Tab 2: Coordonnées**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| Téléphone Principal | Phone | ✅ | Format +224XXXXXXXXX |
| Téléphone Secondaire | Phone | ❌ | Alternative contact |
| Email Principal | Email | ✅ | Validation email |
| Email Secondaire | Email | ❌ | Alternative email |
| Adresse Actuelle | Text | ✅ | Adresse complète |
| Quartier/Zone | Text | ❌ | Pour localisation |
| Adresse Précédente | Text | ❌ | Si applicable |
| Durée à l'adresse | Text | ❌ | Ex: "2 ans" |
| Code Postal | Text | ❌ | Si applicable |
| Ville | Text | ✅ | |

**DB Schema:**
```sql
CREATE TABLE tenant_contacts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  phone_primary VARCHAR(20) NOT NULL,
  phone_secondary VARCHAR(20),
  email_primary VARCHAR(100) NOT NULL,
  email_secondary VARCHAR(100),
  address_current TEXT NOT NULL,
  quartier TEXT,
  address_previous TEXT,
  duration_at_address VARCHAR(100),
  postal_code VARCHAR(20),
  city VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

**Tab 3: Documents**

| Document | Type | Obligatoire | Notes |
|----------|------|-------------|-------|
| CNI/Passport | PDF/Image | ✅ | Upload file, OCR extract |
| Numéro CNI | Text | ✅ | Auto-populate from OCR |
| Attestation de travail | PDF | ❌ | Proof of employment |
| Fiche de paie (dernière) | PDF | ❌ | Latest payslip |
| Fiche de paie (-1 mois) | PDF | ❌ | Previous month |
| Fiche de paie (-2 mois) | PDF | ❌ | 2 months back |
| Justificatif de domicile | PDF/Image | ✅ | EDF, water bill, etc |
| Contrats résiliation antérieurs | PDF | ❌ | Past contracts |
| Référence bancaire | PDF | ❌ | Bank details |
| Autres documents | PDF | ❌ | Custom uploads |

**Features:**
- OCR scanning on CNI (extract: numero, date expiration, foto)
- Document versioning (store all versions)
- Automatic expiration alerts (CNI expiration)
- Document preview in-app
- Download/Archive old versions

**DB Schema:**
```sql
CREATE TABLE tenant_documents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  expires_at DATE,
  ocr_data JSONB, -- {numero: "...", expiration: "...", ...}
  is_current BOOLEAN DEFAULT TRUE,
  version_number INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  notes TEXT
);
```

---

**Tab 4: Garant**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| Nom Garant | Text | ❌ | Full name |
| Prénom Garant | Text | ❌ | First name |
| Relation | Select | ❌ | Parent/Sibling/Friend/Other |
| Téléphone | Phone | ❌ | Contact |
| Email | Email | ❌ | Contact |
| Adresse | Text | ❌ | Full address |
| Profession | Text | ❌ | Job title |
| Revenu mensuel | Currency | ❌ | For qualification |
| CNI/Passport | Image | ❌ | Copy of ID |
| Attestion emploi | PDF | ❌ | Work attestation |
| Dernier fiche de paie | PDF | ❌ | Latest payslip |
| Accord de garantie | PDF | ✅ | Signed guarantee |
| Montant de garantie | Currency | ❌ | If limited |

**DB Schema:**
```sql
CREATE TABLE tenant_guarantors (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  relationship VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  profession VARCHAR(100),
  monthly_income DECIMAL(15,2),
  cni_url TEXT,
  work_attestation_url TEXT,
  payslip_url TEXT,
  guarantee_agreement_url TEXT,
  guarantee_amount DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

**Tab 5: Informations Financières**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| Revenu mensuel | Currency | ✅ | Calculated score |
| Statut emploi | Select | ❌ | CDI/CDD/Freelance/Retraité |
| Type de revenu | Select | ❌ | Salaire/Commerce/Agriculture/Autre |
| Moyen de paiement préféré | Multi-Select | ✅ | Cash, Virement, MTN, Orange, Wave |
| Compte bancaire (IBAN) | Text | ❌ | For transfers |
| Nom banque | Text | ❌ | Bank name |
| Compte Mobile Money | Text | ❌ | Phone number for MM |
| Score de risque | Auto-Calculate | ✅ | Low/Medium/High |
| Historique de crédit | Text | ❌ | Notes on credit |
| Dettes antérieures | Currency | ❌ | Any outstanding |

**Scoring Algorithm:**
```javascript
calculateTenantRiskScore() {
  let score = 0; // 0-100 scale
  
  // Income check (max 40 points)
  if (monthlyIncome >= loyer * 3) score += 40;
  else if (monthlyIncome >= loyer * 2) score += 30;
  else if (monthlyIncome >= loyer * 1.5) score += 20;
  else score += 10;
  
  // Employment check (max 25 points)
  if (status === 'CDI') score += 25;
  else if (status === 'CDD') score += 15;
  else if (status === 'Freelance') score += 10;
  
  // Payment history (max 20 points)
  if (pastPaymentDelays === 0) score += 20;
  else if (pastPaymentDelays === 1) score += 10;
  else score += 0;
  
  // Guarantor strength (max 15 points)
  if (guarantor && guarantor.income >= loyer * 3) score += 15;
  else if (guarantor) score += 10;
  
  // Documents check (max 10 points)
  if (hasAllDocuments) score += 10;
  else if (hasPayslips) score += 5;
  
  return {
    score: Math.min(100, score),
    level: score >= 80 ? 'LOW_RISK' : score >= 50 ? 'MEDIUM_RISK' : 'HIGH_RISK'
  };
}
```

**DB Schema:**
```sql
CREATE TABLE tenant_financial (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  monthly_income DECIMAL(15,2) NOT NULL,
  employment_status VARCHAR(50),
  income_type VARCHAR(100),
  preferred_payment_methods TEXT[], -- {cash, transfer, mtn, orange, wave}
  iban VARCHAR(50),
  bank_name VARCHAR(100),
  mobile_money_phone VARCHAR(20),
  risk_score INTEGER, -- 0-100
  risk_level VARCHAR(20), -- LOW/MEDIUM/HIGH
  credit_notes TEXT,
  outstanding_debts DECIMAL(15,2),
  calculated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

**Tab 6: Historique**

Display (Read-Only):
- Timeline of all contracts (past & current)
- All payments received (with dates)
- Payment delays/arrears
- Relances sent (automatic + manual)
- Contract terminations
- Maintenance issues reported
- Notes/interactions

**Features:**
- Filterable by year/date range
- Export timeline as PDF
- Visual payment calendar (on-time vs late)
- Automatic risk alerts (if late payments detected)

**DB Schema:**
```sql
CREATE TABLE tenant_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(100), -- contract_signed, payment_made, delay, relance, etc
  contract_id INTEGER REFERENCES contracts(id),
  payment_id INTEGER REFERENCES payments(id),
  description TEXT,
  event_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- extra data
);
```

---

**Tab 7: Notes Internes**

Text area for:
- Risk assessment notes
- Observations about tenant behavior
- Communication preferences
- Special arrangements
- Alerts/warnings
- Follow-up reminders

Auto-generated alerts:
- ⚠️ CNI expires soon
- ⚠️ No recent payslips
- ⚠️ Multiple late payments
- ⚠️ Guarantor info outdated

**DB Schema:**
```sql
CREATE TABLE tenant_notes (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  is_alert BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20), -- LOW/MEDIUM/HIGH
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### API Endpoints - Locataire

```
POST   /api/tenants                    - Create new tenant
GET    /api/tenants                    - List all tenants (searchable, filterable)
GET    /api/tenants/:id                - Get full tenant profile
PUT    /api/tenants/:id                - Update tenant info
DELETE /api/tenants/:id                - Delete tenant (soft)
PATCH  /api/tenants/:id/risk-score     - Recalculate risk score
POST   /api/tenants/:id/documents      - Upload document
GET    /api/tenants/:id/documents      - List tenant documents
DELETE /api/tenants/:id/documents/:docId - Archive document
POST   /api/tenants/:id/guarantor      - Add/update guarantor
GET    /api/tenants/:id/history        - Get tenant history timeline
POST   /api/tenants/:id/notes          - Add internal note
GET    /api/tenants/search/:query      - Full-text search
GET    /api/tenants/export/pdf/:id     - Export profile as PDF
```

---

## 👥 MODULE 2 – PROPRIÉTAIRE

### 📄 FICHE PROPRIÉTAIRE - Structure Complète

**Tab 1: Identité**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| Type | Select | ✅ | Personne physique / SCI / SARL |
| Nom | Text | ✅ | Last name or company name |
| Prénom | Text | ❌ | First name (if physical) |
| Raison Sociale | Text | ❌ | Legal name (if company) |
| Photo/Logo | Image | ❌ | JPG/PNG max 5MB |
| Date de naissance | Date | ❌ | If physical person |
| Lieu de naissance | Text | ❌ | City/Country |
| Nationalité | Select | ❌ | Country |
| Titre | Text | ❌ | Mr./Mrs. |

**DB Schema:**
```sql
CREATE TABLE owners (
  id SERIAL PRIMARY KEY,
  owner_type VARCHAR(50) NOT NULL, -- physical, sci, sarl
  first_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  legal_name VARCHAR(255),
  logo_url TEXT,
  birth_date DATE,
  birth_place VARCHAR(200),
  nationality VARCHAR(100),
  title VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

**Tab 2: Coordonnées**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| Téléphone Principal | Phone | ✅ |
| Téléphone Secondaire | Phone | ❌ |
| Email Principal | Email | ✅ |
| Email Secondaire | Email | ❌ |
| Adresse | Text | ✅ |
| Quartier | Text | ❌ |
| Code Postal | Text | ❌ |
| Ville | Text | ✅ |
| Pays | Select | ✅ |
| Adresse de facturation | Text | ❌ |

---

**Tab 3: Informations Fiscales**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| NIF | Text | ✅ | Tax ID number |
| Numéro STAT | Text | ❌ | If company |
| Statut juridique | Select | ✅ | Individual/SCI/SARL/EIRL |
| Régime fiscal | Select | ✅ | Réel/Micro/Forfait |
| Régime de TVA | Select | ❌ | Normal/Simplifié/Franchise |
| Représentant légal | Text | ❌ | If company |
| Numéro représentant | Phone | ❌ | Contact person |
| Email représentant | Email | ❌ | Contact email |

---

**Tab 4: Biens Associés**

Display list:
- Property name
- Address
- Status (Loué/Libre/Maintenance/Vente)
- Current tenant (if leased)
- Monthly rent
- Contract expiration
- Action buttons (View, Edit, Generate Report)

**Count Summary:**
- Total properties
- Occupied
- Vacant
- Total monthly revenue

---

**Tab 5: Historique Financier**

Dashboard showing:
- Total revenue generated (lifetime)
- Revenue by year (bar chart)
- Average monthly revenue
- Outstanding payments
- Paid vs received
- Tax reports
- Balance due to owner

---

**Tab 6: Documents**

- NIF document
- Statut juridique
- Actes de propriété
- Contrats avec sociétés immobilières
- Correspondence with tax authority

---

**Tab 7: Notes**

Internal notes about:
- Payment reliability
- Communication preferences
- Special arrangements
- Risk alerts

---

### API Endpoints - Propriétaire

```
POST   /api/owners                     - Create new owner
GET    /api/owners                     - List owners
GET    /api/owners/:id                 - Get full owner profile
PUT    /api/owners/:id                 - Update owner
DELETE /api/owners/:id                 - Delete (soft)
GET    /api/owners/:id/properties      - List owner's properties
GET    /api/owners/:id/revenue         - Revenue statistics
GET    /api/owners/:id/reports         - Tax reports
POST   /api/owners/:id/documents       - Upload document
GET    /api/owners/:id/export-pdf      - Export as PDF
```

---

## 🏠 MODULE 3 – BIEN IMMOBILIER

### 📄 FICHE BIEN - Structure Complète

**Tab 1: Informations Générales**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| Référence bien | Text | ✅ | Unique identifier |
| Adresse | Text | ✅ | Full address |
| Quartier/Zone | Text | ✅ | District |
| Code Postal | Text | ❌ | |
| Ville | Text | ✅ | |
| GPS Longitude | Number | ❌ | For map |
| GPS Latitude | Number | ❌ | For map |
| Type | Select | ✅ | Appartement/Maison/Studio/Terrain/Garage |
| Surface m² | Number | ✅ | Total area |
| Nombre pièces | Number | ✅ | Rooms count |
| Nombre chambres | Number | ✅ | Bedrooms |
| Nombre salles d'eau | Number | ✅ | Bathrooms |
| Étage | Text | ❌ | Floor level |
| Meublé/Non meublé | Select | ✅ | Furnished status |
| État du bien | Select | ✅ | Excellent/Bon/Acceptable/Rénovation |
| Année construction | Year | ❌ | Build year |

**DB Schema:**
```sql
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  reference_code VARCHAR(100) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  quartier VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  city VARCHAR(100) NOT NULL,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  property_type VARCHAR(50) NOT NULL,
  surface_sqm DECIMAL(10, 2) NOT NULL,
  rooms_total INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor_level VARCHAR(50),
  furnished BOOLEAN,
  condition VARCHAR(50),
  construction_year YEAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

**Tab 2: Caractéristiques & Équipements**

Checkboxes:
- Cuisine
- Climatisation
- Chauffage
- Eau chaude
- Électricité
- Ascenseur
- Parking
- Jardin
- Terrasse
- Balcon
- Alarme
- Internet/Wifi
- Câble TV
- Buanderie
- Douche (baignoire)
- Autres (custom)

**DB Schema:**
```sql
CREATE TABLE property_features (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  feature_name VARCHAR(100),
  is_present BOOLEAN DEFAULT FALSE,
  notes TEXT
);
```

---

**Tab 3: Photos & Média**

Upload capability:
- Multiple photos
- Videos (30-60 sec tours)
- 3D virtual tour (Matterport link)
- Floor plan (PDF/Image)
- Drone footage (optional)

Gallery view with:
- Thumbnail previews
- Lightbox viewer
- Upload/Delete buttons
- Drag-to-reorder
- Set as primary photo

**DB Schema:**
```sql
CREATE TABLE property_media (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  media_type VARCHAR(50), -- photo, video, tour, floorplan
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(255),
  description TEXT,
  duration_seconds INTEGER, -- for videos
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

**Tab 4: Statut & Disponibilité**

| Champ | Type | Options |
|-------|------|---------|
| Statut | Select | Disponible / Loué / Maintenance / Vente / Occupé propriétaire |
| Date disponibilité | Date | When available |
| Prix location | Currency | Monthly rent |
| Caution requise | Currency | Security deposit |
| Délai de préavis | Number | Days notice |
| Disponibilité immédiate | Boolean | Available now? |
| Visite autorisée | Boolean | Can schedule visits |

---

**Tab 5: Documents**

Upload capability:
- Certificat de propriété
- Acte d'achat
- Plans de l'immeuble
- Diagnostic technique (DPE)
- Diagnostic termites
- Contrats d'assurance
- Certificat conformité électrique
- Diagnostics amiante/plomb
- Contrats de maintenance
- Factures travaux récents

---

**Tab 6: Historique Locatif**

Read-only timeline:
- Contract 1: Tenant A, 2020-2022, Amount, Status
- Contract 2: Tenant B, 2022-2023, Amount, Status
- Previous tenants
- Contracts active
- Terminations

---

**Tab 7: Maintenance & Interventions**

List of:
- Work performed (date, type, cost)
- Maintenance schedule
- Upcoming interventions
- Technicians used
- Photos before/after
- Costs tracking

---

### API Endpoints - Bien Immobilier

```
POST   /api/properties                 - Create new property
GET    /api/properties                 - List all (filterable, searchable)
GET    /api/properties/:id             - Get full property profile
PUT    /api/properties/:id             - Update property
DELETE /api/properties/:id             - Delete (soft)
PATCH  /api/properties/:id/status      - Change status
POST   /api/properties/:id/media       - Upload media
GET    /api/properties/:id/media       - Get media gallery
DELETE /api/properties/:id/media/:mediaId - Delete media
GET    /api/properties/:id/contracts   - Get rental history
GET    /api/properties/:id/maintenance - Get maintenance history
GET    /api/properties/available       - List available properties
GET    /api/properties/export-pdf/:id  - Export property sheet
```

---

## 📑 MODULE 4 – CONTRAT

### 📄 FICHE CONTRAT - Structure Complète

**Tab 1: Références & Généralités**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| Numéro de contrat | Text | ✅ |
| Date de signature | Date | ✅ |
| Type de contrat | Select | ✅ |
| Type meublé | Select | ✅ |
| Durée (mois) | Number | ✅ |
| Date début | Date | ✅ |
| Date fin | Date | Auto-calc |
| Renouvellement auto | Boolean | ❌ |
| Statut | Select | ✅ |

---

**Tab 2: Parties**

Display:
- Propriétaire (name, contact, signature date)
- Locataire (name, contact, signature date)
- Garant (if any) (name, contact, signature date)
- Représentant légal (if company)

---

**Tab 3: Conditions Financières**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| Loyer mensuel | Currency | ✅ |
| Charges mensuelles | Currency | ❌ |
| Dépôt de garantie | Currency | ✅ |
| Indexation annuelle | Select | ✅ |
| Date indexation | Date | ❌ |
| Pourcentage indexation | Percent | ❌ |
| Loyer indexé | Currency | Auto-calc |
| Autres frais | Currency | ❌ |

---

**Tab 4: Documents**

Upload capability:
- Contrat PDF signé
- État des lieux entrée
- État des lieux sortie
- Quittance modèle
- Accord de renouvellement

---

**Tab 5: Historique**

Timeline of:
- Contract signature
- Modifications made
- Indexations applied
- Renewals
- Terminations/Resiliations
- Disputes
- Notes

---

### API Endpoints - Contrat

```
POST   /api/contracts                  - Create new contract
GET    /api/contracts                  - List contracts
GET    /api/contracts/:id              - Get contract details
PUT    /api/contracts/:id              - Update contract
DELETE /api/contracts/:id              - Delete (soft)
PATCH  /api/contracts/:id/status       - Change status
POST   /api/contracts/:id/renew        - Renew contract
POST   /api/contracts/:id/terminate    - Terminate contract
GET    /api/contracts/:id/pdf          - Generate PDF
POST   /api/contracts/:id/index        - Apply indexation
```

---

## 💰 MODULE 5 – PAIEMENT

### 📄 FICHE PAIEMENT - Structure Complète

**Tab 1: Références & Montants**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| Numéro quittance | Text | ✅ |
| Contrat associé | Select | ✅ |
| Locataire | Display | |
| Propriétaire | Display | |
| Loyer (montant) | Currency | ✅ |
| Charges (montant) | Currency | ❌ |
| Autres frais | Currency | ❌ |
| Montant total | Currency | Auto-calc |
| Montant payé | Currency | ✅ |
| Montant restant | Currency | Auto-calc |

---

**Tab 2: Détails de Paiement**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| Mode de paiement | Select | ✅ |
| Date de paiement | Date | ✅ |
| Période concernée | Date range | ✅ |
| Statut | Select | ✅ |
| Nombre jours retard | Number | Auto-calc |
| Notes paiement | Text | ❌ |
| Référence externe | Text | ❌ |

Mode de paiement options:
- Cash (espèces)
- Virement bancaire
- Orange Money
- MTN Money
- Wave
- Chèque
- Autre

---

**Tab 3: Documents**

Upload capability:
- Quittance PDF
- Preuve de paiement (SMS, relevé, photo)
- Justificatif virement
- Reçu cash (photo)
- Accord de régularisation (if applicable)

---

**Tab 4: Historique & Relances**

Display:
- Payment received date
- Confirmation sent date
- Delays tracked
- Relances sent (automatic + manual)
- Status changes
- Dispute history

---

### API Endpoints - Paiement

```
POST   /api/payments                   - Create new payment
GET    /api/payments                   - List payments (filterable)
GET    /api/payments/:id               - Get payment details
PUT    /api/payments/:id               - Update payment
DELETE /api/payments/:id               - Delete (soft)
PATCH  /api/payments/:id/status        - Update status
GET    /api/payments/by-contract/:contractId - Get contract payments
GET    /api/payments/overdue           - List overdue payments
POST   /api/payments/:id/relance       - Send reminder
GET    /api/payments/export-csv        - Export all payments
POST   /api/payments/batch-import      - Bulk import from Excel
```

---

## ⚡ MODULE 6 – CHARGES & FISCALITÉ

### 📄 FICHE CHARGES - Structure Complète

**Tab 1: Charges Mensuelles**

| Type Charge | Obligatoire | Notes |
|-------------|-------------|-------|
| Eau | ❌ | Per unit or shared |
| Électricité | ❌ | Per unit or shared |
| Gaz | ❌ | If applicable |
| Copropriété | ❌ | Common fees |
| Entretien/Maintenance | ❌ | Maintenance budget |
| Ordures/Propreté | ❌ | Garbage collection |
| Assurance | ❌ | Insurance |
| Syndic | ❌ | Management fees |
| Autres charges | ❌ | Custom charges |

For each:
- Montant
- Répartition (per tenant, per square meter, shared)
- Récupérable ou non
- Justificatif (PDF upload)

---

**Tab 2: Répartition Charges**

Logic for splitting:
- Equal among tenants
- Per square meter
- Shared/non-shared
- Custom formula

Example calculation:
```
Electricity bill: 50,000 FG
Tenant A (30m²): 50,000 × (30/100) = 15,000 FG
Tenant B (70m²): 50,000 × (70/100) = 35,000 FG
```

---

**Tab 3: Régularisation Annuelle**

| Field | Type |
|-------|------|
| Année de régularisation | Year |
| Charges prévisionnelles | Currency |
| Charges réelles | Currency |
| Montant dû par locataire | Currency |
| Montant payé par locataire | Currency |
| Solde à régulariser | Currency |
| Date régularisation | Date |
| Justificatif | PDF |

---

**Tab 4: Fiscalité & Impôts**

Display (from integrations):
- Revenus fonciers (annual)
- Déductions allowed
- Annual tax obligation
- Tax filing status
- Correspondence with tax authority

Generates:
- Annual tax report
- Tax certificate
- Auditor reports

---

### API Endpoints - Charges

```
POST   /api/charges                    - Create charge record
GET    /api/charges                    - List charges
GET    /api/charges/by-property/:id    - Get property charges
PUT    /api/charges/:id                - Update charge
POST   /api/charges/:id/justify        - Upload justification
GET    /api/charges/:id/distribution  - Calculate distribution
POST   /api/charges/annual-settlement  - Process annual settlement
GET    /api/fiscal/annual-report       - Generate tax report
```

---

## 📞 MODULE 7 – COMMUNICATION

### 📄 FICHE COMMUNICATION - Structure Complète

**Tab 1: Channels Configuration**

Setup for each channel:
- Email (SMTP configured)
- SMS (Twilio configured)
- WhatsApp (Twilio configured)
- Push notifications
- In-app messages

Per channel settings:
- Active/Inactive toggle
- Phone numbers/emails
- Rate limits
- Opt-out management

---

**Tab 2: Message Templates**

Pre-built templates:
- Quittance (Receipt)
- Relance impayé 1 (1st reminder)
- Relance impayé 2 (2nd reminder)
- Relance impayé 3 (Final notice)
- Félicitations bon payeur (Good payer)
- Visite planifiée (Scheduled visit)
- Maintenance notification
- Newcomer welcome
- Contract renewal reminder
- Maintenance issue update

Template builder:
- Variables: {{tenant_name}}, {{amount}}, {{date}}, {{property}}, {{contract_number}}
- Preview before sending
- Test send option

---

**Tab 3: Campagnes Automatiques**

Trigger-based campaigns:
- Payment received → Send receipt
- Payment overdue (7d) → Send 1st reminder
- Payment overdue (14d) → Send 2nd reminder
- Payment overdue (30d) → Send final notice
- Payment on-time 3 months → Send thank you
- Maintenance scheduled → Notify tenant
- Contract expiring soon → Renewal reminder

Settings for each:
- Enable/disable
- Delay (days)
- Channel (Email/SMS/WhatsApp)
- Template used
- Recipients

---

**Tab 4: Historique Communications**

Log display:
- All messages sent/received
- Date, time, recipient
- Channel used (Email/SMS/WhatsApp)
- Content snippet
- Status (sent, delivered, read, failed)
- Read timestamps
- Click tracking

Filters:
- By tenant
- By date range
- By channel
- By template
- By status

---

**Tab 5: Analytics**

Dashboard:
- Total messages sent (by month)
- Delivery rate (%)
- Open rate (email/SMS)
- Click rate
- Bounce rate
- Failed messages
- Cost (SMS/WhatsApp)

Chart: Messages by type/channel over time

---

### API Endpoints - Communication

```
POST   /api/communications/send        - Send message
POST   /api/communications/send-batch  - Send bulk messages
GET    /api/communications/history     - Get message history
POST   /api/communications/template    - Create/update template
GET    /api/communications/templates   - List templates
POST   /api/communications/campaign    - Create automation
PATCH  /api/communications/campaign/:id - Update automation
DELETE /api/communications/campaign/:id - Delete automation
GET    /api/communications/analytics   - Get stats dashboard
POST   /api/communications/opt-out     - Add to opt-out list
```

---

## 🛠️ MODULE 8 – MAINTENANCE

### 📄 FICHE MAINTENANCE - Structure Complète

**Tab 1: Création Ticket**

| Champ | Type | Obligatoire |
|-------|------|-------------|
| Numéro ticket | Text | Auto-gen |
| Bien concerné | Select | ✅ |
| Locataire concerné | Display | |
| Catégorie | Select | ✅ |
| Priorité | Select | ✅ |
| Titre problème | Text | ✅ |
| Description détaillée | Text | ✅ |
| Photos | Image | ❌ |
| Vidéo | Video | ❌ |
| Problème signalé (date) | Date | ✅ |
| Urgence | Boolean | ❌ |

Categories:
- Plomberie
- Électricité
- Chauffage/Climatisation
- Peinture/Murs
- Toiture/Fenêtres
- Portes/Serrures
- Équipements
- Autres

Priority:
- Urgent (same day)
- High (within 24h)
- Medium (within 3 days)
- Low (routine)

---

**Tab 2: Assignation & Suivi**

| Champ | Type |
|-------|------|
| Technicien assigné | Select |
| Date prévue intervention | Date |
| Heure prévue | Time |
| Coût estimé | Currency |
| Statut | Select |
| Date réelle intervention | Date |
| Durée réelle | Number |
| Coût réel | Currency |
| Notes technicien | Text |

Status options:
- Ouvert
- En cours
- Complété
- Annulé
- En attente (parts, landlord approval)

---

**Tab 3: Travaux & Factures**

Work order details:
- Travail effectué (description)
- Photos avant
- Photos après
- Matériaux utilisés
- Coûts détaillés
- Facture (PDF upload)
- Signature tenant (proof)

---

**Tab 4: Historique**

Timeline of all maintenance:
- Date
- Category
- Issue
- Solution
- Technicien
- Cost
- Duration

---

### API Endpoints - Maintenance

```
POST   /api/maintenance/ticket         - Create ticket
GET    /api/maintenance/tickets        - List all tickets
GET    /api/maintenance/tickets/:id    - Get ticket details
PUT    /api/maintenance/tickets/:id    - Update ticket
DELETE /api/maintenance/tickets/:id    - Delete ticket (soft)
PATCH  /api/maintenance/tickets/:id/status - Update status
POST   /api/maintenance/tickets/:id/assign - Assign to technician
POST   /api/maintenance/tickets/:id/complete - Complete ticket
POST   /api/maintenance/workorder      - Create work order
GET    /api/maintenance/workorders/:id - Get work order details
POST   /api/maintenance/workorders/:id/photos - Upload photos
GET    /api/maintenance/history/:propertyId - Get property history
GET    /api/maintenance/costs          - Cost analytics
```

---

## 📊 MODULE 9 – RAPPORTS

### 📄 RAPPORTS - Complete Reporting Suite

**Tab 1: Rapports Financiers**

Available reports:
1. **Cashflow Mensuel**
   - Loyers reçus
   - Charges payées
   - Maintenance coûts
   - Net balance
   - Pie chart breakdown

2. **Cashflow Annuel**
   - Year-over-year comparison
   - Monthly breakdown
   - Trend analysis
   - Year-to-date summary

3. **Revenus par Propriétaire**
   - List of owners
   - Properties count
   - Total revenue
   - Average rent
   - Occupancy rate

4. **Tax Report**
   - Total income
   - Deductible expenses
   - Net taxable income
   - Recommended filing
   - PDF export for accountant

---

**Tab 2: Rapports Locatifs**

Available reports:
1. **Taux d'Occupation**
   - Occupied vs vacant
   - By property
   - By owner
   - Historical trend
   - Forecast

2. **Impayés & Retards**
   - Total overdue amount
   - Number of delinquent tenants
   - Days overdue breakdown
   - Collection status
   - Risk classification

3. **Contrats Actifs**
   - List with details
   - Expiration dates
   - Renewals pending
   - Risk alerts

---

**Tab 3: Rapports Agents**

Available reports:
1. **Performance Agent**
   - Contracts signed (count)
   - Total value of contracts
   - Commission earned
   - Collection rate
   - Tenant satisfaction

2. **Collections**
   - Payments collected
   - On-time rate (%)
   - Late payments count
   - Recovery actions

3. **Maintenance Performance**
   - Tickets resolved
   - Average resolution time
   - Cost per ticket
   - Tenant satisfaction

---

**Tab 4: Export Options**

Format options:
- PDF (formatted report)
- Excel (data + charts)
- CSV (data only, no formatting)
- Interactive Dashboard (web)

Customization:
- Date range picker
- Filter by owner/property/tenant
- Select metrics to include
- Custom branding (logo, colors)
- Schedule recurring reports (email)

---

**Tab 5: Dashboard Analytics**

Real-time KPI display:
- Total revenue (this month)
- Outstanding amount
- Payment rate (%)
- Occupancy rate (%)
- Average rent
- Maintenance costs
- Number of tickets
- Top performing agents

Charts:
- Revenue trend (6 months)
- Occupancy timeline
- Payment status distribution
- Maintenance cost breakdown

---

### API Endpoints - Rapports

```
GET    /api/reports/cashflow-monthly   - Get monthly cashflow
GET    /api/reports/cashflow-annual    - Get annual cashflow
GET    /api/reports/revenue-by-owner   - Revenue breakdown
GET    /api/reports/tax-report         - Tax summary
GET    /api/reports/occupancy          - Occupancy rate
GET    /api/reports/arrears            - Overdue amounts
GET    /api/reports/contracts          - Active contracts list
GET    /api/reports/agent-performance  - Agent stats
GET    /api/reports/maintenance-costs  - Maintenance breakdown
GET    /api/reports/dashboard          - Real-time KPIs
POST   /api/reports/export-pdf         - Export as PDF
POST   /api/reports/export-excel       - Export as Excel
POST   /api/reports/schedule           - Schedule recurring report
```

---

## 🏗️ ARCHITECTURE & DATABASE

### Complete Schema Overview

**Core Tables:**
```
1. users (already exists)
2. tenants (new) - 7 related tables
3. owners (new) - related tables
4. properties (extends existing)
5. contracts (extends existing)
6. payments (extends existing)
7. charges (new)
8. communications (new) + templates + logs
9. maintenance_tickets (new) + work_orders
10. reports (logs/cache)
```

**Total Tables:** 40-50 (from current 26)
**Indexes:** 100+
**Relationships:** Complex FK structure

---

### Database Migration

```sql
-- Phase 4: Complete Schema Extension
-- File: migrations/005_phase4_complete_schema.sql
-- Lines: 2000+
-- Tables: 14+ new
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Week 1: Database & Backend Services

**Day 1-2: Schema Design**
- [ ] Complete schema diagram
- [ ] Finalize table relationships
- [ ] Indexes optimization

**Day 3-4: Migration**
- [ ] Write full migration SQL
- [ ] Test migration
- [ ] Backup plan

**Day 5: Services Layer**
- [ ] TenantService (CRUD + scoring)
- [ ] OwnerService
- [ ] PropertyService (extend)
- [ ] ContractService
- [ ] PaymentService
- [ ] ChargesService
- [ ] CommunicationService
- [ ] MaintenanceService
- [ ] ReportService

---

### Week 2: API Routes

- [ ] Tenant routes (8 endpoints)
- [ ] Owner routes (6 endpoints)
- [ ] Property routes (10 endpoints)
- [ ] Contract routes (8 endpoints)
- [ ] Payment routes (7 endpoints)
- [ ] Charges routes (6 endpoints)
- [ ] Communication routes (8 endpoints)
- [ ] Maintenance routes (10 endpoints)
- [ ] Report routes (12 endpoints)

**Total: 75+ endpoints**

---

### Week 3: Frontend Components

- [ ] Tenant.jsx (7 tabs + full layout)
- [ ] Owner.jsx (7 tabs + full layout)
- [ ] Property.jsx (7 tabs + full layout)
- [ ] Contract.jsx (5 tabs)
- [ ] Payment.jsx (4 tabs)
- [ ] Charges.jsx (4 tabs)
- [ ] Communication.jsx (5 tabs)
- [ ] Maintenance.jsx (4 tabs)
- [ ] Reports.jsx (5 tabs)

---

### Week 4: Integration & Testing

- [ ] End-to-end testing (all 9 modules)
- [ ] Performance testing
- [ ] Security audit
- [ ] UAT with stakeholders
- [ ] Bug fixes
- [ ] Production deployment

---

## ✅ QUALITY ASSURANCE CHECKLIST

### Before Production:

- [ ] All 9 modules functional end-to-end
- [ ] All 75+ API endpoints tested
- [ ] All forms validate correctly
- [ ] File uploads working (image, PDF, video)
- [ ] Calculations verified (risk score, cashflow, charges)
- [ ] Search & filters functional
- [ ] Export (PDF/Excel) working
- [ ] Performance acceptable (<2s load time)
- [ ] No TypeScript/JavaScript errors
- [ ] Mobile responsive (all modules)
- [ ] Accessibility compliant (WCAG)
- [ ] Data privacy (GDPR compliance)
- [ ] Security (SQL injection, XSS protected)
- [ ] Backup & recovery tested
- [ ] Documentation complete

---

## 🎯 SUCCESS METRICS

After Phase 4 completion:

| Metric | Target |
|--------|--------|
| System Completeness | 98%+ |
| Feature Parity with Facilogi | 95%+ |
| Feature Parity with MaGestionLocative | 95%+ |
| User Satisfaction (Test Group) | 4.5+/5 |
| Performance (Avg Load Time) | <1.5s |
| Uptime | 99.5%+ |
| Code Coverage | 80%+ |

---

## 📚 DELIVERABLES

At end of Phase 4:

1. ✅ Complete frontend (9 modules)
2. ✅ Complete backend (75+ endpoints)
3. ✅ Complete database (40-50 tables)
4. ✅ Full documentation (API + UI)
5. ✅ Test suite (100+ test cases)
6. ✅ Deployment guide
7. ✅ User manual
8. ✅ Admin guide

---

## 🎉 EXPECTED OUTCOME

**AKIG v2.0 - ULTRA-PREMIUM**

- ✅ Enterprise-grade real estate management system
- ✅ Fully competitive with global leaders
- ✅ Every button opens complete, comprehensive fiche
- ✅ No information gaps
- ✅ Professional UI/UX
- ✅ Production-ready
- ✅ Scalable architecture
- ✅ Support for unlimited properties/tenants/contracts

---

**Status:** 🟢 SPECIFICATIONS COMPLETE - READY FOR IMPLEMENTATION  
**Next Step:** Begin Week 1 Database & Backend Services

