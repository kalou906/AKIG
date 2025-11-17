## AKIG API Documentation

### Overview

AKIG is a comprehensive property management system with full GDPR compliance, audit logging, sentiment analysis, and document management.

**Base URL:** `http://localhost:4002/api`

**Authentication:** JWT Bearer token

---

## 📚 API Endpoints

### Authentication (`/auth`)

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+33612345678"
}

Response: 201
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response: 200
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { ... }
}
```

---

### Feedback (`/feedback`)

#### Create Feedback
```
POST /feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "agencyId": 1,
  "propertyId": 1,
  "categoryId": 1,
  "score": 8,
  "comment": "Excellent service, très rapide!",
  "title": "Great experience"
}

Response: 201
{
  "success": true,
  "data": {
    "id": 1,
    "sentiment": "positive",
    "sentiment_score": 0.8,
    ...
  }
}
```

#### Get Feedback
```
GET /feedback/:id
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": { ... }
}
```

#### List Feedback
```
GET /feedback?status=pending&limit=50
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [ ... ],
  "count": 10
}
```

---

### Modules (`/modules`)

#### Get All Modules
```
GET /modules
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "tax_pro",
      "name": "Tax Professional Module",
      "enabled": true
    },
    ...
  ]
}
```

#### Toggle Module
```
POST /modules/toggle
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "tax_pro",
  "enabled": true
}

Response: 200
{
  "success": true,
  "data": { ... }
}
```

---

### Owner Portal (`/owner`)

#### Get Overview
```
GET /owner/overview
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "properties": [ ... ],
    "propertyCount": 5,
    "cashflow": 15000,
    "arrears": 2500,
    "expectedRent": 8000,
    "receivedRent": 7500
  }
}
```

#### Get Properties
```
GET /owner/properties
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [ ... ],
  "count": 5
}
```

#### Get Property Details
```
GET /owner/properties/:propertyId
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "property": { ... },
    "tenants": [ ... ],
    "contracts": [ ... ],
    "invoices": [ ... ]
  }
}
```

---

### Audit (`/audit`)

#### Get Audit Logs
```
GET /audit/logs?action=UPDATE&status=success&limit=100
Authorization: Bearer {token}
(Admin only)

Response: 200
{
  "success": true,
  "data": [ ... ],
  "count": 25
}
```

#### Get Audit Trail
```
GET /audit/trail/contracts/123
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [
    {
      "id": 1,
      "actor_name": "John Doe",
      "action": "UPDATE",
      "ts": "2025-10-25T10:30:00Z",
      "verified": true
    },
    ...
  ]
}
```

#### Get Recent Activity
```
GET /audit/recent?limit=50
Authorization: Bearer {token}
(Admin only)

Response: 200
{
  "success": true,
  "data": [ ... ],
  "count": 50
}
```

#### Get Compliance Report
```
GET /audit/compliance?fromDate=2025-01-01&toDate=2025-10-25
Authorization: Bearer {token}
(Admin only)

Response: 200
{
  "success": true,
  "data": [ ... ],
  "count": 294
}
```

---

### Document Management - GED (`/ged`)

#### Upload Document
```
POST /ged/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

- file: (binary)
- name: "contract_2025.pdf"
- metadata: {"type": "contract", "client": "John Doe"}

Response: 201
{
  "success": true,
  "data": {
    "id": 1,
    "name": "contract_2025.pdf",
    "version": 1,
    "checksum": "abc123..."
  }
}
```

#### Get Document Info
```
GET /ged/1
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "id": 1,
    "name": "contract_2025.pdf",
    "version": 2,
    "version_count": 2,
    "latest_version_path": "/uploads/...",
    ...
  }
}
```

#### Create New Version
```
POST /ged/1/version
Authorization: Bearer {token}
Content-Type: multipart/form-data

- file: (binary)
- notes: "Updated contract terms"

Response: 201
{
  "success": true,
  "data": {
    "version": 2,
    "checksum": "def456..."
  }
}
```

#### Get Version History
```
GET /ged/1/history?limit=20
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [
    {
      "version": 2,
      "created_at": "2025-10-25T10:30:00Z",
      "notes": "Updated contract terms"
    },
    {
      "version": 1,
      "created_at": "2025-10-24T09:15:00Z"
    }
  ],
  "count": 2
}
```

#### Restore Previous Version
```
POST /ged/1/restore/1
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "version": 3,
    "notes": "Restored from version 1"
  }
}
```

#### Share Document
```
POST /ged/1/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "sharedWithUserId": 5,
  "permission": "view",
  "expiresAt": "2025-12-31T23:59:59Z"
}

Response: 201
{
  "success": true,
  "data": { ... }
}
```

#### Get Shared Documents
```
GET /ged/shared/with-me?limit=50
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [ ... ],
  "count": 12
}
```

#### Get Access Statistics
```
GET /ged/1/stats
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "totalAccesses": 42,
    "uniqueUsers": 8,
    "downloads": 15,
    "views": 27,
    "lastAccessed": "2025-10-25T14:20:00Z"
  }
}
```

---

### Archive & PDF/A (`/archive`)

#### Archive Document
```
POST /archive/document/1
Authorization: Bearer {token}
(Admin only)
Content-Type: application/json

{
  "retentionYears": 10
}

Response: 201
{
  "success": true,
  "data": {
    "format": "PDF/A-1b",
    "checksum": "xyz789...",
    "retention_until": "2035-10-25T00:00:00Z",
    "timestamp": {
      "timestamp": "2025-10-25T14:20:00Z",
      "signature": "..."
    }
  }
}
```

#### Create Timestamp
```
POST /archive/timestamp
Authorization: Bearer {token}
Content-Type: application/json

{
  "payload": {
    "contract_id": 123,
    "amount": 5000,
    "date": "2025-10-25"
  }
}

Response: 201
{
  "success": true,
  "data": {
    "timestamp": "2025-10-25T14:20:00Z",
    "signature": "abc123def456...",
    "payload_hash": "xyz789..."
  }
}
```

#### Verify Timestamp
```
POST /archive/verify-timestamp
Authorization: Bearer {token}
Content-Type: application/json

{
  "payload": { ... },
  "timestamp": { ... }
}

Response: 200
{
  "success": true,
  "data": {
    "valid": true,
    "timestamp": "2025-10-25T14:20:00Z"
  }
}
```

---

### Privacy & GDPR (`/privacy`)

#### Export Personal Data
```
POST /privacy/export
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "export_timestamp": "2025-10-25T14:20:00Z",
    "user_info": { ... },
    "data": {
      "contracts": [ ... ],
      "properties": [ ... ],
      "payments": [ ... ],
      "invoices": [ ... ],
      "feedback": [ ... ],
      "audit_trail": [ ... ]
    },
    "summary": {
      "total_contracts": 12,
      "total_properties": 5,
      ...
    }
  }
}
```

#### Delete Account
```
POST /privacy/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirmation": true,
  "password": "user_password"
}

Response: 200
{
  "success": true,
  "message": "Account deleted. Data anonymized.",
  "deleted_at": "2025-10-25T14:20:00Z"
}
```

#### Rectify Personal Data
```
POST /privacy/rectify
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+33687654321"
}

Response: 200
{
  "success": true,
  "data": { ... }
}
```

#### Update Consent
```
POST /privacy/consent
Authorization: Bearer {token}
Content-Type: application/json

{
  "marketing": false,
  "analytics": true,
  "third_party": false
}

Response: 200
{
  "success": true,
  "data": { ... }
}
```

#### Get Consent Status
```
GET /privacy/consent
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "consent_marketing": false,
    "consent_analytics": true,
    "consent_third_party": false,
    "consent_updated_at": "2025-10-25T14:20:00Z"
  }
}
```

#### Get Data Processing Info
```
GET /privacy/data-processing

Response: 200
{
  "success": true,
  "data": {
    "data_controller": "AKIG",
    "privacy_officer": "privacy@akig.app",
    "legal_basis": [ ... ],
    "rights": [ ... ],
    "data_retention_policy": { ... }
  }
}
```

---

## 🔒 Authentication

All endpoints (except `/auth/register` and `/auth/login`) require a Bearer token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire in **24 hours**.

---

## ⚠️ Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📊 Audit & Compliance

All API actions are logged in the audit trail with:
- User ID and name
- Action type (CREATE, UPDATE, DELETE, ACCESS)
- Entity type and ID
- Timestamp
- Digital signature (HMAC-SHA256)
- Verification status

Access audit trail:
```
GET /audit/trail/:entity/:entityId
```

---

## 🔐 GDPR Compliance

AKIG implements full GDPR compliance:

- **Art. 15** - Right to access (export endpoint)
- **Art. 16** - Right to rectification
- **Art. 17** - Right to erasure (anonymization)
- **Art. 18** - Right to restrict processing
- **Art. 20** - Right to data portability (export as JSON)
- **Art. 21** - Right to object

All GDPR requests are logged and must be completed within 30 days.

---

## 📚 Swagger UI

Interactive API documentation available at:

```
http://localhost:4002/api/docs
```

Download OpenAPI spec:

```
http://localhost:4002/api/docs/spec
```

---

## 🚀 Example: Complete Workflow

### 1. Register & Login
```bash
# Register
curl -X POST http://localhost:4002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_pass",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:4002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_pass"
  }'
```

### 2. Create Feedback
```bash
curl -X POST http://localhost:4002/api/feedback \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 9,
    "comment": "Excellent service!"
  }'
```

### 3. Upload Document
```bash
curl -X POST http://localhost:4002/api/ged/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@contract.pdf" \
  -F "name=Contract 2025"
```

### 4. Export Personal Data (GDPR)
```bash
curl -X POST http://localhost:4002/api/privacy/export \
  -H "Authorization: Bearer {token}" \
  > my_data.json
```

---

## 📧 Support

For API issues or questions:
- Email: support@akig.app
- Documentation: https://akig.app/docs
- GitHub: https://github.com/akig/api

---

**Last Updated:** October 25, 2025
**Version:** 1.0.0
