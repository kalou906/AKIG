# API Endpoints Documentation

## Base URL
```
http://localhost:4000/api
```

---

## Authentication
All requests include CSRF token via `x-csrf` header (automatically added by client.ts)

---

## Core Endpoints (`/core`)

### Owners

#### List Owners
```
GET /core/owners
```
**Response**: `Array<{ id, name, created_at }>`

#### Create Owner
```
POST /core/owners
Content-Type: application/json

{
  "name": "Propriétaire A"
}
```
**Response**: `{ id, name, created_at }`

---

### Sites

#### List Sites
```
GET /core/sites?owner_id=1
```
**Query Parameters**:
- `owner_id` (optional): Filter by owner

**Response**: `Array<{ id, name, owner_id, owner_name, address, city }>`

#### Create Site
```
POST /core/sites
Content-Type: application/json

{
  "name": "Matam Property",
  "owner_id": 1,
  "address": "123 Main St",
  "city": "Conakry"
}
```

---

### Tenants

#### List Tenants
```
GET /core/tenants?site_id=1&active=true
```
**Query Parameters**:
- `site_id` (optional): Filter by site
- `active` (optional): Filter by active status

**Response**: `Array<{ id, full_name, phone, email, current_site_id, site_name, active, created_at }>`

#### Get Single Tenant
```
GET /core/tenants/:id
```

#### Create Tenant
```
POST /core/tenants
Content-Type: application/json

{
  "full_name": "Mohamed Diallo",
  "phone": "+224 612345678",
  "email": "mohamed@example.com",
  "current_site_id": 1
}
```

---

### Contracts

#### List Contracts
```
GET /core/contracts?tenant_id=1&status=active
```
**Query Parameters**:
- `tenant_id` (optional): Filter by tenant
- `status` (optional): active, terminated, suspended

**Response**: `Array<{ id, tenant_id, tenant_name, site_id, owner_id, ref, monthly_rent, periodicity, start_date, end_date, status, created_at }>`

#### Create Contract
```
POST /core/contracts
Content-Type: application/json

{
  "tenant_id": 1,
  "site_id": 1,
  "owner_id": 1,
  "ref": "CONT-2024-001",
  "monthly_rent": 500000,
  "periodicity": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2025-01-01",
  "status": "active"
}
```

**Periodicity Values**: `monthly`, `quarterly`, `semiannual`, `annual`

---

### Payments

#### List Payments
```
GET /core/payments?contract_id=1&year=2024
```
**Query Parameters**:
- `contract_id` (optional): Filter by contract
- `tenant_id` (optional): Filter by tenant
- `year` (optional): Filter by year

**Response**: `Array<{ id, tenant_id, tenant_name, paid_at, amount, mode, channel, contract_ref, ... }>`

#### Create Payment
```
POST /core/payments
Content-Type: application/json

{
  "tenant_id": 1,
  "owner_id": 1,
  "site_id": 1,
  "contract_id": 1,
  "paid_at": "2024-01-15",
  "amount": 500000,
  "mode": "cash",
  "channel": "counter",
  "allocation": "january",
  "external_ref": "REC-001"
}
```

**Mode Values**: `cash`, `orange_money`, `virement`, `cheque`

---

### Payment Status by Year

#### List Yearly Snapshots
```
GET /core/payment-status-year?contract_id=1&year=2024
```
**Query Parameters**:
- `contract_id` (optional): Filter by contract
- `year` (optional): Filter by year

**Response**: `Array<{ id, contract_id, contract_ref, tenant_name, year, due_amount, paid_amount, arrears_amount, arrears_months, pressure_level }>`

---

### Operations Notes

#### List Notes
```
GET /core/ops-notes?tenant_id=1
```
**Query Parameters**:
- `tenant_id` (optional): Filter by tenant
- `site_id` (optional): Filter by site

**Response**: `Array<{ id, tenant_id, tenant_name, site_id, site_name, note, op_type, created_at }>`

#### Create Note
```
POST /core/ops-notes
Content-Type: application/json

{
  "tenant_id": 1,
  "site_id": 1,
  "note": "Follow-up call scheduled for next Monday",
  "op_type": "follow_up"
}
```

**Op Types**: `reminder`, `follow_up`, `negotiation`, `closure`, `complaint`

---

## Import Endpoints (`/import`)

### Import Payments

#### Upload CSV Payments
```
POST /import/payments
Content-Type: application/json

{
  "rows": [
    {
      "tenant_id": 1,
      "paid_at": "2024-01-15",
      "amount": 500000,
      "mode": "cash",
      "channel": "counter",
      "external_ref": "REC-001"
    },
    {
      "tenant_id": 2,
      "paid_at": "2024-01-20",
      "amount": 250000,
      "mode": "orange_money"
    }
  ],
  "source_file": "january_payments.csv"
}
```

**Response**:
```json
{
  "success": true,
  "import_run_id": 123,
  "summary": {
    "total": 2,
    "inserted": 2,
    "duplicated": 0,
    "failed": 0
  },
  "errors": []
}
```

**Features**:
- Automatic deduplication via SHA256 hash
- Transaction support (all rows inserted together)
- Per-row error tracking
- Duplicate detection prevents duplicate payments

#### Get Import History
```
GET /import/runs
```
**Response**: `Array<{ id, source_file, rows_total, rows_inserted, rows_duplicated, rows_failed, status, created_at }>`

#### Get Import Details
```
GET /import/runs/:id
```

---

## AI Endpoints (`/ai`)

### Contract Suggestions

#### Generate Suggestions
```
POST /ai/contract-suggest
Content-Type: application/json

{
  "variables": {
    "akig": {
      "nom": "AKIG Agency",
      "address": "Conakry"
    },
    "client": {
      "nom": "Mohamed Diallo",
      "phone": "+224 612345678",
      "revenue": 1000000
    },
    "contract": {
      "loyer": 500000,
      "caution": 500000,
      "garantie": "yes"
    }
  }
}
```

**Response**:
```json
[
  {
    "type": "risk",
    "severity": "critical",
    "message": "Loan-to-income ratio (50%) exceeds recommended threshold"
  },
  {
    "type": "missing_info",
    "severity": "warning",
    "message": "Client professional information missing"
  }
]
```

**Suggestion Types**:
- `risk` - Financial or contract risk
- `missing_info` - Missing required information
- `recommendation` - Suggested improvements
- `validation` - Data validation issue
- `document` - Document retention recommendation

**Severity Levels**: `critical`, `warning`, `info`

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional context (if available)"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `404` - Not found
- `500` - Server error

### Validation Errors
```json
{
  "error": "Validation failed",
  "fields": {
    "full_name": "At least 3 characters required",
    "phone": "Invalid Guinea phone format"
  }
}
```

---

## Data Types

### Currency
- Guinean Francs (GNF)
- Always provided as number (e.g., 500000)
- Format with locale: `new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF' }).format(amount)`

### Dates
- ISO 8601 format (YYYY-MM-DD)
- Timezone: UTC
- Example: "2024-01-15"

### Timestamps
- ISO 8601 format with timezone
- Example: "2024-01-15T14:30:45Z"

### Phone
- Guinea format: +224 followed by operator code (6, 62, 65, 66, 70, 80) and 7-8 digits
- Example: "+224 612345678"

---

## Rate Limiting

Rate limits apply to specific endpoints:
- Payment creation: 10 requests per minute
- Export operations: 5 requests per minute
- Search: 30 requests per minute
- Webhook: 20 requests per minute

---

## CSRF Protection

All POST/PUT/DELETE requests require CSRF token in headers:
```
x-csrf: <token_value>
```

Token is automatically read from `window.__CSRF__` and added by the client.

---

## Pagination (Future)

Endpoints support optional pagination:
```
GET /core/tenants?page=1&pageSize=20
```

---

## Filtering Examples

### Filter by Multiple Fields
```
GET /core/contracts?tenant_id=1&status=active
GET /core/payments?contract_id=1&year=2024
GET /core/tenants?site_id=1&active=true
```

### Search (Frontend-side)
- Search logic implemented in React components
- Filters by: name, reference, phone, email
- Case-insensitive matching

---

## Integration Guide

### Using the TypeScript Client

```typescript
import { req } from '../api/client';

// List tenants
const tenants = await req('/core/tenants', { method: 'GET' });

// Create tenant
const newTenant = await req('/core/tenants', {
  method: 'POST',
  body: JSON.stringify({ full_name: 'Name', phone: '+224...' })
});

// Import payments
const result = await req('/import/payments', {
  method: 'POST',
  body: JSON.stringify({ rows: [...], source_file: 'file.csv' })
});
```

### Error Handling

```typescript
try {
  const data = await req('/core/tenants', { method: 'GET' });
} catch (error) {
  console.error('Failed:', error.message);
  // Error includes method, path, status code, and response body
}
```

