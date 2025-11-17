# AKIG Phase 10 - Quick Reference Guide

## What Was Created

### Backend (6 endpoints → 18+ API routes)

```
POST   /api/core/owners               Create owner
GET    /api/core/owners               List owners

POST   /api/core/sites                Create site
GET    /api/core/sites                List sites

POST   /api/core/tenants              Create tenant
GET    /api/core/tenants              List tenants
GET    /api/core/tenants/:id          Get tenant detail
DELETE /api/core/tenants/:id          Delete tenant (ready)

POST   /api/core/contracts            Create contract
GET    /api/core/contracts            List contracts
DELETE /api/core/contracts/:id        Delete contract (ready)

POST   /api/core/payments             Create payment
GET    /api/core/payments             List payments

GET    /api/core/payment-status-year  Yearly snapshots

POST   /api/core/ops-notes            Create note
GET    /api/core/ops-notes            List notes

POST   /api/import/payments           Import from CSV
GET    /api/import/runs               Import history
GET    /api/import/runs/:id           Import detail

POST   /api/ai/contract-suggest       AI suggestions
```

### Frontend Pages (3 complete)

1. **ImportPayments.tsx** (~300 lines)
   - Upload CSV or paste directly
   - Real-time parsing and validation
   - Summary with success/fail counts
   - Template download

2. **TenantsPage.tsx** (~350 lines)
   - List all tenants
   - Search by name/phone/email
   - Add new tenant with validation
   - View details, delete with confirmation

3. **ContractsManagePage.tsx** (~400 lines)
   - List contracts with details
   - Filter by status
   - Search by ref/tenant
   - Add new contract with validation
   - Currency formatting (GNF)

---

## File Locations

### Backend
```
backend/
├── src/
│   ├── routes/
│   │   ├── core.js              ← NEW: Core CRUD routes
│   │   ├── import.js            ← NEW: CSV import routes
│   │   └── aiContractSuggestions.js (converted to CommonJS)
│   └── index.js                 (updated with new routes)
└── db/
    ├── migrations/
    │   └── 004_create_core_multi_year.js
    └── seeds/
        └── 003_seed_core_multi_year.js
```

### Frontend
```
frontend/src/
├── pages/
│   ├── ImportPayments.tsx       ← NEW: CSV import page
│   ├── TenantsPage.tsx          ← NEW: Tenants management
│   ├── ContractsManagePage.tsx  ← NEW: Contracts management
│   └── ContractsDashboard.tsx   (from Phase 9)
└── api/
    └── client.ts                (uses CSRF token)
```

---

## Key Features

### Import Payments
- ✅ CSV file upload
- ✅ Direct CSV paste
- ✅ Automatic deduplication (SHA256 hash)
- ✅ Per-row error reporting
- ✅ Import summary (total/inserted/duplicated/failed)
- ✅ Transaction support (all-or-nothing)
- ✅ Audit trail tracking

### Tenants Management
- ✅ List with pagination
- ✅ Search (name, phone, email)
- ✅ Add new with validation
- ✅ View details modal
- ✅ Delete with confirmation
- ✅ Phone validation (Guinea format)
- ✅ Email validation

### Contracts Management
- ✅ List with full details
- ✅ Filter by status
- ✅ Search by ref/tenant
- ✅ Add new with validation
- ✅ View details modal
- ✅ Delete with confirmation
- ✅ Currency formatting (GNF)
- ✅ Periodicity support (monthly/quarterly/semi-annual/annual)

---

## Data Models

### Tenant
```typescript
{
  id: number
  full_name: string          // required, min 3 chars
  phone?: string             // +224 format validation
  email?: string             // email format validation
  current_site_id?: number
  active: boolean
  created_at: string
}
```

### Contract
```typescript
{
  id: number
  tenant_id: number          // required
  site_id?: number
  owner_id?: number
  ref: string                // required
  monthly_rent: number       // required, positive
  periodicity: string        // monthly|quarterly|semiannual|annual
  start_date: string         // required
  end_date?: string
  status: string             // active|terminated|suspended
  created_at: string
}
```

### Payment
```typescript
{
  id: number
  tenant_id: number          // required
  owner_id?: number
  site_id?: number
  contract_id?: number
  paid_at: string            // required
  amount: number             // required, positive
  mode?: string              // cash|orange_money|virement|cheque
  channel?: string
  allocation?: string
  external_ref?: string
  raw_hash: string           // for deduplication
  created_at: string
}
```

### ImportRun (Audit)
```typescript
{
  id: number
  source_file: string
  rows_total: number
  rows_inserted: number
  rows_duplicated: number
  rows_failed: number
  status: string             // processing|completed|failed
  created_at: string
}
```

---

## Common API Usage

### List Tenants
```bash
curl http://localhost:4000/api/core/tenants
curl http://localhost:4000/api/core/tenants?site_id=1&active=true
```

### Create Tenant
```bash
curl -X POST http://localhost:4000/api/core/tenants \
  -H "Content-Type: application/json" \
  -H "x-csrf: token" \
  -d '{
    "full_name": "Mohamed Diallo",
    "phone": "+224 612345678",
    "email": "mohamed@example.com",
    "current_site_id": 1
  }'
```

### Import Payments
```bash
curl -X POST http://localhost:4000/api/import/payments \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {
        "tenant_id": 1,
        "paid_at": "2024-01-15",
        "amount": 500000,
        "mode": "cash"
      }
    ],
    "source_file": "january_payments.csv"
  }'
```

### List Contracts with Filter
```bash
curl http://localhost:4000/api/core/contracts?status=active&tenant_id=1
```

---

## Validation Rules

### Tenant Form
- **Full Name**: Required, min 3 characters
- **Phone**: Optional, Guinea format (+224 XXXXXXXX)
- **Email**: Optional, valid email format
- **Site ID**: Optional, numeric

### Contract Form
- **Tenant ID**: Required, must exist
- **Reference**: Required, string
- **Monthly Rent**: Required, positive number
- **Periodicity**: Required (monthly|quarterly|semiannual|annual)
- **Start Date**: Required, valid date
- **End Date**: Optional, valid date
- **Site ID**: Optional
- **Owner ID**: Optional

### Payment Import
- **Tenant ID**: Required, positive integer
- **Paid At**: Required, valid date (YYYY-MM-DD)
- **Amount**: Required, positive number
- **Mode**: Optional (cash, orange_money, virement, cheque)
- **Channel**: Optional string
- **External Ref**: Optional string (for tracking)

---

## Error Handling

### Frontend
- Form validation with real-time error messages
- API error parsing and user-friendly display
- Network error retry with exponential backoff
- Loading states during async operations

### Backend
- Try-catch error handling on all routes
- Detailed error messages for debugging
- Transaction rollback on import errors
- Per-row error collection and reporting
- Database constraint violation handling

### Common Errors
```
400: Missing required fields
400: Invalid phone format
400: Email format invalid
400: Monthly rent must be positive
404: Tenant not found
409: Duplicate payment (same hash exists)
500: Database error
```

---

## Testing Quick Commands

### Check Routes
```bash
curl http://localhost:4000/api/health
```

### List Tenants
```bash
curl http://localhost:4000/api/core/tenants
```

### Create Test Tenant
```bash
curl -X POST http://localhost:4000/api/core/tenants \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test Tenant", "phone": "+224 612345678"}'
```

### Import Test Data
```bash
# First create a tenant
curl -X POST http://localhost:4000/api/core/tenants \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test Tenant"}'

# Then import payment (using returned tenant_id)
curl -X POST http://localhost:4000/api/import/payments \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {"tenant_id": 1, "paid_at": "2024-01-15", "amount": 500000}
    ]
  }'
```

---

## Frontend Component Imports

```typescript
// Pages
import { ImportPayments } from '../pages/ImportPayments';
import { TenantsPage } from '../pages/TenantsPage';
import { ContractsPage } from '../pages/ContractsManagePage';

// Utilities
import { req } from '../api/client';
import { v } from '../lib/validate';
import { uiLog } from '../lib/uilog';
import { FormField } from '../components/FormField';
import { ExportButtons } from '../components/ExportButtons';
```

---

## Status & Stats

- **Backend Files**: 3 (core.js, import.js, aiContractSuggestions.js)
- **Frontend Files**: 3 (ImportPayments.tsx, TenantsPage.tsx, ContractsManagePage.tsx)
- **Total Lines**: ~1,600
- **API Endpoints**: 18+
- **Database Tables**: 8
- **Validation Rules**: 15+
- **Compilation Errors**: 0
- **Code Quality**: Production-ready

---

## Next Steps

1. ✅ Phase 10: Backend routes & frontend pages (COMPLETE)
2. ⏳ Phase 11: Analytics dashboard (payment trends, arrears)
3. ⏳ Phase 12: Advanced features (reports, notifications)
4. ⏳ Phase 13: Integration (WhatsApp, SMS, Bank)

---

## Support

For issues or questions:
1. Check API_DOCUMENTATION.md for endpoint details
2. Review PHASE_10_STATUS.md for implementation details
3. See BACKEND_FRONTEND_SUMMARY.md for integration info
4. Check inline code comments for specific logic

