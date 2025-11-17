---
title: "Quick Start Guide - AKIG Genius Features"
---

# 🚀 AKIG GENIUS FEATURES - QUICK START GUIDE

## 30-Minute Setup

### 1. Install Dependencies (2 min)
```bash
cd backend
npm install pdfkit nodemailer node-cron
```

### 2. Run Database Migration (3 min)
```bash
# Option A: Using psql directly
psql -U postgres -d akig < src/migrations/050_payment_methods_genius.sql

# Option B: Via node script
node scripts/migrate.js
```

**What Gets Created**:
- `payments_enhanced` table
- `payment_confirmations` table
- `payment_reconciliation` table
- `payment_reminders` table
- `payment_summary` VIEW
- `auto_confirm_payment()` TRIGGER
- Payment method & status ENUMs

### 3. Configure Environment (2 min)
Create `.env` file:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=AKIG Agency <noreply@akig.gn>

# Audit Configuration
AUDIT_ENABLED=true
AUDIT_LOG_LEVEL=HIGH
```

### 4. Update Backend Routes (5 min)
In `src/index.js`:
```javascript
// Add imports
const tenantPortal = require('./routes/tenant-portal');
const accounting = require('./routes/accounting-genius');
const { auditTrail } = require('./middlewares/audit-trail');

// Add middleware early
app.use(auditTrail);

// Register routes
app.use('/api/tenant-portal', tenantPortal);
app.use('/api/accounting', accounting);
```

### 5. Update Frontend Routes (5 min)
In `src/App.jsx`:
```javascript
import TenantPortal from '@/pages/TenantPortal';
import Accounting from '@/pages/Accounting';

// Add routes
<Route path="/tenant-portal" element={<TenantPortal />} />
<Route path="/accounting" element={<Accounting />} />
```

### 6. Start Server (3 min)
```bash
npm run dev
```

Test: `http://localhost:4000/api/accounting/dashboard`

---

## 📚 File Reference

### Database
```
backend/src/migrations/
  └─ 050_payment_methods_genius.sql    Migration script
```

### Backend
```
backend/src/
  ├─ routes/
  │   ├─ tenant-portal.js              Dashboard, history, receipts
  │   └─ accounting-genius.js          Reports, audit, reconciliation
  ├─ services/
  │   └─ notification-service.js       Email alerts & reminders
  ├─ utils/
  │   └─ receipt-generator.js          PDF generation
  └─ middlewares/
      └─ audit-trail.js                Logging middleware
```

### Frontend
```
frontend/src/pages/TenantPortal/
  ├─ index.jsx                         Main component
  └─ TenantPortal.css                  Styles
```

### Documentation
```
Root/
  ├─ GENIUS_FEATURES_COMPLETE.md       Full guide (500 lines)
  ├─ IMPLEMENTATION_CHECKLIST.md       Tasks & metrics
  ├─ FINAL_DELIVERY_GENIUS.md          Delivery report
  └─ 00_GENIUS_DELIVERY_COMPLETE.txt   ASCII summary
```

---

## 🔗 API Quick Reference

### Tenant Portal
```
GET  /api/tenant-portal/dashboard              # Dashboard
GET  /api/tenant-portal/contract/:id/history   # Payment history
GET  /api/tenant-portal/payment/:id/receipt    # PDF receipt
GET  /api/tenant-portal/stats                  # Statistics
GET  /api/tenant-portal/payment-methods        # Available methods
```

### Accounting
```
GET  /api/accounting/dashboard                 # Overview
GET  /api/accounting/user-history              # Transactions
GET  /api/accounting/audit-trail               # Action log
GET  /api/accounting/reconciliation            # Bank matching
GET  /api/accounting/discrepancies             # Anomalies
GET  /api/accounting/export/csv                # Export
```

### Example Requests
```bash
# Get tenant dashboard
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/tenant-portal/dashboard

# Get payment history
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/tenant-portal/contract/uuid/history

# Download receipt (PDF)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/tenant-portal/payment/uuid/receipt > receipt.pdf

# Accounting dashboard
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/accounting/dashboard
```

---

## 🔐 Access Control

### Tenant
```
/api/tenant-portal/*     ✓ Own data only
/api/accounting/*        ✗ Denied
```

### Agent
```
/api/tenant-portal/*     ✗ Denied
/api/accounting/*        ✓ Limited (accounting/dashboard, user-history)
```

### Manager
```
/api/tenant-portal/*     ✗ Denied
/api/accounting/*        ✓ Full access
```

### Admin
```
/api/tenant-portal/*     ✓ Full access
/api/accounting/*        ✓ Full access
/api/audit/*             ✓ Full access
```

---

## 📧 Email Configuration

### Gmail Setup
1. Enable 2FA on Gmail account
2. Generate "App Password" at myaccount.google.com/apppasswords
3. Add to .env:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=generated-app-password
   ```

### Other SMTP Providers
```env
# SendGrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxx

# Mailgun
EMAIL_HOST=smtp.mailgun.org
EMAIL_USER=postmaster@mg.example.com
EMAIL_PASS=password

# AWS SES
EMAIL_HOST=email-smtp.region.amazonaws.com
EMAIL_USER=SMTP username
EMAIL_PASS=SMTP password
```

---

## 🧪 Testing

### Manual Tests
```bash
# Test email sending
POST /api/tenant-portal/request-receipt
{
  "paymentId": "uuid-here"
}

# Test PDF generation
GET /api/tenant-portal/payment/uuid/receipt

# Test accounting dashboard
GET /api/accounting/dashboard

# Test audit trail
GET /api/accounting/audit-trail?action=UPDATE&days=7
```

### Verify Installation
```javascript
// In node console
const { pool } = require('./src/db');

// Check payment_enhanced table
const result = await pool.query('SELECT COUNT(*) FROM payments_enhanced');
console.log(result.rows[0]); // Should show { count: '0' }

// Check audit_events table (if exists)
const audit = await pool.query('SELECT COUNT(*) FROM audit_events LIMIT 1')
  .catch(() => console.log('audit_events table not yet created'));
```

---

## 🐛 Troubleshooting

### Email Not Sending
```
❌ Error: connect ECONNREFUSED 127.0.0.1:587
  ✓ Check EMAIL_HOST and EMAIL_PORT in .env
  ✓ Verify SMTP server is accessible
  ✓ Enable firewall exceptions

❌ Error: Invalid login
  ✓ Verify EMAIL_USER and EMAIL_PASS
  ✓ For Gmail, use App Password (not regular password)
  ✓ Check email account isn't locked
```

### PDF Generation Fails
```
❌ Error: ENOENT: no such file
  ✓ Ensure pdfkit is installed: npm install pdfkit
  ✓ Check file permissions
  ✓ Verify /tmp directory exists

❌ Error: out of memory
  ✓ Check available disk space
  ✓ Increase Node heap: node --max-old-space-size=4096 index.js
```

### Routes Not Found
```
❌ Error: 404 Not Found
  ✓ Check routes are registered in index.js
  ✓ Verify server is restarted after changes
  ✓ Check middleware order (auditTrail should be early)
```

### Permission Denied
```
❌ Error: 403 Access Denied
  ✓ Verify JWT token is valid
  ✓ Check user role (see Access Control section)
  ✓ Ensure tenant_id matches if role is TENANT
```

---

## 📊 Payment Methods Supported

```javascript
// Creating a payment
POST /api/payments {
  "contract_id": "uuid",
  "tenant_id": "uuid",
  "amount": 500000,
  "payment_method": "TRANSFER",  // One of:
  // CASH, CHECK, TRANSFER, ORANGE_MONEY,
  // MTN_MOBILE_MONEY, MERCHANT, CREDIT_CARD,
  // MOBILE_WALLET, BANK_DEPOSIT
  "payment_date": "2024-01-15",
  
  // Method-specific fields:
  "check_number": "CHK-12345",           // For CHECK
  "orange_money_id": "OM-98765",         // For ORANGE_MONEY
  "merchant_id": "MRCH-54321",           // For MERCHANT
  "transfer_bank": "BDI Guinée",         // For TRANSFER
  "bank_account": "12345678"             // For TRANSFER
}
```

---

## 📈 Monitoring

### Check Payment Status
```sql
SELECT * FROM payments_enhanced
WHERE status != 'COMPLETED'
ORDER BY payment_date;
```

### Check Audit Trail
```sql
SELECT created_at, action, entity_type, user_id, severity
FROM audit_events
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Check Failed Payments
```sql
SELECT * FROM payments_enhanced
WHERE status = 'FAILED'
ORDER BY payment_date DESC;
```

### Check Discrepancies
```sql
SELECT pe.*, pr.reconciled_amount,
       (pe.amount - pr.reconciled_amount) as discrepancy
FROM payments_enhanced pe
LEFT JOIN payment_reconciliation pr ON pe.id = pr.payment_id
WHERE pe.amount != pr.reconciled_amount;
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] All environment variables configured (.env)
- [ ] Database migrations applied
- [ ] HTTPS enabled
- [ ] Email service tested
- [ ] Audit logging verified
- [ ] Backups configured
- [ ] Error monitoring setup
- [ ] Load testing completed

### Deployment Commands
```bash
# Build frontend
npm run build

# Run migrations
npm run migrate

# Start production server
NODE_ENV=production npm start

# Verify service
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/accounting/dashboard
```

### Monitoring in Production
```bash
# Watch logs
tail -f logs/access.log
tail -f logs/error.log

# Check uptime
curl http://localhost:4000/api/health

# Check database connection
curl http://localhost:4000/api/accounting/dashboard
```

---

## 📞 Support

**Documentation**:
- Full Guide: `GENIUS_FEATURES_COMPLETE.md`
- Setup: `IMPLEMENTATION_CHECKLIST.md`
- Delivery: `FINAL_DELIVERY_GENIUS.md`

**Key Features Implemented**:
1. ✅ Payment Methods (9 types)
2. ✅ Tenant Portal (history, receipts)
3. ✅ Accounting (reports, audit)
4. ✅ Receipt Generator (PDF)
5. ✅ Notifications (email)
6. ✅ Audit Trail (logging)

**Next Steps**:
1. Follow 30-minute setup above
2. Review full documentation
3. Test all features
4. Deploy to production
5. Monitor performance

---

**Version**: 2.0 - Genius Features  
**Last Updated**: January 2024  
**Status**: Production Ready ✅
