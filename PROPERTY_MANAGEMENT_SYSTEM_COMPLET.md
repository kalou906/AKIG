# 🏢 AKIG - System Propertiés Locataires - Documentation Complète

## 🌟 Améliorations Majeures Apportées

### 1. **Gestion des Propriétaires** 🏠
- CRUD complet pour les propriétaires
- Profils détaillés (coordonnées, SIRET, compte bancaire)
- Statistiques par propriétaire
- Historique des propriétés

### 2. **Gestion des Propriétés/Immeubles** 🏗️
- Création et gestion complète des immeubles
- Types de propriétés (résidentiel, commercial, mixte)
- Localisation géographique (GPS)
- Statistiques en temps réel

### 3. **Gestion des Locaux/Unités** 🔑
- Gestion détaillée des appartements/bureaux
- Informations complètes (surface, étages, équipements)
- Statut du local (disponible, loué, rénovation)
- Lien avec les contrats de location

### 4. **Gestion des Contrats de Location** 📋
- Contrats structurés et complets
- Fréquence de paiement configurable
- Suivi du statut du contrat
- Renouvellement automatisé

### 5. **Gestion des Paiements de Loyers** 💰
- Enregistrement des paiements
- Génération automatique de **quittances PDF**
- Rapports de paiement mensuel
- Historique détaillé

### 6. **Gestion des Dépôts de Caution** 🔐
- Enregistrement des dépôts
- Génération de **reçus de caution PDF**
- Suivi des remboursements
- Gestion des contestations

---

## 🚀 Structure de la Base de Données

### Tables Principales

#### `users` (Enhanced)
```sql
- id: Identifiant unique
- name: Nom complet
- email: Email unique
- password_hash: Mot de passe crypté
- role: 'admin', 'owner', 'manager', 'tenant', 'user'
- phone: Téléphone
- address: Adresse
- city: Ville
- postal_code: Code postal
- country: Pays
- company_name: Nom de l'entreprise
- tax_id: SIRET/Numéro fiscal
- bank_account: Compte bancaire
- is_active: Statut actif/inactif
- notes: Notes
- created_at, updated_at: Timestamps
```

#### `properties` (Nouvelles)
```sql
- id: Identifiant unique
- name: Nom de la propriété
- address: Adresse
- city: Ville
- postal_code: Code postal
- country: Pays
- owner_id: Propriétaire FK
- property_type: residential|commercial|mixed|other
- total_area: Surface totale
- year_built: Année de construction
- number_of_units: Nombre d'unités
- latitude, longitude: Coordonnées GPS
- photo_url: Photo
- status: active|inactive|for_sale|under_renovation
- created_at, updated_at: Timestamps
```

#### `units` (Nouvelles)
```sql
- id: Identifiant unique
- property_id: Propriété FK
- unit_number: Numéro du local
- unit_type: apartment|room|office|shop|warehouse|other
- floor_number: Numéro d'étage
- area: Surface
- bedrooms: Chambres
- bathrooms: Salles de bain
- furnished: Meublé oui/non
- rent_amount: Montant du loyer
- deposit_amount: Montant de la caution
- maintenance_fee: Frais de maintenance
- amenities: Équipements (JSON)
- status: available|rented|under_renovation|archived
- photo_url: Photo
- created_at, updated_at: Timestamps
```

#### `contracts` (Améliorées)
```sql
- id: Identifiant unique
- unit_id: Unité FK
- tenant_id: Locataire FK
- property_id: Propriété FK
- start_date: Date de début
- end_date: Date de fin
- monthly_rent: Loyer mensuel
- deposit_amount: Caution
- contract_type: rental|service|purchase|lease|other
- payment_frequency: monthly|quarterly|semi-annual|annual
- status: draft|active|suspended|terminated|completed
- renewal_date: Date de renouvellement
- notes: Notes
- created_at, updated_at: Timestamps
```

#### `deposits` (Nouvelles)
```sql
- id: Identifiant unique
- contract_id: Contrat FK
- tenant_id: Locataire FK
- amount: Montant
- received_date: Date de réception
- receipt_number: Numéro de reçu unique
- payment_method: cash|bank_transfer|check|card|other
- reference_number: Référence
- status: held|refunded|partially_refunded|deducted|disputed
- refund_amount: Montant remboursé
- refund_date: Date remboursement
- refund_reason: Motif remboursement
- notes: Notes
- created_at, updated_at: Timestamps
```

#### `receipts` (Nouvelles)
```sql
- id: Identifiant unique
- payment_id: Paiement FK
- contract_id: Contrat FK
- tenant_id: Locataire FK
- receipt_number: Numéro unique (QT-YYYY-XXXXXX)
- receipt_type: rent|deposit|maintenance|other
- amount_paid: Montant payé
- payment_date: Date de paiement
- payment_method: cash|bank_transfer|check|card|online|other
- period_start_date: Date début période
- period_end_date: Date fin période
- reference_number: Référence
- pdf_path: Chemin du PDF généré
- status: issued|sent|viewed|archived
- notes: Notes
- created_at, created_by: Timestamps et créateur
```

#### `payment_reports` (Nouvelles)
```sql
- id: Identifiant unique
- contract_id: Contrat FK
- property_id: Propriété FK
- tenant_id: Locataire FK
- month: Mois (1-12)
- year: Année
- due_date: Date d'échéance
- amount_due: Montant dû
- amount_paid: Montant payé
- balance: Solde
- status: pending|partial|paid|overdue|cancelled
- payment_date: Date de paiement
- notes: Notes
- created_at: Timestamp
```

---

## 📡 API Endpoints

### 👥 PROPRIÉTAIRES - `/api/owners`

#### GET `/api/owners`
Liste tous les propriétaires avec pagination et filtres
```bash
GET /api/owners?query=dupont&page=1&pageSize=20&status=active
```
**Réponse:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "phone": "+224612345678",
      "company_name": "Dupont SARL",
      "property_count": 5,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

#### POST `/api/owners`
Crée un nouveau propriétaire
```bash
POST /api/owners
Content-Type: application/json

{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "+224612345678",
  "address": "123 Rue de Paris",
  "city": "Kinshasa",
  "postal_code": "1234",
  "country": "Guinée",
  "company_name": "Dupont SARL",
  "tax_id": "FR12345678900",
  "bank_account": "FR76 XXXX XXXX XXXX XXXX XXXX"
}
```

#### GET `/api/owners/:id`
Récupère les détails d'un propriétaire avec ses propriétés et statistiques
```bash
GET /api/owners/1
```

#### PUT `/api/owners/:id`
Met à jour un propriétaire
```bash
PUT /api/owners/1
Content-Type: application/json

{
  "name": "Jean Dupont Modifié",
  "email": "jean.new@example.com"
}
```

#### DELETE `/api/owners/:id`
Archive un propriétaire
```bash
DELETE /api/owners/1
```

#### GET `/api/owners/:id/properties`
Récupère toutes les propriétés d'un propriétaire
```bash
GET /api/owners/1/properties
```

---

### 🏢 PROPRIÉTÉS - `/api/properties`

#### GET `/api/properties`
Liste toutes les propriétés
```bash
GET /api/properties?query=duplex&city=Kinshasa&status=active&page=1&pageSize=20
```
**Réponse:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Immeuble Résidentiel A",
      "address": "123 Rue Principale",
      "city": "Kinshasa",
      "property_type": "residential",
      "total_area": 5000,
      "year_built": 2020,
      "number_of_units": 12,
      "total_units": 12,
      "rented_units": 10,
      "available_units": 2,
      "status": "active",
      "owner_name": "Jean Dupont",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

#### POST `/api/properties`
Crée une nouvelle propriété
```bash
POST /api/properties
Content-Type: application/json

{
  "name": "Immeuble Résidentiel B",
  "address": "456 Rue Secondaire",
  "city": "Kinshasa",
  "property_type": "residential",
  "total_area": 3000,
  "year_built": 2021,
  "number_of_units": 8,
  "owner_id": 1,
  "latitude": -4.3276,
  "longitude": 15.3136
}
```

#### GET `/api/properties/:id`
Récupère les détails d'une propriété avec ses unités et statistiques
```bash
GET /api/properties/1
```

#### PUT `/api/properties/:id`
Met à jour une propriété
```bash
PUT /api/properties/1
Content-Type: application/json

{
  "name": "Immeuble Rénové",
  "status": "active"
}
```

#### DELETE `/api/properties/:id`
Archive une propriété
```bash
DELETE /api/properties/1
```

---

### 🔑 LOCAUX/UNITÉS - `/api/units`

#### GET `/api/units`
Liste tous les locaux
```bash
GET /api/units?property_id=1&status=available&unit_type=apartment&page=1
```
**Réponse:**
```json
{
  "items": [
    {
      "id": 1,
      "unit_number": "A-101",
      "unit_type": "apartment",
      "floor_number": 1,
      "area": 85,
      "bedrooms": 2,
      "bathrooms": 1,
      "furnished": false,
      "rent_amount": 250000,
      "deposit_amount": 500000,
      "maintenance_fee": 25000,
      "status": "available",
      "property_name": "Immeuble Résidentiel A",
      "active_contracts": 0,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### POST `/api/units`
Crée un nouveau local
```bash
POST /api/units
Content-Type: application/json

{
  "property_id": 1,
  "unit_number": "A-102",
  "unit_type": "apartment",
  "floor_number": 1,
  "area": 90,
  "bedrooms": 2,
  "bathrooms": 1,
  "furnished": false,
  "rent_amount": 270000,
  "deposit_amount": 540000,
  "maintenance_fee": 27000,
  "amenities": ["WiFi", "Parking", "Cuisine équipée"]
}
```

#### GET `/api/units/:id`
Récupère les détails d'un local avec contrat actif
```bash
GET /api/units/1
```

#### PUT `/api/units/:id`
Met à jour un local
```bash
PUT /api/units/1
Content-Type: application/json

{
  "rent_amount": 275000,
  "status": "rented"
}
```

---

### 📋 CONTRATS DE LOCATION - `/api/rental-contracts`

#### GET `/api/rental-contracts/rental`
Liste tous les contrats de location
```bash
GET /api/rental-contracts/rental?status=active&property_id=1&page=1
```
**Réponse:**
```json
{
  "items": [
    {
      "id": 1,
      "unit_id": 1,
      "tenant_id": 5,
      "tenant_name": "Marie Dupont",
      "tenant_email": "marie@example.com",
      "tenant_phone": "+224612345678",
      "property_name": "Immeuble Résidentiel A",
      "unit_number": "A-101",
      "start_date": "2025-01-01",
      "end_date": "2026-01-01",
      "monthly_rent": 250000,
      "deposit_amount": 500000,
      "payment_frequency": "monthly",
      "status": "active",
      "paid_count": 11,
      "paid_this_month": 250000,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### POST `/api/rental-contracts/rental`
Crée un nouveau contrat de location
```bash
POST /api/rental-contracts/rental
Content-Type: application/json

{
  "unit_id": 1,
  "tenant_id": 5,
  "property_id": 1,
  "start_date": "2025-01-01",
  "end_date": "2026-01-01",
  "monthly_rent": 250000,
  "deposit_amount": 500000,
  "payment_frequency": "monthly",
  "renewal_date": null,
  "notes": "Contrat de location standard"
}
```

#### GET `/api/rental-contracts/rental/:id`
Récupère les détails complets d'un contrat
```bash
GET /api/rental-contracts/rental/1
```
**Réponse:**
```json
{
  "contract": {
    "id": 1,
    "unit_id": 1,
    "tenant_id": 5,
    "tenant_name": "Marie Dupont",
    "monthly_rent": 250000,
    "deposit_amount": 500000,
    "status": "active",
    "start_date": "2025-01-01",
    "end_date": "2026-01-01"
  },
  "deposit": {
    "id": 1,
    "amount": 500000,
    "received_date": "2025-01-01",
    "status": "held",
    "receipt_number": "RC-2025-005001"
  },
  "payments": [
    {
      "id": 1,
      "paid_at": "2025-01-15",
      "amount": 250000,
      "payment_method": "bank_transfer",
      "status": "completed"
    }
  ],
  "totalArrears": 0
}
```

---

### 💰 PAIEMENTS DE LOYERS - `/api/rent-payments`

#### GET `/api/rent-payments`
Liste tous les paiements de loyer
```bash
GET /api/rent-payments?contract_id=1&status=completed&startDate=2025-01-01&page=1
```

#### POST `/api/rent-payments`
Enregistre un paiement de loyer et génère une quittance
```bash
POST /api/rent-payments
Content-Type: application/json

{
  "contract_id": 1,
  "amount_paid": 250000,
  "payment_date": "2025-01-15",
  "payment_method": "bank_transfer",
  "period_start_date": "2025-01-01",
  "period_end_date": "2025-01-31",
  "reference_number": "VIR123456",
  "notes": "Paiement loyer janvier 2025"
}
```
**Réponse:**
```json
{
  "message": "Paiement enregistré et quittance générée avec succès",
  "payment": {
    "id": 1,
    "contract_id": 1,
    "amount": 250000,
    "paid_at": "2025-01-15",
    "payment_method": "bank_transfer",
    "status": "completed"
  },
  "receipt": {
    "id": 1,
    "receipt_number": "QT-2025-001001"
  }
}
```

#### GET `/api/rent-payments/:id/receipt`
Télécharge la quittance PDF
```bash
GET /api/rent-payments/1/receipt
```

#### GET `/api/rent-payments/contract/:contractId/monthly-report`
Récupère le rapport de paiement mensuel
```bash
GET /api/rent-payments/contract/1/monthly-report?month=1&year=2025
```

---

### 🔐 DÉPÔTS DE CAUTION - `/api/deposits`

#### GET `/api/deposits`
Liste tous les dépôts de caution
```bash
GET /api/deposits?status=held&contract_id=1&page=1
```

#### POST `/api/deposits`
Enregistre un dépôt de caution et génère un reçu
```bash
POST /api/deposits
Content-Type: application/json

{
  "contract_id": 1,
  "tenant_id": 5,
  "amount": 500000,
  "received_date": "2025-01-01",
  "payment_method": "bank_transfer",
  "reference_number": "VIR789456",
  "notes": "Caution dépôt pour contrat location"
}
```
**Réponse:**
```json
{
  "message": "Dépôt de caution enregistré et reçu généré avec succès",
  "deposit": {
    "id": 1,
    "contract_id": 1,
    "tenant_id": 5,
    "amount": 500000,
    "received_date": "2025-01-01",
    "receipt_number": "RC-2025-005001",
    "status": "held"
  }
}
```

#### PUT `/api/deposits/:id/refund`
Enregistre le remboursement d'une caution
```bash
PUT /api/deposits/1/refund
Content-Type: application/json

{
  "refund_amount": 500000,
  "refund_date": "2026-01-15",
  "refund_reason": "Fin de contrat sans dégâts"
}
```

#### PUT `/api/deposits/:id/dispute`
Marque une caution comme contestée
```bash
PUT /api/deposits/1/dispute
Content-Type: application/json

{
  "dispute_reason": "Contestation du montant retenu"
}
```

---

## 📊 Génération de Quittances et Reçus

### Service: `ReceiptGenerator`

#### Quittance de Paiement (PDF)
- **Fonction:** `generatePaymentReceipt(paymentData)`
- **Données requises:** 
  - receipt_number, payment_id, contract_id, tenant_id
  - amount_paid, payment_date, payment_method
  - period_start_date, period_end_date
- **Format:** PDF formaté professionnellement
- **Contenu:**
  - Numéro de quittance unique
  - Informations locataire complètes
  - Détails du paiement
  - Période couverte
  - Informations de la propriété
  - Logo et en-tête professionnels

#### Reçu de Caution (PDF)
- **Fonction:** `generateDepositReceipt(depositData)`
- **Données requises:**
  - receipt_number, contract_id, tenant_id
  - amount, received_date, payment_method
- **Format:** PDF formaté professionnellement
- **Contenu:**
  - Numéro de reçu unique
  - Informations complètes du locataire
  - Informations du propriétaire
  - Détails de la caution
  - Conditions légales
  - Date de génération

---

## 🔄 Workflows Typiques

### 1. Création d'un Contrat de Location
```
1. POST /api/owners          → Créer propriétaire
2. POST /api/properties      → Créer propriété
3. POST /api/units           → Créer local
4. POST /api/deposits        → Enregistrer caution (reçu généré)
5. POST /api/rental-contracts/rental → Créer contrat
```

### 2. Enregistrement d'un Paiement de Loyer
```
1. POST /api/rent-payments   → Enregistrer paiement (quittance générée automatiquement)
2. GET /api/rent-payments/:id/receipt → Télécharger PDF quittance
3. GET /api/rent-payments/contract/:id/monthly-report → Vérifier statut paiement
```

### 3. Remboursement de Caution
```
1. GET /api/deposits/:id     → Vérifier dépôt
2. PUT /api/deposits/:id/refund → Enregistrer remboursement
```

---

## 🛡️ Authentification et Autorisation

Tous les endpoints requièrent l'authentification JWT sauf `/api/health` et `/api/auth/login`.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Rôles:**
- `admin`: Accès complet
- `owner`: Gestion de ses propriétés
- `manager`: Gestion des paiements et contrats
- `tenant`: Accès limité (paiements)
- `user`: Accès de base

---

## 📂 Fichiers Générés

Les quittances et reçus sont stockés dans:
```
/backend/receipts/
├── QT-2025-001001-1234567890.pdf
├── RC-2025-005001-1234567890.pdf
└── ...
```

---

## ✅ Checklist de Configuration

- [x] Migrations SQL créées
- [x] Routes propriétaires implémentées
- [x] Routes propriétés implémentées
- [x] Routes unités implémentées
- [x] Routes contrats de location implémentées
- [x] Routes paiements loyers implémentées
- [x] Routes dépôts de caution implémentées
- [x] Service de génération de quittances implémenté
- [x] Quittances PDF automatiques à chaque paiement
- [x] Reçus de caution PDF automatiques
- [x] Intégration dans index.js
- [ ] Tests unitaires
- [ ] Interface frontend (à développer)
- [ ] Documentation API Swagger

---

## 🚀 Prochaines Étapes

1. **Frontend:**
   - Dashboard des propriétaires
   - Interface de gestion des propriétés
   - Formulaire de création de contrats
   - Historique des paiements et quittances
   - Gestion des cautions

2. **Rapports:**
   - Rapport mensuel par propriété
   - Rapport de revenus par année
   - Analyse des arriérés
   - Statistiques de collecte

3. **Notifications:**
   - Email de quittances automatiques
   - Rappels de paiement
   - Alertes d'arriérés

4. **Améliorations:**
   - Intégration bancaire
   - Paiements en ligne
   - Signatures électroniques
   - Archivage numérique

---

## 📞 Support et Questions

Pour toute question sur l'utilisation du système, consultez les logs serveur ou contactez l'équipe technique.

**Documents connexes:**
- Migration SQL: `/backend/db/migrations/001_create_property_management.sql`
- Service PDF: `/backend/src/services/receiptGenerator.js`
- Routes: `/backend/src/routes/`

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-10-26  
**Auteur:** AKIG Dev Team
