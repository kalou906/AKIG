# 🚀 AKIG Cross-Browser - Quick Reference Card

**Print & Post on Your Desk!** 📋

---

## ⚡ ESSENTIAL COMMANDS

```bash
# START EVERYTHING
make up                    # ✅ Services + auto-reset DB

# TESTING
make test-fast             # ✅ Chrome only (~5 min)
make test                  # ✅ All browsers (~30 min)

# BUILD & DEPLOY
make build                 # ✅ Build frontend & backend
git push origin main       # ✅ Auto-runs CI/CD

# DATABASE
make reset                 # ✅ Reset to clean state
make seed                  # ✅ Load test data

# MONITORING
make status                # ✅ Check service status
make health                # ✅ Health check
make logs                  # ✅ Follow logs
```

---

## 🌐 LOCAL URLS

```
Frontend:      http://localhost:3000
API:           http://localhost:4000
Database:      localhost:5432
```

---

## 🧪 TESTING WORKFLOW

```bash
# Before committing
make test-fast             # Quick test on Chrome

# Full validation
make test                  # All 5 browsers

# Debug failed test
npx playwright test --debug

# View reports
# → playwright-report/index.html
```

---

## 🔧 KEY FILES

```
babel.config.js                    → ES2020 transpilation
playwright.config.ts               → Browser testing
frontend/src/index.js              → Polyfills loader
Makefile                           → DevOps commands
.github/workflows/ci.yml           → CI pipeline
.github/workflows/cd.yml           → CD pipeline
backend/scripts/seed.sql           → Test data
backend/scripts/reset.ts           → DB automation
```

---

## 🎯 BROWSER SUPPORT

✅ Chrome (Latest 2)
✅ Firefox (Latest 2)
✅ Safari (Latest 2)
✅ Edge (Chromium-based)
✅ Android Chrome
✅ iOS Safari

---

## 📊 TEST COVERAGE

```
✅ Dashboard           (load, KPIs, navigation)
✅ 13 Modules          (all routes & tabs)
✅ User Journeys       (complete workflows)
✅ Multi-Browser       (Chrome, Firefox, Safari)
```

---

## ⚙️ DEPLOYMENT PIPELINE

```
Push to main
    ↓
CI (Build + Test) → 30 min
    ↓
CD (Deploy to VPS) → 15 min
    ↓
Smoke Tests + Health Check
    ↓
🚀 LIVE
```

---

## 🚨 EMERGENCY FIXES

| Problem | Fix |
|---------|-----|
| Tests fail | `make test-fast` debug on Chrome |
| DB corrupted | `make clean` then `make reset` |
| Port in use | Kill process or change port |
| API down | `make restart` or check logs |
| Deploy failed | `git reset HEAD~1` & rollback |

---

## 📁 DIRECTORIES

```
frontend/          React app + tests
backend/           Express API
.github/workflows/ CI/CD pipelines
```

---

## 💡 PRO TIPS

1. Use `make` for everything (simpler than docker commands)
2. Run `make test-fast` before committing
3. Check GitHub Actions logs if CI fails
4. Never commit `.env` file
5. Keep backups before major deploys

---

## 📚 FULL DOCUMENTATION

- `PRODUCTION_READINESS_CHECKLIST.md` - Pre-deploy checklist
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `TEST_EXECUTION_GUIDE.md` - Testing strategy
- `CROSSBROWSER_IMPLEMENTATION_SUMMARY.md` - Complete details

---

**🎉 AKIG is production-ready!**

Questions? Check documentation or ask the team!
