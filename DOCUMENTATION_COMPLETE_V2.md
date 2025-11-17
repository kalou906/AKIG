# 📚 AKIG - Plateforme Immobilière Intelligente
## Documentation Complète v2.0

---

## 🎯 Table des Matières
1. [Architecture](#architecture)
2. [Setup & Installation](#setup--installation)
3. [API Endpoints](#api-endpoints)
4. [Base de Données](#base-de-données)
5. [Frontend](#frontend)
6. [Authentification & RBAC](#authentification--rbac)
7. [Génération PDF](#génération-pdf)
8. [Notifications](#notifications)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **PDF**: PDFKit
- **Email**: Nodemailer
- **Real-time**: Socket.io

### Frontend Stack
- **Framework**: React 19
- **UI**: Tailwind CSS
- **Charts**: Recharts
- **HTTP**: Fetch API
- **Icons**: Lucide React

### Infrastructure
```
AKIG/
├── backend/
│   ├── src/
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation
│   │   └── index.js         # Entry point
│   └── migrations/          # Database schemas
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom hooks
│   │   └── App.jsx          # Main app
│   └── public/              # Static files
└── docs/                    # Documentation
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
```bash
Node.js v16+ 
PostgreSQL 12+
npm 8+
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure .env
DATABASE_URL=postgresql://user:password@localhost:5432/akig
JWT_SECRET=your-secret-key-here
PORT=4000
NODE_ENV=development

# Run migrations
npm run migrate

# Start server
npm run dev  # Development
npm start    # Production
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Configure .env
REACT_APP_API_URL=http://localhost:4000/api

# Start dev server
npm start    # http://localhost:3000

# Build production
npm run build
```

### 4. Database Setup
```sql
-- Run migrations in order
psql -U postgres -d akig -f backend/migrations/001_init.sql
psql -U postgres -d akig -f backend/migrations/002_real_estate_agency_schema.sql
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/logout` | Se déconnecter |
| POST | `/api/auth/refresh` | Rafraîchir token |
| GET | `/api/auth/me` | Infos utilisateur |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | Lister propriétés |
| GET | `/api/properties/:id` | Détails propriété |
| POST | `/api/properties` | Créer propriété |
| PUT | `/api/properties/:id` | Modifier propriété |
| DELETE | `/api/properties/:id` | Supprimer propriété |
| GET | `/api/properties/search?q=` | Recherche |
| GET | `/api/properties/available` | Propriétés disponibles |
| GET | `/api/properties/stats` | Stats marché |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | Lister clients |
| GET | `/api/clients/:id` | Détails client |
| POST | `/api/clients` | Créer client |
| PUT | `/api/clients/:id` | Modifier client |
| DELETE | `/api/clients/:id` | Supprimer client |
| POST | `/api/clients/:id/verify` | Vérifier documents |
| GET | `/api/clients/qualified` | Clients qualifiés |
| GET | `/api/clients/stats` | Stats clients |

### Contracts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contracts` | Lister contrats |
| GET | `/api/contracts/:id` | Détails contrat |
| POST | `/api/contracts` | Créer contrat |
| PUT | `/api/contracts/:id` | Modifier contrat |
| GET | `/api/contracts/active` | Contrats actifs |
| GET | `/api/contracts/expiring` | Contrats expirant |
| GET | `/api/contracts/arrears` | Contrats arriérés |
| POST | `/api/contracts/:id/sign` | Signer contrat |
| POST | `/api/contracts/:id/terminate` | Résilier contrat |
| GET | `/api/contracts/stats` | Stats contrats |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | Lister paiements |
| GET | `/api/payments/:id` | Détails paiement |
| POST | `/api/payments` | Enregistrer paiement |
| POST | `/api/payments/:id/apply` | Appliquer paiement |
| POST | `/api/payments/:id/receipt` | Générer reçu PDF |
| POST | `/api/payments/report` | Rapport PDF |
| GET | `/api/payments/overdue` | Paiements en retard |
| GET | `/api/payments/stats` | Stats paiements |

---

## 🗄️ Base de Données

### Tables Principales

#### properties
```sql
- id: INT PRIMARY KEY
- reference: VARCHAR UNIQUE
- title, description: TEXT
- type: apartment|house|villa|land|commercial
- address, district, city, region: VARCHAR
- coordinates: JSON {lat, lng}
- bedrooms, bathrooms, total_area: INT/DECIMAL
- sale_price, rental_price: DECIMAL (GNF)
- status: available|rented|sold|maintenance
- owner_id, agent_id: INT (FK)
- main_image, images: TEXT/JSON
- amenities: JSON
- created_at, updated_at, deleted_at: TIMESTAMP
```

#### clients
```sql
- id: INT PRIMARY KEY
- reference: VARCHAR UNIQUE
- type: tenant|owner|buyer|investor
- first_name, last_name, email, phone: VARCHAR
- nationality, profession, company: VARCHAR
- id_number: VARCHAR (CIN/Passeport)
- address, district, city: VARCHAR
- salary: DECIMAL (GNF)
- employment_type, employment_status: VARCHAR
- verified: BOOLEAN
- reliability_rating: INT (1-5)
- payment_reliability: INT (1-5)
- created_at, updated_at, deleted_at: TIMESTAMP
```

#### rental_contracts
```sql
- id: INT PRIMARY KEY
- reference: VARCHAR UNIQUE
- start_date, end_date: DATE
- tenant_id, landlord_id, property_id: INT (FK)
- monthly_rent: DECIMAL (GNF)
- security_deposit: DECIMAL
- status: draft|active|terminated|expired
- renewal_option, pet_policy: VARCHAR
- created_at, updated_at, deleted_at: TIMESTAMP
```

#### payments
```sql
- id: INT PRIMARY KEY
- reference: VARCHAR UNIQUE
- contract_id, tenant_id: INT (FK)
- amount_gross, amount_actual: DECIMAL (GNF)
- date, due_date: TIMESTAMP
- payment_method: VARCHAR
- status: pending|completed|failed
- receipt_issued: BOOLEAN
- created_at, updated_at, deleted_at: TIMESTAMP
```

---

## 🎨 Frontend

### Pages Implémentées
- ✅ Dashboard principal
- ✅ Propriétés (listing + détails)
- ✅ Clients (gestion)
- ✅ Contrats (CRUD)
- ✅ Paiements (tracking + reçus)
- ✅ Rapports (export PDF)

### Composants Clés
```jsx
<RealEstateDashboard />    // Dashboard KPIs
<PropertiesPage />         // Propriétés listing
<ContractsPage />          // Gestion contrats
<ClientsPage />            // Gestion clients
<PaymentsPage />           // Paiements & reçus
```

### Styling
- Tailwind CSS pour layout responsive
- Icons Lucide React
- Charts Recharts pour visualisations

---

## 🔐 Authentification & RBAC

### Rôles Disponibles
```javascript
ROLES = {
  admin: 'admin',           // Accès complet
  agent: 'agent',           // Gestion propriétés & contrats
  landlord: 'landlord',     // Accès ses propriétés
  tenant: 'tenant'          // Accès ses contrats
}
```

### Permissions par Rôle
```javascript
admin:    ['read:all', 'create:all', 'update:all', 'delete:all', 'export:all']
agent:    ['read:properties', 'create:contracts', 'create:payments']
landlord: ['read:own_properties', 'read:own_contracts']
tenant:   ['read:own_contracts', 'read:own_payments']
```

### JWT Token
```javascript
Header: Authorization: Bearer <token>
Payload: { id, email, role, firstName, lastName }
Expires: 24 hours
```

---

## 📄 Génération PDF

### Reçus de Paiement
```javascript
// Générer reçu pour paiement
POST /api/payments/:id/receipt

// Retourne PDF avec:
- Numéro reçu (RCP-YYYY-XXXXXX)
- Détails paiement (montant, date, méthode)
- Infos contrat (locataire, propriété, période)
- Détails financiers (brut, déductions, net)
```

### Rapports
```javascript
// Générer rapport paiements
POST /api/payments/report
Body: { startDate, endDate, status }

// Génère PDF listant tous les paiements
```

---

## 🔔 Notifications

### Types d'Alertes
- Payment due (7 jours avant)
- Payment overdue (1 jour après)
- Contract expiring (30 jours avant)
- Maintenance request

### Channels
- Email (Nodemailer)
- SMS (Optional)
- In-app notifications

---

## 🚀 Déploiement

### Production Build
```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

### Docker
```bash
docker-compose up -d
```

### Environment Variables
```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
PORT=4000

# Frontend
REACT_APP_API_URL=https://api.akig.example.com
```

---

## 🐛 Troubleshooting

### PDF not generating
- Check PDFKit installed: `npm list pdfkit`
- Verify exports directory exists
- Check file permissions

### Database connection error
- Verify PostgreSQL running
- Check DATABASE_URL format
- Verify credentials

### Authentication fails
- Clear browser localStorage
- Verify JWT_SECRET matches
- Check token expiry

### API 404 errors
- Verify backend running on port 4000
- Check REACT_APP_API_URL in frontend
- Verify route file imported in index.js

---

## 📞 Support

For issues or questions:
1. Check logs: `npm run dev 2>&1 | tee app.log`
2. Verify database: `psql -U postgres -d akig -c "SELECT VERSION();"`
3. Test API: `curl http://localhost:4000/api/health`

---

**Version**: 2.0.0  
**Last Updated**: October 2025  
**Made with ❤️ for AKIG**
