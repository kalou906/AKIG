# ✅ AKIG QA Launch Checklist - Pre-Pilot & Production Deployment

> **Purpose**: Valider que système est prêt pour production avant pilot interne, puis agence pilot, puis rollout complet.
> 
> **Timeline**: 
> - Pilot Interne: 10 users, 4h (Week 1)
> - Agence Pilot: 50 users, 1 week (Week 2-3)
> - Rollout Complet: Phases 25%→50%→100% (Week 4-5)

---

## 🎯 SECTION 1: ROUTING & NAVIGATION (Core Foundation)

### ✓ Route Accessibility
- [ ] **Dashboard (/)** 
  - URL directe: http://localhost:3000/ → Affiche dashboard
  - Pas redirection vers /login
  - Nécessite auth token (OK avec mock)
  
- [ ] **/contrats** 
  - URL directe accessible
  - Affiche liste contrats (ou empty state si aucun)
  - Pas 404 ou boucle redirection

- [ ] **/paiements** → Accessible, pas erreur
- [ ] **/proprietes** → Accessible, pas erreur  
- [ ] **/locataires** → Accessible, pas erreur
- [ ] **/rapports** → Accessible, pas erreur
- [ ] **/rappels** → Accessible, pas erreur
- [ ] **/preavis** → Accessible, pas erreur

### ✓ Route Protection
- [ ] Utilisateur non-authentifié accédant /contrats → Redirige vers /login
- [ ] Logout supprime token → Accès /contrats redirige /login
- [ ] Deep link (page partagée) fonctionne → Pas redirection infinie

### ✓ 404 Handling
- [ ] Route inconnue (/unknown-page) → Affiche page 404 (pas erreur blanche)
- [ ] Bouton "Retour accueil" depuis 404 → Renvoie à /

### ✓ Navigation Links (No Infinite Redirects)
- [ ] Clic Contrats dans sidebar → Charge page /contrats (pas 3 redirections)
- [ ] Clic Dashboard → Affiche dashboard immédiatement
- [ ] Navigation rapide (5 clics en 10s) → Pas erreur ou crash

---

## 🔐 SECTION 2: AUTHENTIFICATION & TOKENS

### ✓ Token Management
- [ ] Login réussit → Token stocké dans `localStorage.akig_token`
- [ ] Token existe → Header API inclut `Authorization: Bearer [token]`
- [ ] Token absent → Tentative API → 401 reçue → Redirige /login
- [ ] Token expiré → Auto-logout après inactivité (default 24h)

### ✓ Token Sync (Multi-Tab)
- [ ] Login dans Tab 1 → Tab 2 reconnaît token (localStorage sync)
- [ ] Logout Tab 1 → Tab 2 redirige /login
- [ ] **Standardized key**: Tous clients utilisent `akig_token` (pas `token` legacy)

### ✓ Auth State Persistence
- [ ] Refresh page → Conserve session (pas redirection /login)
- [ ] Fermer navigateur + rouvrir → Token toujours valide (24h max)
- [ ] Multiple instances → Pas conflict tokens

---

## 🛠️ SECTION 3: COMPONENT STANDARDIZATION

### ✓ Layout Component
- [ ] Header affiche titre "AKIG" + branding
- [ ] Sidebar affiche navigation menu (8 items)
- [ ] Logout button présent et fonctionnel
- [ ] Responsive: Mobile nav collapse, Desktop full width
- [ ] No console errors (React strict mode)

### ✓ RequireAuth Component
- [ ] Affiche loading spinner pendant vérification token
- [ ] Redirige /login si pas token
- [ ] Rend Outlet enfant si authentifié
- [ ] Pas d'infinite loop dans vérification auth

### ✓ ErrorBoundary Component
- [ ] Erreur JavaScript → Affiche error message (pas page blanche)
- [ ] Utilisateur peut revenir au dashboard via bouton
- [ ] Erreur loggée en console pour debugging
- [ ] Pas affecte autres pages (isolation)

### ✓ API Client
- [ ] Requêtes incluent Authorization header
- [ ] 401 Unauthorized déclenche logout + redirect
- [ ] Erreurs 4xx/5xx affichent message utilisateur (pas crash)
- [ ] Requêtes stockées pour replay (mode offline - TBD)

---

## 🧪 SECTION 4: TESTS & MULTI-BROWSER

### ✓ Playwright Tests
- [ ] Config `playwright.config.ts` existant
- [ ] Tests dans `tests/smoke.spec.ts` existent
- [ ] **Chromium (Chrome)**: Tests passent
- [ ] **Firefox**: Tests passent
- [ ] **WebKit (Safari)**: Tests passent
- [ ] Aucun test timeout ou flaky

### ✓ Browser Compatibility
- [ ] **Chrome 120+**: Dashboard charge en <3s
- [ ] **Firefox 121+**: Toutes routes accessibles
- [ ] **Safari 17+**: Navigation fonctionne
- [ ] **Edge 120+**: Pas problème compatibilité
- [ ] **Mobile (iOS/Android)**: Responsive fonctionne

### ✓ Console Cleanup
- [ ] 0 erreurs non-gérées en console
- [ ] Max 3 warnings attendus (deprecation normal)
- [ ] Pas de memory leaks détectés (DevTools heap profiler)
- [ ] Load time <5s (TTI pour dashboard)

---

## 🔌 SECTION 5: API & BACKEND INTEGRATION

### ✓ Backend Health
- [ ] `GET /api/health` retourne 200 + status ok
- [ ] Tous services initialisés (reminder, charges, fiscal, etc.)
- [ ] Database: connected
- [ ] Port 4000 répond à requêtes

### ✓ API Endpoints (Sample)
- [ ] `GET /api/contracts` → 200 + liste contrats (ou [])
- [ ] `GET /api/payments` → 200 + liste paiements
- [ ] `POST /api/auth/login` → 200 + token retourné
- [ ] `POST /api/auth/logout` → 200 + message
- [ ] Aucun endpoint retourne 500 pour requête valide

### ✓ Error Handling
- [ ] API error → Frontend affiche message utilisateur
- [ ] Network timeout → Affiche "Erreur connexion"
- [ ] 401/403 → Redirige /login (pas crash)
- [ ] 5xx errors → Retry automatique (3x) puis message

### ✓ CORS & Headers
- [ ] Frontend peut requêter backend (CORS ok)
- [ ] Headers authentification présents
- [ ] Content-Type: application/json correct
- [ ] No mixed content warnings (https vs http)

---

## ⚡ SECTION 6: PERFORMANCE

### ✓ Load Time
- [ ] Dashboard initial load: <5s (target <3s)
- [ ] Route change (ex /contrats): <1s (vs-code refresh)
- [ ] API response 95th percentile: <500ms
- [ ] No jank/stutter lors navigation

### ✓ Memory & CPU
- [ ] Frontend memory: <200MB stable
- [ ] Backend memory: <500MB stable
- [ ] CPU usage: <30% sous charge normale
- [ ] Pas memory leak sur usage 2h+ continu

### ✓ Lighthouse Audit
- [ ] Performance score: >80
- [ ] Accessibility score: >85
- [ ] Best practices: >90
- [ ] SEO: >85 (si applicable)

### ✓ Stress Test
- [ ] 10 utilisateurs simultanés → Pas erreur
- [ ] 50 utilisateurs simultanés → <2% erreur (target 0)
- [ ] 100 utilisateurs → <5% erreur (acceptable)
- [ ] Pas cascade failure ou DB deadlock

---

## 📋 SECTION 7: NOTICE ALERTS & IA FEATURES

### ✓ Notice Lifecycle Alerts
- [ ] J-30 alert: Généré 30 jours avant fin bail
- [ ] J-15 alert: Attire attention (orange priority)
- [ ] J-7 alert: Rouge + urgent
- [ ] J-3 alert: **Critical** → Escalade manager
- [ ] J-1 alert: **Final** → Legal team notifié

### ✓ Intent-to-Depart Scoring
- [ ] Locataire avec 2+ retards paiement → Score += 0.25
- [ ] Taux lecture messages <30% → Score += 0.15
- [ ] Si score >0.6 → Affiche "Risque départ élevé" badge
- [ ] Dashboard affiche top 5 risques départ

### ✓ Dispute Detection
- [ ] Message contient "conteste" → Flaggé comme contestation
- [ ] Open mediation workflow automatique
- [ ] Manager notifié → Peut arbitrer
- [ ] Workflow step tracking visible

### ✓ Data Validation
- [ ] Pas alert si date fin bail manquante
- [ ] Dates parsées correctement (US vs EU format)
- [ ] Pas double alerts pour même événement
- [ ] Timestamps correctes (UTC, timezone agnostic)

---

## 💾 SECTION 8: DATA & BACKUP

### ✓ Data Integrity
- [ ] Aucune données utilisateur perdues
- [ ] Contrats affichés correctement (pas corruption affichage)
- [ ] Paiements enregistrés accuratement
- [ ] Audit trail intact (qui a fait quoi, quand)

### ✓ Database Backup
- [ ] Backup quotidien configuré + validé
- [ ] Restore test: backup peut être restored <30min (RTO)
- [ ] RPO ≤5 min (max 5 min données perdues si crash)
- [ ] Backups stockées off-site (AWS S3 ou autre)

### ✓ User Data Privacy
- [ ] Pas données sensibles en localStorage (juste token)
- [ ] Pas passwords stockés (hashed bcrypt en DB)
- [ ] GDPR compliance: Suppression données user <30 jours après demande
- [ ] Données exportées au format GDPR SAR possible

---

## 🔒 SECTION 9: SECURITY

### ✓ Authentication & Authorization
- [ ] Jwt tokens ont expiration (24h max)
- [ ] Bruteforce protection: 5 tentatives login → blocage 15 min
- [ ] Password requirements: Min 8 chars, 1 majuscule, 1 chiffre
- [ ] 2FA/MFA option available (optional pour P1)

### ✓ API Security
- [ ] All API routes HTTPS (no http in production)
- [ ] CSRF tokens présents
- [ ] Injection SQL protection (parameterized queries)
- [ ] XSS protection (React escapes par défaut)
- [ ] Rate limiting: 100 req/min per IP (429 if exceeded)

### ✓ Data Protection
- [ ] Sensitive data (contracts, payments) encrypted at rest
- [ ] Transmission SSL/TLS 1.2+
- [ ] Secrets not in code (all in .env)
- [ ] Secrets rotated monthly

### ✓ Audit & Logging
- [ ] Tous API calls loggés (qui, quoi, quand)
- [ ] Erreurs loggées (stack trace preservé)
- [ ] Logs retention 90+ jours
- [ ] Logs not accessible direct (need auth)

---

## 📱 SECTION 10: MOBILE & RESPONSIVE

### ✓ Mobile Layout
- [ ] Sidebar collapses en hamburger menu (mobile)
- [ ] Buttons large enough pour touch (min 44px)
- [ ] Text readable without zoom
- [ ] No horizontal scroll

### ✓ Viewport Testing
- [ ] iPad (1024x768): Layout ok
- [ ] iPhone 14 (390x844): Responsive ok
- [ ] Android (360x800): Layout ok
- [ ] Desktop ultra-wide (1920x1080): Scales ok

### ✓ Touch Interactions
- [ ] Hover states work on touch (ok si no hover)
- [ ] Forms accessible (labels visible, inputs sizable)
- [ ] Navigation accessible (no tiny tap targets)
- [ ] Modals can close (X button, back gesture)

---

## 📊 SECTION 11: MONITORING & ALERTS

### ✓ System Monitoring
- [ ] Error tracking (Sentry/LogRocket) configured
- [ ] Dashboard affiche 99.9% uptime target
- [ ] Error rate monitored (alert if >1%)
- [ ] Response time monitored (alert if avg >1s)

### ✓ Business Monitoring
- [ ] Notice creation tracked (metric: notices/day)
- [ ] Payment success rate tracked (target >98%)
- [ ] User engagement tracked (logins, active users)
- [ ] Alert notifications sent correctly (SMS/Email)

### ✓ Infrastructure Monitoring
- [ ] CPU usage monitored (alert if >80%)
- [ ] Memory usage monitored (alert if >90%)
- [ ] Disk space monitored (alert if <10% free)
- [ ] Network latency monitored (alert if >500ms p95)

---

## 🚀 SECTION 12: DEPLOYMENT READINESS

### ✓ Deployment Process
- [ ] CI/CD pipeline green (all tests pass)
- [ ] Code review completed (2 approvals)
- [ ] Release notes prepared
- [ ] Rollback plan documented
- [ ] Monitoring dashboards ready

### ✓ Staging Environment
- [ ] Staging mirrors production (same DB dump, same code)
- [ ] QA has signed off staging (all tests pass)
- [ ] Performance testing passed (load test baseline)
- [ ] Security scan passed (no vulnerabilities)

### ✓ Production Environment
- [ ] SSL certificates valid (not expired)
- [ ] Load balancer configured
- [ ] Database replicas healthy
- [ ] Backup restore tested
- [ ] Incident response plan reviewed

### ✓ Communication Plan
- [ ] Pilot users notified (launch date/time)
- [ ] Support team trained (documentation, FAQs)
- [ ] Escalation contacts confirmed
- [ ] Status page ready (status.akig.com)

---

## 🎯 SIGN-OFF

### Pilot Internal (Week 1)
- [ ] QA Lead: ___________________ Date: ___________
- [ ] Product Manager: ___________________ Date: ___________
- [ ] Engineering Lead: ___________________ Date: ___________

### Pilot Agency (Week 2-3)
- [ ] Operations Manager: ___________________ Date: ___________
- [ ] Client Success: ___________________ Date: ___________

### Production Rollout (Week 4-5)
- [ ] CTO: ___________________ Date: ___________
- [ ] CEO: ___________________ Date: ___________

---

## 📝 NOTES

### Known Limitations (Acceptable for P1)
- [ ] 2FA/MFA: Not required P1 (deferred to P2)
- [ ] Advanced reports: Not required P1 (available P2)
- [ ] Mobile app: Not required P1 (web responsive enough)
- [ ] Offline mode: Not required P1 (network assumed available)

### Nice-to-Have (For Future)
- [ ] Dark mode toggle
- [ ] Email digest reports
- [ ] Webhook integrations
- [ ] AI chatbot support

### Success Criteria (Post-Pilot)
- **Uptime**: ≥99.9% (allow 1 incident <15 min)
- **Performance**: p95 API latency <500ms
- **Errors**: <1% error rate during usage
- **User Satisfaction**: >4.0/5.0 NPS score
- **Support Tickets**: <5 critical bugs reported

---

## Version & History
- **v1.0**: 2025-11-05 - Initial QA checklist
- **v1.1**: 2025-11-06 - Added mobile section
- **Last Updated**: 2025-11-05 by AI Agent
- **Status**: READY FOR PILOT
