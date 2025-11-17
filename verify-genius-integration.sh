#!/bin/bash
# ============================================================
# GENIUS FEATURES - INTEGRATION VERIFICATION SCRIPT
# Quick checklist to verify all integrations are working
# ============================================================

echo "🔍 GENIUS FEATURES INTEGRATION VERIFICATION"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 CHECKING FILE EXISTENCE..."
echo ""

# Frontend Files
echo -n "✓ TenantPortal Component... "
if [ -f "frontend/src/pages/TenantPortal/index.jsx" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

echo -n "✓ TenantPortal Styles... "
if [ -f "frontend/src/pages/TenantPortal/TenantPortal.css" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

# Backend Files
echo -n "✓ Tenant Portal Routes... "
if [ -f "backend/src/routes/tenant-portal.js" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

echo -n "✓ Accounting Routes... "
if [ -f "backend/src/routes/accounting-genius.js" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

echo -n "✓ Audit Trail Middleware... "
if [ -f "backend/src/middlewares/audit-trail.js" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

echo -n "✓ Receipt Generator... "
if [ -f "backend/src/utils/receipt-generator.js" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

echo -n "✓ Notification Service... "
if [ -f "backend/src/services/notification-service.js" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

echo -n "✓ Database Migration... "
if [ -f "backend/src/migrations/050_payment_methods_genius.sql" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
fi

echo ""
echo "📍 CHECKING INTEGRATIONS..."
echo ""

# Check frontend integrations
echo -n "✓ TenantPortal imported in App.jsx... "
if grep -q "import TenantPortal from './pages/TenantPortal'" frontend/src/App.jsx; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ TenantPortal route in App.jsx... "
if grep -q 'path="/tenant-portal"' frontend/src/App.jsx; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Sidebar Genius Features section... "
if grep -q '"genius"' frontend/src/components/layout/Sidebar.jsx; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

# Check backend integrations
echo -n "✓ Tenant Portal routes imported in index.js... "
if grep -q "require('./routes/tenant-portal')" backend/src/index.js; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Tenant Portal routes registered in index.js... "
if grep -q "app.use('/api/tenant-portal'" backend/src/index.js; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Accounting routes registered in index.js... "
if grep -q "app.use('/api/accounting-genius'" backend/src/index.js; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Audit Trail middleware imported in index.js... "
if grep -q "require('./middleware/audit-trail')" backend/src/index.js; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo -n "✓ Audit Trail middleware registered in index.js... "
if grep -q "app.use(auditTrail)" backend/src/index.js; then
    echo -e "${GREEN}CONFIGURED${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo ""
echo "✅ VERIFICATION COMPLETE!"
echo ""
echo "Next steps:"
echo "1. cd backend && npm install (if needed)"
echo "2. Execute database migration: psql < 050_payment_methods_genius.sql"
echo "3. npm run dev (start backend)"
echo "4. cd frontend && npm start (start frontend)"
echo "5. Navigate to http://localhost:3000/tenant-portal"
