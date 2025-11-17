# 🚀 AKIG - Documentation Complète des Endpoints API

## 📊 Vue d'Ensemble du Système

AKIG est un système complet de gestion immobilière pour la Guinée offrant:
- ✅ Gestion complète des propriétés et locaux
- ✅ Suivi des contrats de location
- ✅ Gestion automatisée des paiements avec quittances PDF
- ✅ Suivi des arriérés et plans de paiement
- ✅ Gestion de la maintenance et appels d'offre
- ✅ Rapports financiers avancés
- ✅ Tâches et reminders
- ✅ Export de données (Excel, CSV, PDF)
- ✅ Notifications et alertes

---

## 📋 Index des Endpoints

### 🏢 **GESTION IMMOBILIÈRE**
- [Propriétaires (Owners)](#propriétaires)
- [Propriétés (Properties)](#propriétés)
- [Locaux/Unités (Units)](#locaux-unités)
- [Contrats de Location (Rental Contracts)](#contrats-de-location)
- [Paiements de Loyers (Rent Payments)](#paiements-de-loyers)
- [Dépôts de Caution (Deposits)](#dépôts-de-caution)

### 📊 **RAPPORTS ET ANALYSES**
- [Recherche Avancée (Search)](#recherche-avancée)
- [Arriérés (Arrears)](#arriérés)
- [Analyse et Statistiques (Analytics)](#analyse-et-statistiques)
- [Maintenance (Maintenance)](#maintenance)

### 📈 **OUTILS DE GESTION**
- [Export de Données (Export)](#export-de-données)
- [Tâches et Reminders (Tasks)](#tâches-et-reminders)
- [Notifications (Notifications)](#notifications)

---

## 🏠 **PROPRIÉTAIRES**

### `GET /api/owners`
Liste tous les propriétaires avec filtres et pagination.

**Paramètres Query:**
```
- query: Recherche par nom/email/SIRET
- page: Numéro de page (défaut: 1)
- pageSize: Nombre par page (défaut: 20, max: 100)
- status: 'active' | 'inactive' | 'all'
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
      "tax_id": "FR123456",
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

### `GET /api/owners/:id`
Détails complets d'un propriétaire avec propriétés et statistiques.

**Réponse:**
```json
{
  "owner": { /* ... */ },
  "properties": [ /* Liste des propriétés */ ],
  "stats": {
    "property_count": 5,
    "unit_count": 12,
    "active_contracts": 10,
    "revenue_this_month": 2500000
  }
}
```

### `POST /api/owners`
Crée un nouveau propriétaire.

**Body:**
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "+224612345678",
  "company_name": "Dupont SARL",
  "address": "123 Rue de Paris",
  "city": "Kinshasa",
  "postal_code": "1234",
  "country": "Guinée",
  "tax_id": "FR123456",
  "bank_account": "FR76XXXX..."
}
```

### `PUT /api/owners/:id`
Met à jour un propriétaire.

### `DELETE /api/owners/:id`
Archive un propriétaire (soft delete).

### `GET /api/owners/:id/properties`
Récupère toutes les propriétés d'un propriétaire.

---

## 🏢 **PROPRIÉTÉS**

### `GET /api/properties`
Liste toutes les propriétés.

**Paramètres Query:**
```
- query: Recherche par nom/adresse
- city: Filtrer par ville
- status: Filtrer par statut
- owner_id: Filtrer par propriétaire
- page, pageSize
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

### `GET /api/properties/:id`
Détails complètes d'une propriété avec unités et statistiques.

### `POST /api/properties`
Crée une nouvelle propriété.

**Body:**
```json
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

### `PUT /api/properties/:id`
Met à jour une propriété.

### `DELETE /api/properties/:id`
Archive une propriété.

---

## 🔑 **LOCAUX/UNITÉS**

### `GET /api/units`
Liste tous les locaux avec filtres.

**Paramètres Query:**
```
- property_id: Filtrer par propriété
- status: 'available' | 'rented' | 'under_renovation' | 'archived'
- unit_type: Type de local
- page, pageSize
```

### `GET /api/units/:id`
Détails d'un local avec contrat actif et historique.

### `POST /api/units`
Crée un nouveau local.

**Body:**
```json
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

### `PUT /api/units/:id`
Met à jour un local.

### `DELETE /api/units/:id`
Archive un local.

---

## 📋 **CONTRATS DE LOCATION**

### `GET /api/rental-contracts/rental`
Liste tous les contrats de location.

**Paramètres Query:**
```
- status: 'active' | 'suspended' | 'terminated' | 'draft'
- property_id: Filtrer par propriété
- page, pageSize
```

### `GET /api/rental-contracts/rental/:id`
Détails complets d'un contrat avec dépôt et paiements.

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
  "payments": [ /* Historique des paiements */ ],
  "totalArrears": 0
}
```

### `POST /api/rental-contracts/rental`
Crée un nouveau contrat de location.

**Body:**
```json
{
  "unit_id": 1,
  "tenant_id": 5,
  "property_id": 1,
  "start_date": "2025-01-01",
  "end_date": "2026-01-01",
  "monthly_rent": 250000,
  "deposit_amount": 500000,
  "payment_frequency": "monthly",
  "notes": "Contrat standard"
}
```

### `PUT /api/rental-contracts/rental/:id`
Met à jour un contrat.

---

## 💰 **PAIEMENTS DE LOYERS**

### `GET /api/rent-payments`
Liste tous les paiements de loyer.

**Paramètres Query:**
```
- contract_id: Filtrer par contrat
- status: 'completed' | 'pending' | 'failed'
- startDate, endDate: Période
- page, pageSize
```

### `POST /api/rent-payments`
Enregistre un paiement et génère automatiquement une quittance PDF.

**Body:**
```json
{
  "contract_id": 1,
  "amount_paid": 250000,
  "payment_date": "2025-01-15",
  "payment_method": "bank_transfer",
  "period_start_date": "2025-01-01",
  "period_end_date": "2025-01-31",
  "reference_number": "VIR123456",
  "notes": "Paiement loyer janvier"
}
```

**Réponse:**
```json
{
  "message": "Paiement enregistré et quittance générée",
  "payment": {
    "id": 1,
    "contract_id": 1,
    "amount": 250000,
    "paid_at": "2025-01-15",
    "status": "completed"
  },
  "receipt": {
    "id": 1,
    "receipt_number": "QT-2025-001001"
  }
}
```

### `GET /api/rent-payments/:id/receipt`
Télécharge la quittance PDF.

### `GET /api/rent-payments/contract/:contractId/monthly-report`
Rapport de paiement mensuel.

---

## 🔐 **DÉPÔTS DE CAUTION**

### `GET /api/deposits`
Liste tous les dépôts.

**Paramètres Query:**
```
- status: 'held' | 'refunded' | 'partially_refunded' | 'disputed'
- contract_id: Filtrer par contrat
- page, pageSize
```

### `POST /api/deposits`
Enregistre un dépôt et génère un reçu PDF.

**Body:**
```json
{
  "contract_id": 1,
  "tenant_id": 5,
  "amount": 500000,
  "received_date": "2025-01-01",
  "payment_method": "bank_transfer",
  "reference_number": "VIR789456"
}
```

### `PUT /api/deposits/:id/refund`
Enregistre le remboursement d'une caution.

**Body:**
```json
{
  "refund_amount": 500000,
  "refund_date": "2026-01-15",
  "refund_reason": "Fin de contrat sans dégâts"
}
```

### `PUT /api/deposits/:id/dispute`
Marque une caution comme contestée.

---

## 🔍 **RECHERCHE AVANCÉE**

### `GET /api/search`
Recherche multi-critères globale.

**Paramètres Query:**
```
- q: Terme de recherche (min 2 caractères)
- type: 'all' | 'owners' | 'properties' | 'units' | 'tenants' | 'contracts' | 'payments'
- limit: Nombre de résultats (défaut: 50)
```

**Réponse:**
```json
{
  "query": "dupont",
  "results": {
    "owners": [ /* Propriétaires trouvés */ ],
    "properties": [ /* Propriétés trouvées */ ],
    "units": [ /* Locaux trouvés */ ],
    "tenants": [ /* Locataires trouvés */ ],
    "contracts": [ /* Contrats trouvés */ ],
    "payments": [ /* Paiements trouvés */ ]
  },
  "totalResults": 25
}
```

---

## 📌 **ARRIÉRÉS**

### `GET /api/arrears`
Liste tous les arriérés.

**Paramètres Query:**
```
- property_id: Filtrer par propriété
- status: 'pending' | 'partial' | 'overdue'
- min_amount: Montant minimum
- page, pageSize
```

**Réponse:**
```json
{
  "items": [
    {
      "id": 1,
      "contract_id": 1,
      "tenant_id": 5,
      "tenant_name": "Marie Dupont",
      "month": 12,
      "year": 2024,
      "amount_due": 250000,
      "amount_paid": 0,
      "balance": 250000,
      "days_overdue": 45,
      "urgency_level": "TRÈS GRAVE",
      "status": "overdue"
    }
  ],
  "summary": {
    "total": 150,
    "totalArrears": 37500000,
    "affectedContracts": 42,
    "averageArrears": 250000
  },
  "page": 1,
  "totalPages": 8
}
```

### `GET /api/arrears/contract/:contractId`
Arriérés pour un contrat spécifique.

### `GET /api/arrears/tenant/:tenantId`
Tous les arriérés d'un locataire.

### `GET /api/arrears/statistics/overview`
Statistiques globales sur les arriérés.

### `POST /api/arrears/:arrearsId/payment-plan`
Crée un plan de paiement.

---

## 📊 **MAINTENANCE**

### `GET /api/maintenance`
Liste les demandes de maintenance.

**Paramètres Query:**
```
- property_id: Filtrer par propriété
- status: 'pending' | 'approved' | 'in_progress' | 'completed'
- priority: 'low' | 'medium' | 'high' | 'urgent'
- page, pageSize
```

### `POST /api/maintenance`
Crée une demande de maintenance.

**Body:**
```json
{
  "property_id": 1,
  "unit_id": 1,
  "title": "Réparation tuyauterie",
  "description": "Fuite d'eau salle de bain",
  "priority": "high",
  "type": "corrective",
  "estimated_cost": 500000,
  "notes": "Urgent"
}
```

### `GET /api/maintenance/:id/quotes`
Liste les appels d'offre pour une maintenance.

### `POST /api/maintenance/:id/quotes`
Ajoute un appel d'offre.

**Body:**
```json
{
  "contractor_name": "Plomberie Pro",
  "contractor_email": "contact@plomberie.gn",
  "contractor_phone": "+224612345678",
  "amount": 450000,
  "description": "Devis réparation",
  "validity_days": 30
}
```

### `POST /api/maintenance/:maintenanceId/quotes/:quoteId/accept`
Accepte un appel d'offre.

### `GET /api/maintenance/statistics/overview`
Statistiques sur les maintenances.

---

## 📈 **ANALYSE ET STATISTIQUES**

### `GET /api/analytics/revenue`
Rapport de revenus.

**Paramètres Query:**
```
- startDate: Date début (YYYY-MM-DD)
- endDate: Date fin (YYYY-MM-DD)
- property_id: Filtrer par propriété
- owner_id: Filtrer par propriétaire
```

**Réponse:**
```json
{
  "period": { "start": "2025-01-01", "end": "2025-12-31" },
  "summary": {
    "payment_count": 250,
    "total_revenue": 62500000,
    "avg_payment": 250000,
    "completed_payments": 240,
    "pending_payments": 10
  },
  "monthlyRevenue": [ /* Données mensuelles */ ],
  "propertyRevenue": [ /* Données par propriété */ ]
}
```

### `GET /api/analytics/occupancy`
Taux d'occupation des propriétés.

### `GET /api/analytics/payment-performance`
Statistiques de performance des paiements.

### `GET /api/analytics/tenant-performance`
Performance des locataires.

### `GET /api/analytics/owner-summary/:ownerId`
Résumé pour un propriétaire.

### `GET /api/analytics/dashboard`
Tableau de bord global (admin).

---

## 💾 **EXPORT DE DONNÉES**

### `POST /api/export/properties`
Exporte la liste des propriétés.

**Body:**
```json
{
  "format": "excel"  // ou "csv"
}
```

### `POST /api/export/payments`
Exporte l'historique des paiements.

**Body:**
```json
{
  "format": "excel",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### `POST /api/export/arrears-report`
Exporte le rapport des arriérés.

### `POST /api/export/monthly-report`
Exporte le rapport mensuel complet.

---

## ✅ **TÂCHES ET REMINDERS**

### `GET /api/tasks`
Liste les tâches.

**Paramètres Query:**
```
- status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
- assigned_to: ID de l'utilisateur
- page, pageSize
```

### `POST /api/tasks`
Crée une nouvelle tâche.

**Body:**
```json
{
  "title": "Relancer locataire",
  "description": "Relancer pour paiement retardataire",
  "task_type": "follow_up",
  "assigned_to": 2,
  "due_date": "2025-02-01",
  "priority": "high",
  "related_entity_type": "contract",
  "related_entity_id": 1
}
```

### `PUT /api/tasks/:id`
Met à jour une tâche.

### `GET /api/tasks/overdue/list`
Liste les tâches retardées.

---

## 🔔 **NOTIFICATIONS**

### `GET /api/notifications`
Récupère les notifications de l'utilisateur.

**Paramètres Query:**
```
- unread_only: true/false
- limit: 50
```

**Réponse:**
```json
{
  "notifications": [
    {
      "id": 1,
      "notification_type": "payment_due",
      "title": "Paiement dû",
      "message": "Paiement loyer janvier dû",
      "is_read": false,
      "related_entity_type": "contract",
      "related_entity_id": 1,
      "created_at": "2025-01-31T00:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### `PUT /api/notifications/:id/read`
Marque une notification comme lue.

### `PUT /api/notifications/mark-all-read`
Marque toutes les notifications comme lues.

### `DELETE /api/notifications/:id`
Supprime une notification.

### `GET /api/notifications/statistics/overview`
Statistiques sur les notifications.

---

## 🔐 **AUTHENTIFICATION**

### `POST /api/auth/login`
Connexion utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "role": "owner"
  }
}
```

### `POST /api/auth/register`
Inscription nouvel utilisateur.

### `POST /api/auth/logout`
Déconnexion.

---

## 📞 **CODES D'ERREUR**

| Code | Signification |
|------|---------------|
| 200 | ✅ Succès |
| 201 | ✅ Ressource créée |
| 400 | ❌ Requête invalide |
| 401 | ❌ Non authentifié |
| 403 | ❌ Accès refusé |
| 404 | ❌ Non trouvé |
| 409 | ❌ Conflit |
| 500 | ❌ Erreur serveur |

---

## 🔑 **FORMATS DE SORTIE**

### Quittances PDF
Générées automatiquement pour:
- Paiements de loyers (QT-YYYY-XXXXXX)
- Dépôts de caution (RC-YYYY-XXXXXX)

**Emplacement:** `/backend/receipts/`

### Exports
Formats supportés:
- **Excel** (.xlsx) - Formatted with headers and colors
- **CSV** (.txt) - Plain text for import

**Emplacement:** `/backend/exports/`

---

## 🌟 **POINTS FORTS DU SYSTÈME**

✅ **API RESTful Complète** - 50+ endpoints
✅ **Authentification JWT** - Sécurisée avec rôles
✅ **Génération Automatique** - Quittances et reçus PDF
✅ **Rapports Avancés** - Revenue, occupancy, performance
✅ **Gestion des Arriérés** - Avec plans de paiement
✅ **Maintenance Intégrée** - Appels d'offre automatiques
✅ **Export Flexible** - Excel, CSV, PDF
✅ **Notifications** - Système d'alertes complet
✅ **Tâches Planifiées** - Reminders et suivi
✅ **Audit Complet** - Logging de toutes les actions

---

**Version:** 2.0.0  
**Dernière mise à jour:** 2025-10-26  
**Équipe:** AKIG Development
