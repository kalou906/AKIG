# 🚀 QUICK START - ARCHITECTURE IMPLEMENTATION (1-2 Hours)

## ⏱️ Timeline
- **15 min**: Backup + Review
- **30 min**: Replace Components
- **15 min**: Verify Compilation  
- **45 min**: Start Servers + Manual Test
- **30 min**: QA Sign-Off

**Total: ~2 hours to go/no-go for Pilot Monday**

---

## STEP 1: BACKUP & REVIEW (15 min)

### Backup Current App.jsx
```bash
cd c:\AKIG\frontend\src
Copy-Item App.jsx App.jsx.backup
```

### Review New Architecture
```bash
# Open and review these files:
# 1. AppArchitecture.jsx (223 lines)
# 2. LayoutStandardized.jsx (104 lines)
# 3. RequireAuthStandardized.jsx (49 lines)
# 4. apiClientStandardized.ts (119 lines)

# Understand the flow:
# App → ErrorBoundary → BrowserRouter → Layout → RequireAuth → Pages
```

---

## STEP 2: REPLACE COMPONENTS (30 min)

### 2a. Replace App.jsx
```bash
# Copy new App.jsx
Copy-Item c:\AKIG\frontend\src\AppArchitecture.jsx c:\AKIG\frontend\src\App.jsx
```

### 2b. Copy Layout Component
```bash
# If not already done:
Copy-Item c:\AKIG\frontend\src\components\LayoutStandardized.jsx `
          c:\AKIG\frontend\src\components\Layout.jsx
```

### 2c. Copy RequireAuth Component
```bash
# If not already done:
Copy-Item c:\AKIG\frontend\src\components\RequireAuthStandardized.jsx `
          c:\AKIG\frontend\src\components\RequireAuth.jsx
```

### 2d. Copy API Client
```bash
# If not already done:
Copy-Item c:\AKIG\frontend\src\api\apiClientStandardized.ts `
          c:\AKIG\frontend\src\api\apiClient.ts
```

### 2e. Fix Imports in App.jsx (if needed)
**Current imports in AppArchitecture.jsx:**
```javascript
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
// Dashboard, Contrats, Paiements, etc. are imported
```

**If paths don't match your structure, update them.**

### 2f. Fix Imports in Pages
**Update all page files to use new apiClient:**
```javascript
// OLD:
import apiClient from '../api/http-client';

// NEW:
import apiClient from '../api/apiClient';
```

**Find all files using old import:**
```bash
grep -r "from.*http-client" c:\AKIG\frontend\src
```

**Replace in each file:**
```bash
# Example for Contrats.jsx
(Get-Content "c:\AKIG\frontend\src\pages\Contrats.jsx") `
  -replace "from '\.\.\/api\/http-client'", "from '../api/apiClient'" `
  | Set-Content "c:\AKIG\frontend\src\pages\Contrats.jsx"
```

---

## STEP 3: VERIFY COMPILATION (15 min)

### Build Test
```bash
cd c:\AKIG\frontend
npm run build
```

### ✓ Success Criteria
- [x] Build completes in <1 min
- [x] Output: `dist/` folder created
- [x] 0 TypeScript errors
- [x] 0 JSX errors
- [x] Warnings acceptable (e.g., deprecation notices)

### ✗ If Build Fails
```bash
# Check error messages:
npm run build 2>&1 | tee build.log
# Open build.log and look for errors

# Common issues:
# 1. Imports path wrong → Fix path in App.jsx
# 2. Missing component → Check all 4 imports exist
# 3. Syntax error → Check .jsx file syntax
```

---

## STEP 4: START SERVERS & MANUAL TEST (45 min)

### Start Backend
```bash
# PowerShell Terminal 1:
cd c:\AKIG\backend
npm run dev
# Wait for: "✅ AKIG Backend API Started"
# Verify: Port 4000, Database: connected
```

### Start Frontend
```bash
# PowerShell Terminal 2:
cd c:\AKIG\frontend
$env:BROWSER="none"
npm start
# Wait for: "webpack compiled successfully"
# Frontend should open on http://localhost:3000
```

### Manual Route Testing (Terminal 3: Browser)

**Setup: Add Mock Token**
```javascript
// Open DevTools Console (F12)
localStorage.setItem('akig_token', 'test_token_' + Date.now());
localStorage.setItem('user', JSON.stringify({id:1, email:'test@akig.local', role:'agent'}));
// Refresh page (F5)
```

**Test Each Route:**
```
✓ http://localhost:3000/           → Dashboard loads
✓ http://localhost:3000/contrats   → Contrats page loads (no redirect)
✓ http://localhost:3000/paiements  → Paiements page loads (no redirect)
✓ http://localhost:3000/proprietes → Proprietes page loads (no redirect)
✓ http://localhost:3000/locataires → Locataires page loads (no redirect)
✓ http://localhost:3000/rapports   → Rapports page loads (no redirect)
✓ http://localhost:3000/rappels    → Rappels page loads (no redirect)
✓ http://localhost:3000/preavis    → Preavis page loads (no redirect)
✓ http://localhost:3000/unknown    → Redirects to /404
```

**Test Navigation Without Infinite Loop:**
```
1. Click sidebar link "Contrats"
   → Should navigate to /contrats (NOT multiple redirects)
   
2. Click sidebar link "Paiements"
   → Should navigate to /paiements (NOT back to /contrats)
   
3. Rapid clicks: Contrats → Paiements → Dashboard
   → Should NOT freeze or show errors
```

**Test Authentication:**
```javascript
// Open DevTools Console
// Simulate token expiry:
localStorage.removeItem('akig_token');
localStorage.removeItem('user');

// Try to access /contrats
// → Should redirect to /login
```

**Check Console for Errors:**
```
DevTools → Console tab:
✓ No red errors ✗
✓ No 404 import errors ✗
✓ Max 2-3 yellow warnings (deprecation OK)
```

---

## STEP 5: QA SIGN-OFF (30 min)

### Run Playwright Tests (Chromium Only)
```bash
# Terminal 4:
cd c:\AKIG
npx playwright test --project=chromium --reporter=list
```

### Check Output
```
✓ smoke.spec.ts: should navigate to routes
✓ smoke.spec.ts: should protect routes from unauthorized access
✓ smoke.spec.ts: should show 404 for unknown routes
... (more tests)

Result: X passed, 0 failed
```

### Review QA Checklist
```bash
# Open: QA_LAUNCH_CHECKLIST.md

# Go through Section 1: Routing & Navigation (12 items)
□ Dashboard (/) accessible
□ /contrats accessible
□ /paiements accessible
... (all 8 routes)
□ Route protection works
□ 404 handling works
□ Navigation links no infinite loops

# Mark each as ✓ if passing
```

### GO/NO-GO Decision
```
PASS CRITERIA (ALL MUST BE TRUE):
✓ Compilation: 0 errors
✓ Backend: Responding on port 4000
✓ Frontend: Responding on port 3000
✓ Routes: All 8 + login + 404 accessible
✓ Auth: Token check + logout workflow
✓ Navigation: No infinite loops
✓ Console: 0 errors
✓ Playwright tests: All pass (or 0 critical failures)

IF ALL ✓ → READY FOR PILOT MONDAY
IF ANY ✗ → FIX BEFORE MONDAY
```

---

## 🚨 TROUBLESHOOTING

### Issue: "Module not found: Layout"
**Solution**: 
- Check import path in App.jsx
- Verify file exists: `c:\AKIG\frontend\src\components\Layout.jsx`
- Check if LayoutStandardized.jsx is copied to Layout.jsx

### Issue: "Cannot read property 'akig_token' of localStorage"
**Solution**: 
- Add mock token in browser console (Step 4)
- Or implement login page properly

### Issue: "App redirects to /login constantly"
**Solution**:
- RequireAuth checking token
- Add token via console: `localStorage.setItem('akig_token', 'test')`
- Or check RequireAuth logic (should not redirect if token exists)

### Issue: "Build fails with TypeScript errors"
**Solution**:
- Check error message: which file + which line?
- Fix imports in that file
- Run `npm run build` again

### Issue: "Playwright tests fail"
**Solution**:
- Make sure frontend/backend running
- Check test output for specific failures
- Run with `--headed` to see what's happening: `npx playwright test --headed --project=chromium`

### Issue: "Port 3000 already in use"
**Solution**:
```bash
# Kill existing node processes
taskkill /F /IM node.exe

# Wait 5 seconds
Start-Sleep -Seconds 5

# Try npm start again
npm start
```

---

## ✅ SUCCESS CHECKLIST

Before approving for Pilot Monday:

- [ ] Compilation: 0 errors
- [ ] 0 Red errors in DevTools console
- [ ] All 8 routes load without redirect loops
- [ ] Logout workflow works (removes token, redirects /login)
- [ ] Playwright tests pass (or only minor failures)
- [ ] Performance: TTI <5 seconds
- [ ] QA checklist: Sections 1-3 complete ✓
- [ ] Team trained on architecture (30 min)
- [ ] PM/CTO approved go/no-go

---

## 📞 HELP

**If stuck, see:**
- Architecture overview: `ARCHITECTURE_EXPERT_COMPLETE.md`
- Detailed guidance: `00_READ_ME_FIRST_ARCHITECTURE.md`
- Emergency runbook: `INCIDENT_RUNBOOKS.md`

---

## 🎉 DONE!

You've successfully implemented the expert architecture.

**Monday Morning 9:00 AM**: Launch Pilot Internal  
**Friday EOD**: Go/No-Go decision  
**Next 4 weeks**: Pilot → Production rollout

**Let's do this! 🚀**

---

**Quick Reference**

| What | Where | Time |
|------|-------|------|
| New App.jsx | AppArchitecture.jsx | Use as replacement |
| New Layout | LayoutStandardized.jsx | Use as Layout.jsx |
| New RequireAuth | RequireAuthStandardized.jsx | Use as RequireAuth.jsx |
| New API Client | apiClientStandardized.ts | Use as apiClient.ts |
| Tests | smoke.spec.ts | Run with Playwright |
| Checklist | QA_LAUNCH_CHECKLIST.md | 160-item validation |
| Runbooks | INCIDENT_RUNBOOKS.md | For incident response |
| Docs | 00_READ_ME_FIRST_ARCHITECTURE.md | Navigation index |

**Start**: Copy/replace files  
**Verify**: npm run build  
**Test**: npm start + manual routes  
**Approve**: QA checklist ✓  
**Go**: Monday 9:00 AM Pilot 🚀
