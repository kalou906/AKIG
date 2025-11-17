# 🔧 AKIG IMPLEMENTATION GUIDE - LEGACY IMMOBILIER LOYER ENDPOINTS

## PART 1: CONTRACTS - ADVANCED LIFECYCLE MANAGEMENT

### Endpoint 1: Contract Renewal with Indexation
```
POST /api/contracts/:contractId/renew-with-indexation

REQUEST:
{
  "renewalDuration": 12,              // months
  "indexationType": "IRL",            // IRL, ICC, ILAT
  "newIndexValue": 132.5,             // Latest index value
  "lastIndexValue": 129.1,            // Previous index value
  "renewalDate": "2025-01-01",
  "autoRenewal": true,
  "noticeRequired": 3                 // months notice before expiry
}

RESPONSE:
{
  "success": true,
  "renewedContractId": 123,
  "indexationPercentage": 2.64,       // (132.5 - 129.1) / 129.1 * 100
  "newMonthlyRent": 1545000,          // Original rent * (1 + percentage)
  "newExpiryDate": "2026-01-01",
  "previousMonthlyRent": 1500000
}

DATABASE CHANGES:
- Update rental_contracts: expiry_date, monthly_rent, status='active'
- Insert INTO contract_history: type='renewal', changes_json
- Insert INTO rent_indexations: contract_id, old_rent, new_rent, index_type, date
```

### Endpoint 2: Final Settlement on Contract Termination
```
POST /api/contracts/:contractId/final-settlement

REQUEST:
{
  "terminationDate": "2025-12-31",
  "actualMoveOutDate": "2025-12-25",
  "depositReturnMethod": "transfer",  // cash, transfer, check
  "lastRentPaid": true,
  "damagesDocumented": true,
  "damageCost": 250000,               // GNF
  "cleaningCost": 150000,
  "utilities": {
    "water": 45000,
    "electricity": 78000
  }
}

RESPONSE:
{
  "settlementId": 456,
  "settlementDate": "2025-12-31",
  "financialSummary": {
    "totalDeposit": 1500000,
    "deductions": 473000,
    "returnAmount": 1027000,
    "breakdown": {
      "damages": 250000,
      "cleaning": 150000,
      "utilities": 73000
    }
  },
  "status": "pending_return",
  "returnDeadline": "2026-01-15"
}

DATABASE CHANGES:
- Insert INTO settlements: contract_id, calculations_json, status
- Insert INTO deposit_movements: type='return', amount, date
- Update rental_contracts: status='terminated', terminated_date
- Create settlement_journal entries for accounting
```

### Endpoint 3: Contract Rent Change
```
POST /api/contracts/:contractId/change-rent

REQUEST:
{
  "newMonthlyRent": 1600000,
  "effectiveDate": "2025-06-01",
  "reason": "indexation",            // indexation, market_adjustment, negotiated
  "previousRent": 1500000,
  "indexationType": "IRL",
  "note": "Annual indexation IRL basis"
}

RESPONSE:
{
  "success": true,
  "rentChangeId": 789,
  "previousRent": 1500000,
  "newRent": 1600000,
  "increasePercentage": 6.67,
  "effectiveDate": "2025-06-01",
  "affectsMonthOf": "June 2025"
}

DATABASE CHANGES:
- Insert INTO rent_changes: contract_id, old_rent, new_rent, effective_date, reason
- Insert INTO contract_history with change details
```

---

## PART 2: CHARGES & UTILITIES - ADVANCED SETTLEMENT

### Endpoint 4: Annual Charge Settlement
```
POST /api/charges/:contractId/annual-settlement

REQUEST:
{
  "year": 2024,
  "settlementPeriod": "2024-01-01 to 2024-12-31",
  "charges": {
    "water": {
      "provisioned_total": 600000,    // 12 * 50000 monthly
      "actual_total": 587000,         // From bills
      "is_estimate": false
    },
    "electricity": {
      "provisioned_total": 1200000,
      "actual_total": 1256000,
      "is_estimate": false
    },
    "coproperty": {
      "provisioned_total": 900000,
      "actual_total": 920000,
      "is_estimate": false
    }
  }
}

RESPONSE:
{
  "settlementId": 555,
  "year": 2024,
  "summary": {
    "totalProvisioned": 2700000,
    "totalActual": 2763000,
    "difference": 63000,              // Over-charged or under-charged
    "tenantOwes": 63000,              // If difference > 0
    "creditForTenant": 0,
    "status": "pending_payment"
  },
  "breakdown": {
    "water": {
      "provisioned": 600000,
      "actual": 587000,
      "difference": -13000             // Tenant was over-provisioned
    },
    "electricity": {
      "provisioned": 1200000,
      "actual": 1256000,
      "difference": 56000              // Tenant under-provisioned
    },
    "coproperty": {
      "provisioned": 900000,
      "actual": 920000,
      "difference": 20000              // Tenant under-provisioned
    }
  },
  "documentGenerated": "/documents/settlement_2024_contract_123.pdf"
}

DATABASE CHANGES:
- Insert INTO charge_settlements: contract_id, year, calculations_json
- Insert INTO charge_adjustments: contract_id, amount, type='settlement', due_date
- Create accounting entries for reconciliation
- Can trigger automatic invoice generation
```

### Endpoint 5: Get Charges Breakdown
```
GET /api/charges/:contractId/list

RESPONSE:
{
  "contractId": 123,
  "monthly": [
    {
      "id": 1,
      "type": "water",
      "amount": 50000,
      "isEstimate": false,
      "startDate": "2024-01-01",
      "endDate": null,
      "lastUpdated": "2024-09-15"
    },
    {
      "id": 2,
      "type": "electricity",
      "amount": 100000,
      "isEstimate": false,
      "startDate": "2024-01-01",
      "endDate": null
    }
  ],
  "total_monthly_charges": 150000,
  "as_percentage_of_rent": "10%",
  "settlements": [
    {
      "year": 2023,
      "status": "settled",
      "adjustment": -25000
    }
  ]
}
```

---

## PART 3: PAYMENTS & RECONCILIATION

### Endpoint 6: Record Payment with Full Details
```
POST /api/payments/record-payment

REQUEST:
{
  "contractId": 123,
  "amount": 1500000,
  "paymentDate": "2025-01-05",
  "paymentMethod": "bank_transfer",  // check, transfer, cash, card
  "reference": "TRANSFER-2025-001",
  "bankDetails": {
    "bankName": "Banque Internationale",
    "accountNumber": "***5678",
    "transactionId": "TRX-20250105-001"
  },
  "coveredPeriod": {
    "startMonth": "January 2025",
    "endMonth": "January 2025"
  },
  "paidBy": "locataire",            // locataire, guarantor, autre
  "status": "received"               // received, verified, reconciled
}

RESPONSE:
{
  "paymentId": 999,
  "contractId": 123,
  "amount": 1500000,
  "paymentDate": "2025-01-05",
  "receiptNumber": "RCP-2025-001-123",
  "status": "received",
  "coveredMonth": "January 2025",
  "nextPaymentDue": "2025-02-01"
}

DATABASE CHANGES:
- Insert INTO rent_payments: all details
- Update contract payment_status
- Create accounting entry (debit cash, credit income)
- Generate receipt automatically
```

### Endpoint 7: Payment Reconciliation
```
PATCH /api/payments/:paymentId/reconcile

REQUEST:
{
  "bankStatementAmount": 1500000,
  "bankStatementDate": "2025-01-06",
  "bankStatementReference": "BANK-2025-001-500",
  "reconciliationNotes": "Verified on bank statement",
  "reconciliationStatus": "verified"
}

RESPONSE:
{
  "paymentId": 999,
  "reconciliationStatus": "verified",
  "reconciliationDate": "2025-01-06",
  "accountingStatus": "posted_to_GL"
}

DATABASE CHANGES:
- Update rent_payments: reconciliation_status, reconciliation_date, bank_reference
- Create bank_reconciliation record
- Lock payment from modifications
```

### Endpoint 8: Send Payment Reminder
```
POST /api/reminders/send-payment-due

REQUEST:
{
  "contractId": 123,
  "daysBeforeDue": 3,
  "reminderType": "email",          // email, sms, both
  "customMessage": "Loyer dû le 1er du mois",
  "attachReceipt": true,
  "sendToGuarantor": false
}

RESPONSE:
{
  "reminderId": 777,
  "status": "sent",
  "sentTo": "tenant@email.com",
  "sentDate": "2025-01-29",
  "nextReminder": null,
  "deliveryStatus": "delivered"
}

DATABASE CHANGES:
- Insert INTO reminders: contract_id, type, status, sent_date
- Insert INTO communication_log for audit
```

---

## PART 4: DEPOSIT GUARANTEE MANAGEMENT

### Endpoint 9: Manage Security Deposit
```
PATCH /api/contracts/:contractId/deposit-guarantee

REQUEST:
{
  "action": "hold",                 // hold, return, deduct, transfer
  "amount": 1500000,
  "reason": "security_deposit_hold", // security_deposit_hold, damage_deduction, cleaning
  "holdingEntity": "agency",        // agency, owner, court
  "interestApplied": false,
  "interestRate": 0,
  "notes": "Deposit held by agency as per contract"
}

RESPONSE:
{
  "depositId": 444,
  "contractId": 123,
  "originalAmount": 1500000,
  "currentStatus": "held",
  "heldBy": "agency",
  "heldDate": "2024-12-15",
  "projectedReturnDate": "2026-01-31",
  "balance": 1500000
}

DATABASE CHANGES:
- Insert/Update INTO security_deposits
- Update rental_contracts: security_deposit_status
```

### Endpoint 10: Deposit Return Processing
```
POST /api/contracts/:contractId/deposit-return

REQUEST:
{
  "depositAmount": 1500000,
  "returnMethod": "bank_transfer",  // cash, check, transfer
  "bankAccount": {
    "iban": "GN...",
    "beneficiaryName": "Tenant Name"
  },
  "deductions": {
    "damages": 250000,
    "cleaning": 150000,
    "unpaidCharges": 100000
  },
  "returnDate": "2026-02-15"
}

RESPONSE:
{
  "returnId": 555,
  "originalDeposit": 1500000,
  "totalDeductions": 500000,
  "netReturnAmount": 1000000,
  "returnMethod": "bank_transfer",
  "status": "pending_transfer",
  "expectedReceiptDate": "2026-02-20"
}

DATABASE CHANGES:
- Insert INTO deposit_returns
- Create journal entries (debit security_deposit_liability, credit bank)
- Update contract status to deposit_returned
```

---

## PART 5: TENANT DOCUMENTS & PROFILES

### Endpoint 11: Upload Tenant Document
```
POST /api/tenants/:tenantId/documents/upload

REQUEST (multipart/form-data):
- file: [binary]
- documentType: "id_card", "proof_of_income", "employment_letter", "bank_statement", "signature"
- expiryDate: "2026-12-31" (optional)
- uploadedBy: "admin"
- description: "National ID card front and back"

RESPONSE:
{
  "documentId": 333,
  "tenantId": 42,
  "documentType": "id_card",
  "fileName": "tenant_42_id_card.pdf",
  "fileSize": 2456789,
  "uploadDate": "2025-01-30",
  "expiryDate": "2026-12-31",
  "status": "uploaded",
  "downloadUrl": "/documents/333/download"
}

DATABASE CHANGES:
- Insert INTO tenant_documents
- Store file in secure storage (encrypted)
- Create document audit log
```

### Endpoint 12: Get Tenant Full Profile
```
GET /api/tenants/:tenantId/full-profile

RESPONSE:
{
  "tenantId": 42,
  "personalInfo": {
    "firstName": "Ahmed",
    "lastName": "Sow",
    "email": "ahmed.sow@email.com",
    "phone": "+224 622 123 456",
    "dateOfBirth": "1985-05-20",
    "nationalId": "AL1234567"
  },
  "documents": [
    {
      "id": 333,
      "type": "id_card",
      "uploadDate": "2025-01-30",
      "expiryDate": "2026-12-31",
      "status": "valid"
    }
  ],
  "contracts": [
    {
      "id": 123,
      "property": "Apartment 5B, Downtown",
      "startDate": "2024-01-01",
      "endDate": null,
      "status": "active",
      "monthlyRent": 1500000
    }
  ],
  "paymentHistory": {
    "totalPaid": 15000000,
    "averageDaysLate": 2,
    "missedPayments": 0,
    "currentArrears": 0
  },
  "guarantor": {
    "id": 88,
    "name": "Mama Sow",
    "relationship": "mother",
    "phone": "+224 622 987 654",
    "documentId": 334
  },
  "riskAssessment": {
    "score": 85,
    "level": "low",
    "factors": ["reliable_payment", "long_tenancy"]
  }
}
```

### Endpoint 13: Add/Update Guarantor
```
POST /api/tenants/:tenantId/guarantor

REQUEST:
{
  "guarantorName": "Mama Sow",
  "relationship": "mother",          // parent, spouse, family, friend, employer
  "phone": "+224 622 987 654",
  "email": "mama.sow@email.com",
  "address": "123 Main Street, Conakry",
  "documentType": "id_card",
  "documentFile": [binary],
  "liabilityLimit": null,            // optional max amount
  "signatureDate": "2024-01-01"
}

RESPONSE:
{
  "guarantorId": 88,
  "tenantId": 42,
  "name": "Mama Sow",
  "relationship": "mother",
  "documentId": 334,
  "status": "active",
  "linkedDate": "2024-01-01"
}

DATABASE CHANGES:
- Insert/Update INTO guarantors
- Link to rental_contracts
- Store guarantor signature/commitment
```

---

## PART 6: FINANCIAL REPORTS

### Endpoint 14: Generate Fiscal Declaration Report
```
POST /api/reports/fiscal-declaration

REQUEST:
{
  "year": 2024,
  "reportFormat": "pdf",            // pdf, excel, csv
  "properties": [123, 124, 125],    // Optional: specific properties
  "includeDetailedBreakdown": true
}

RESPONSE:
{
  "reportId": 666,
  "reportType": "fiscal_declaration",
  "year": 2024,
  "generatedDate": "2025-01-30",
  "downloadUrl": "/reports/666/download",
  "fileFormat": "pdf",
  "filePath": "/storage/reports/fiscal_2024_001.pdf",
  "summary": {
    "grossRentalIncome": 18000000,
    "totalExpenses": 3500000,
    "netIncome": 14500000,
    "taxableIncome": 14500000,
    "estimatedTax": 2175000       // 15% for Guinea
  }
}

DATABASE CHANGES:
- Insert INTO financial_reports
- Cache report for future reference
- Create audit log
```

### Endpoint 15: Generate Property Performance Report
```
GET /api/reports/property-pdf/:propertyId?period=2024

RESPONSE:
{
  "reportId": 777,
  "propertyId": 123,
  "propertyName": "Downtown Apartment",
  "period": "2024",
  "metrics": {
    "occupancyRate": 95.8,          // %
    "occupiedMonths": 11.5,         // 12 months
    "vacancyMonths": 0.5,
    "totalRentalIncome": 18000000,
    "avgMonthlyIncome": 1500000,
    "totalExpenses": 3500000,
    "netIncome": 14500000,
    "roi": 9.67,                     // %
    "capRate": 12.5
  },
  "tenants": [
    {
      "name": "Ahmed Sow",
      "occupancyStart": "2024-01-01",
      "occupancyEnd": null,
      "monthsPaid": 12,
      "daysLate": 2,
      "riskLevel": "low"
    }
  ],
  "downloadUrl": "/reports/777/download"
}
```

---

## PART 7: SYSTEM CONFIGURATION

### Endpoint 16: Get Charge Types Configuration
```
GET /api/settings/charges-types

RESPONSE:
{
  "chargeTypes": [
    {
      "id": 1,
      "code": "water",
      "label": "Eau",
      "description": "Water consumption",
      "isActive": true,
      "isEstimable": true,
      "frequency": "monthly"
    },
    {
      "id": 2,
      "code": "electricity",
      "label": "Électricité",
      "isActive": true,
      "isEstimable": true,
      "frequency": "monthly"
    },
    {
      "id": 3,
      "code": "coproperty",
      "label": "Copropriété",
      "isActive": true,
      "isEstimable": false,
      "frequency": "monthly"
    }
  ]
}
```

### Endpoint 17: Update Index Values (IRL, ICC)
```
POST /api/settings/index-values/update

REQUEST:
{
  "indexType": "IRL",               // IRL, ICC, ILAT
  "newValue": 135.2,
  "effectiveDate": "2025-01-01",
  "previousValue": 132.5
}

RESPONSE:
{
  "id": 999,
  "indexType": "IRL",
  "previousValue": 132.5,
  "newValue": 135.2,
  "effectiveDate": "2025-01-01",
  "changePercentage": 2.04,
  "status": "active"
}

DATABASE CHANGES:
- Insert INTO index_values_history
- Can trigger contract renewal calculations
```

---

## IMPLEMENTATION ORDER (Recommended)

**Sprint 1 (Week 1-2):**
1. Contract Renewal (Endpoint 1)
2. Annual Settlement (Endpoint 4)
3. Deposit Management (Endpoints 9, 10)

**Sprint 2 (Week 3-4):**
4. Payment Recording (Endpoint 6)
5. Reconciliation (Endpoint 7)
6. Reminders (Endpoint 8)

**Sprint 3 (Week 5-6):**
7. Tenant Documents (Endpoints 11, 12, 13)
8. Fiscal Reports (Endpoints 14, 15)

**Sprint 4 (Week 7):**
9. System Configuration (Endpoints 16, 17)

---

## KEY DATABASE TABLES NEEDED

```sql
-- Rent indexations history
CREATE TABLE rent_indexations (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES rental_contracts(id),
  index_type VARCHAR(10),
  old_rent DECIMAL(12,2),
  new_rent DECIMAL(12,2),
  old_index_value DECIMAL(8,2),
  new_index_value DECIMAL(8,2),
  percentage_change DECIMAL(5,2),
  effective_date DATE,
  created_at TIMESTAMP
);

-- Charge settlements
CREATE TABLE charge_settlements (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES rental_contracts(id),
  settlement_year INTEGER,
  calculations_json JSONB,
  adjustment_amount DECIMAL(12,2),
  status VARCHAR(20),
  created_at TIMESTAMP
);

-- Deposit movements
CREATE TABLE deposit_movements (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES rental_contracts(id),
  movement_type VARCHAR(20),  -- hold, deduct, return
  amount DECIMAL(12,2),
  reason TEXT,
  movement_date DATE,
  created_at TIMESTAMP
);

-- Tenant documents
CREATE TABLE tenant_documents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  document_type VARCHAR(30),
  file_path VARCHAR(255),
  file_size INTEGER,
  upload_date TIMESTAMP,
  expiry_date DATE,
  status VARCHAR(20),
  uploaded_by INTEGER
);
```

---

**Total Effort:** ~120 hours for all 17 endpoints + database setup  
**Expected Completion:** 4-6 weeks  
**Impact:** Complete parity with legacy system + superior architecture
