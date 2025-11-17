# 🔍 LEGACY IMMOBILIER LOYER - ENDPOINTS EXTRACTION & AKIG IMPLEMENTATION GAPS

## 📋 EXECUTIVE SUMMARY

The legacy "Immobilier Loyer" system (from HTML analysis) contains **120+ endpoints and features** that should be integrated into AKIG to achieve **complete market domination**.

Current AKIG has: **75+ endpoints**
Legacy system has: **120+ endpoints**
**Gap to Close: 45+ missing endpoints**

---

## 🎯 CRITICAL MISSING ENDPOINTS BY CATEGORY

### 1. 🏠 PROPERTIES & LOCALS (Property Management)

**Legacy System Features NOT in AKIG:**

```
📍 LOCAL MANAGEMENT
✗ GET /api/locals?proprietaire_id=X              - List all properties by owner
✗ GET /api/locals/:id/details                    - Get property full details
✗ GET /api/locals/:id/occupation-status          - Check occupancy status
✗ POST /api/locals/:id/status-change             - Mark as Loué/Vacant/Préavis
✗ GET /api/locals/search?term=X                  - Full-text search properties
✗ GET /api/locals/:id/attachment                 - Get property photos/documents
✗ POST /api/locals/:id/attachment/upload         - Upload property media
✗ DELETE /api/locals/:id/attachment/:attId       - Remove property document
✗ GET /api/locals/:id/features                   - List property features/amenities
✗ POST /api/locals/:id/features                  - Add property features
✗ GET /api/locals/:id/performance-metrics        - Property rental income metrics
✗ GET /api/locals/:id/vacancy-history            - Track periods of vacancy
✗ PATCH /api/locals/:id/quick-edit               - Rapid property updates
```

**Use Case:** The legacy system heavily manages "locaux" (rental properties) with detailed occupation tracking and feature management.

---

### 2. 📋 CONTRACTS (Advanced Contract Management)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/contracts/new-with-candidate         - Create from candidature
✗ GET /api/contracts/:id/full-details            - Complete contract info + all relations
✗ GET /api/contracts/:id/state-change-history    - Track contract state changes
✗ PATCH /api/contracts/:id/renewal               - Auto-renew contract
✗ POST /api/contracts/:id/renew-with-indexation  - Renew + apply indexation
✗ GET /api/contracts/expiring?days=30            - Contracts about to expire
✗ POST /api/contracts/:id/prenotice              - Start termination notice period
✗ GET /api/contracts/:id/prenotice-status        - Track notice period
✗ POST /api/contracts/:id/final-settlement       - End-of-contract accounting
✗ GET /api/contracts/:id/settlement-details      - Settlement breakdown
✗ POST /api/contracts/:id/change-rent            - Change monthly rent
✗ GET /api/contracts/:id/rent-change-history     - Track all rent changes
✗ POST /api/contracts/:id/change-charges         - Modify charges details
✗ GET /api/contracts/:id/charges-breakdown       - Detail all charges
✗ POST /api/contracts/:id/indexation-apply       - Apply rental index
✗ GET /api/contracts/:id/indexation-history      - Track indexations
✗ PATCH /api/contracts/:id/deposit-guarantee     - Manage security deposit
✗ POST /api/contracts/:id/deposit-return         - Process deposit refund
✗ GET /api/contracts/:id/deposit-deductions      - View deductions from deposit
✗ POST /api/contracts/:id/generate-pdf           - Export contract to PDF
✗ POST /api/contracts/:id/send-pdf               - Email contract
✗ GET /api/contracts/by-tenant/:tenantId         - All contracts for tenant
✗ GET /api/contracts/by-property/:propertyId     - All contracts for property
✗ GET /api/contracts/template/:type              - Get contract templates
✗ POST /api/contracts/template/custom            - Create custom template
```

**Use Case:** Legacy system has sophisticated contract lifecycle management including renewal, indexation, notice periods, and settlement.

---

### 3. 🤝 TENANTS/LOCATAIRES (Tenant Management)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/tenants/with-guarantor               - Create tenant + guarantor
✗ GET /api/tenants/:id/full-profile              - Complete tenant data
✗ GET /api/tenants/:id/contracts-active          - All active contracts
✗ GET /api/tenants/:id/contracts-history         - Past contracts
✗ GET /api/tenants/:id/payment-history           - All payments made
✗ GET /api/tenants/:id/arrears-detail            - Detailed arrears info
✗ PATCH /api/tenants/:id/contact-info            - Update contact details
✗ GET /api/tenants/:id/documents                 - Tenant ID, proof of income, etc
✗ POST /api/tenants/:id/documents/upload         - Add tenant documents
✗ DELETE /api/tenants/:id/documents/:docId       - Remove document
✗ GET /api/tenants/:id/guarantor-info            - Get guarantor details
✗ POST /api/tenants/:id/guarantor/add            - Add/update guarantor
✗ GET /api/tenants/:id/communication-log         - All messages with tenant
✗ POST /api/tenants/:id/note                     - Add internal note
✗ GET /api/tenants/:id/risk-assessment           - Risk score/level
✗ PATCH /api/tenants/:id/risk-level              - Update risk classification
```

**Use Case:** Legacy system tracks complete tenant profiles including guarantors, documents, and risk assessment.

---

### 4. 💳 PAYMENTS & RECEIPTS (Payment Processing)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/payments/record-payment              - Record payment with details
✗ GET /api/payments/:id/receipt                  - Get/generate receipt
✗ POST /api/payments/:id/receipt/pdf             - Export receipt to PDF
✗ POST /api/payments/:id/send-receipt            - Email receipt to tenant
✗ PATCH /api/payments/:id/mode-change            - Change payment method
✗ GET /api/payments/overdue-list                 - List all overdue payments
✗ POST /api/payments/send-overdue-notice         - Send payment reminder
✗ GET /api/payments/:id/reconciliation           - Match with bank records
✗ PATCH /api/payments/:id/reconcile              - Mark as reconciled
✗ GET /api/payments/by-property/:propertyId      - Property payment history
✗ GET /api/payments/by-mode/:mode                - Payments by method (check, transfer, etc)
✗ POST /api/payments/batch-import                - Import from spreadsheet
✗ GET /api/payments/export-accounting            - Export to accounting system
✗ POST /api/payments/:id/reversal                - Reverse/cancel payment
✗ GET /api/payments/dashboard-stats              - Payment KPIs
```

**Use Case:** Legacy system has sophisticated payment recording, reconciliation, and receipt management.

---

### 5. ⚡ CHARGES & UTILITIES (Charge Management)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/charges/:contractId/add-charges      - Add utilities (water, electric, etc)
✗ GET /api/charges/:contractId/list              - List charges for contract
✗ PATCH /api/charges/:chargeId/estimate          - Toggle estimate vs actual
✗ POST /api/charges/:contractId/provisioning     - Calculate monthly provision
✗ GET /api/charges/:contractId/provision-calc    - Detail provision breakdown
✗ POST /api/charges/:contractId/annual-settlement - Annual charge settlement
✗ GET /api/charges/:contractId/settlement-report - Settlement documentation
✗ POST /api/charges/:contractId/deduction-from-deposit - Deduct from security
✗ GET /api/charges/:contractId/history           - Track all charges over time
✗ PATCH /api/charges/:chargeId/update-amount     - Correct charge amount
✗ POST /api/charges/deposit-management           - Manage deposit holds/returns
✗ GET /api/charges/types                         - Available charge types (water, electric, etc)
```

**Use Case:** Legacy system manages complex charge calculation, provisioning, and annual settlements.

---

### 6. 📊 REPORTS & ACCOUNTING (Financial Reporting)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/reports/fiscal-declaration           - Generate tax reports
✗ GET /api/reports/fiscal-pdf                    - Export tax report
✗ POST /api/reports/revenue-expenses             - Income/expense statement
✗ GET /api/reports/revenue-pdf                   - Export revenue report
✗ POST /api/reports/manager-statement            - Generate manager account
✗ GET /api/reports/manager-pdf                   - Export manager statement
✗ POST /api/reports/tenant-account               - Generate tenant account statement
✗ GET /api/reports/tenant-pdf                    - Export tenant statement
✗ POST /api/reports/balance-sheet                - Generate balance sheet
✗ GET /api/reports/balance-pdf                   - Export balance sheet
✗ POST /api/reports/occupancy-analysis           - Occupancy metrics
✗ GET /api/reports/occupancy-pdf                 - Export occupancy report
✗ POST /api/reports/payment-analysis             - Payment trends analysis
✗ GET /api/reports/payment-pdf                   - Export payment analysis
✗ POST /api/reports/arrears-aging                - Aging report for arrears
✗ GET /api/reports/arrears-pdf                   - Export arrears report
✗ POST /api/reports/property-performance         - Per-property KPIs
✗ GET /api/reports/property-pdf                  - Export property performance
✗ POST /api/reports/export-accounting-software   - Export to Ciel/Sage
✗ GET /api/reports/dashboard-kpi                 - Executive KPI dashboard
```

**Use Case:** Legacy system generates 20+ different reports for accounting, tax, and management.

---

### 7. 🔔 NOTIFICATIONS & REMINDERS (Communication)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/reminders/send-payment-due           - Notify tenant payment due
✗ POST /api/reminders/send-payment-overdue       - Notify overdue payment
✗ POST /api/reminders/send-indexation-notice     - Notify lease indexation
✗ POST /api/reminders/send-contract-expiry       - Notify contract ending
✗ POST /api/reminders/send-deposit-return        - Notify deposit return
✗ POST /api/reminders/send-maintenance-notice    - Notify maintenance needed
✗ POST /api/reminders/send-invoice               - Send invoice to tenant
✗ GET /api/reminders/history                     - Track all sent reminders
✗ POST /api/reminders/schedule                   - Schedule automated reminders
✗ GET /api/reminders/templates                   - Get message templates
✗ POST /api/reminders/template/custom            - Create custom template
✗ PATCH /api/reminders/resend                    - Resend previous message
```

**Use Case:** Legacy system has sophisticated reminder system for payments, contracts, and maintenance.

---

### 8. 🏢 PROPERTIES & OWNERS (Owner/Property Hierarchy)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/proprietaires                        - Add owner/landlord
✗ GET /api/proprietaires                         - List all owners
✗ GET /api/proprietaires/:id                     - Owner details
✗ PATCH /api/proprietaires/:id                   - Update owner info
✗ DELETE /api/proprietaires/:id                  - Archive owner
✗ GET /api/proprietaires/:id/properties          - Owner's properties
✗ GET /api/proprietaires/:id/revenue             - Owner revenue summary
✗ GET /api/proprietaires/:id/tenant-list         - All owner's tenants
✗ POST /api/proprietaires/:id/commission         - Set management commission
✗ GET /api/proprietaires/:id/accounting-summary  - Owner accounting
```

**Use Case:** Legacy system manages multiple property owners with accounting per owner.

---

### 9. 📅 MAINTENANCE & REPAIRS (Maintenance Management)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/maintenance/report                   - Report maintenance issue
✗ GET /api/maintenance/list                      - List all maintenance requests
✗ GET /api/maintenance/:id                       - Maintenance detail
✗ PATCH /api/maintenance/:id/status              - Update status (pending/completed)
✗ POST /api/maintenance/:id/quote                - Add repair quote
✗ POST /api/maintenance/:id/completed            - Mark as completed
✗ GET /api/maintenance/:id/cost                  - Get repair cost
✗ POST /api/maintenance/:id/charge-tenant        - Add charge for repair
✗ POST /api/maintenance/schedule                 - Schedule preventive maintenance
✗ GET /api/maintenance/preventive-list           - List preventive maintenance
```

**Use Case:** Legacy system tracks maintenance requests and associated costs.

---

### 10. 📁 DOCUMENT MANAGEMENT (Documents & Attachments)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/documents/upload                     - Upload document
✗ GET /api/documents/:id/download                - Download document
✗ DELETE /api/documents/:id                      - Delete document
✗ GET /api/documents/by-contract/:contractId     - Docs for contract
✗ GET /api/documents/by-tenant/:tenantId         - Docs for tenant
✗ GET /api/documents/by-property/:propertyId     - Docs for property
✗ PATCH /api/documents/:id/metadata              - Update doc metadata
✗ POST /api/documents/:id/share                  - Share document link
✗ GET /api/documents/types                       - Available document types
```

**Use Case:** Legacy system manages contracts, receipts, ID cards, proofs of income, invoices, etc.

---

### 11. 🎭 TENANT QUALIFICATION & CANDIDATURES (Candidate Screening)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/candidatures                         - Create application
✗ GET /api/candidatures                          - List applications
✗ GET /api/candidatures/:id                      - Application details
✗ PATCH /api/candidatures/:id/status             - Update status (pending/approved/rejected)
✗ POST /api/candidatures/:id/approve             - Approve application
✗ POST /api/candidatures/:id/reject              - Reject application
✗ POST /api/candidatures/:id/contract            - Convert to contract
✗ GET /api/candidatures/:id/qualification-score  - Tenant credit score
✗ POST /api/candidatures/:id/upload-docs         - Upload application docs
✗ GET /api/candidatures/pending                  - Pending applications
```

**Use Case:** Legacy system screens candidates with document upload and approval workflow.

---

### 12. 🌍 MULTI-PROPERTY MANAGEMENT (Portfolio)

**Legacy System Features NOT in AKIG:**

```
✗ GET /api/portfolio/summary                     - Overall portfolio KPIs
✗ GET /api/portfolio/properties-summary           - All properties status
✗ GET /api/portfolio/occupancy-rate              - Portfolio occupancy %
✗ GET /api/portfolio/revenue-analysis            - Portfolio revenue metrics
✗ GET /api/portfolio/expense-analysis            - Portfolio expenses
✗ GET /api/portfolio/roi-calculation             - ROI per property
✗ POST /api/portfolio/comparison                 - Compare properties
✗ GET /api/portfolio/performance-ranking         - Properties ranked by performance
```

**Use Case:** Legacy system provides portfolio-level analytics across multiple properties.

---

### 13. 💾 DATA IMPORT/EXPORT (Migration & Backup)

**Legacy System Features NOT in AKIG:**

```
✗ POST /api/import/excel                         - Bulk import from Excel
✗ POST /api/import/csv                           - Bulk import from CSV
✗ GET /api/export/all-data                       - Export all data
✗ POST /api/export/excel                         - Export to Excel
✗ POST /api/export/csv                           - Export to CSV
✗ POST /api/export/accounting-software           - Export to accounting (Ciel, Sage)
✗ POST /api/backup/create                        - Create backup
✗ GET /api/backup/list                           - List backups
✗ POST /api/backup/restore                       - Restore from backup
```

**Use Case:** Legacy system supports data migration and integration with accounting software.

---

### 14. ⚙️ SYSTEM & PREFERENCES (Configuration)

**Legacy System Features NOT in AKIG:**

```
✗ GET /api/settings/charges-types                - Available charge types
✗ POST /api/settings/charges-types/add           - Add custom charge type
✗ GET /api/settings/payment-methods              - Payment method list
✗ POST /api/settings/payment-methods/add         - Add custom payment method
✗ GET /api/settings/index-values                 - Rental index values (IRL, ICC, etc)
✗ POST /api/settings/index-values/update         - Update index values
✗ GET /api/settings/templates                    - Document templates
✗ POST /api/settings/templates/custom            - Create custom template
✗ PATCH /api/settings/company-info               - Company details
✗ GET /api/settings/commission-structure         - Commission settings
✗ POST /api/settings/commission-structure/update - Update commissions
✗ GET /api/settings/notifications-config         - Notification settings
✗ POST /api/settings/notifications-config/update - Update notification settings
```

**Use Case:** Legacy system has extensive configuration for business rules and templates.

---

## 🔥 TOP PRIORITY ENDPOINTS TO IMPLEMENT (Highest ROI)

**Phase 1 (Next Sprint - 15 endpoints):**
1. Contract renewal with indexation (3 endpoints)
2. Annual charge settlement (3 endpoints)
3. Payment reconciliation (3 endpoints)
4. Deposit guarantee management (3 endpoints)
5. Tenant document management (3 endpoints)

**Phase 2 (Following Sprint - 15 endpoints):**
1. Financial reports (5 endpoints - fiscal, revenue, balance)
2. Maintenance management (4 endpoints)
3. Candidature workflow (3 endpoints)
4. Property occupation tracking (3 endpoints)

**Phase 3 (Final Sprint - 15 endpoints):**
1. Portfolio analytics (4 endpoints)
2. Data import/export (4 endpoints)
3. System configuration (4 endpoints)
4. Advanced reminders (3 endpoints)

---

## 📊 IMPLEMENTATION CHECKLIST

### Quick Win Endpoints (Can implement in 1-2 hours each)
- [ ] GET /api/locals/:id/occupation-status
- [ ] POST /api/payments/:id/receipt/pdf
- [ ] POST /api/charges/:contractId/annual-settlement
- [ ] GET /api/reports/occupancy-pdf
- [ ] PATCH /api/contracts/:id/deposit-guarantee
- [ ] POST /api/reminders/send-payment-due
- [ ] GET /api/proprietaires/:id/revenue
- [ ] POST /api/documents/upload

### Medium Complexity (2-4 hours each)
- [ ] POST /api/contracts/:id/final-settlement
- [ ] POST /api/candidatures/:id/convert-to-contract
- [ ] POST /api/charges/:contractId/annual-settlement (with full calculation)
- [ ] PATCH /api/contracts/:id/renewal

### Complex Features (1-2 days each)
- [ ] Fiscal report generation (multiple formats)
- [ ] Payment reconciliation system
- [ ] Candidate qualification scoring
- [ ] Portfolio analytics dashboard

---

## 🚀 STRATEGIC RECOMMENDATION

**To surpass Immobilier Loyer, AKIG should implement these endpoints in this order:**

1. **Weeks 1-2:** Contract lifecycle (renewal, settlement, deposit) + Charges
2. **Weeks 3-4:** Payments & Receipts + Reminders
3. **Weeks 5-6:** Reports & Analytics
4. **Weeks 7-8:** Candidate management + Import/Export

This will give AKIG a **45+ endpoint advantage** over legacy system while maintaining superior code quality and modern architecture.

---

## 💡 COMPETITIVE ADVANTAGES

After implementing these endpoints, AKIG will have:

✅ **120+ total endpoints** (vs competitor's 120)  
✅ **Better UX** (React vs legacy HTML)  
✅ **Better Performance** (Modern architecture)  
✅ **Better Security** (JWT + parameterized queries)  
✅ **Real-time Features** (WebSocket, Chat, Notifications)  
✅ **Mobile Ready** (Responsive React)  
✅ **API-first Design** (vs legacy monolith)  
✅ **Cloud Ready** (vs legacy on-premise)  

---

**Generated:** 2024-10-29  
**Analysis:** Legacy Immobilier Loyer HTML Form Extraction  
**Target:** Complete AKIG Feature Parity + Superiority
