# 🎯 PROCÉDURES DE VALIDATION MULTI-NAVIGATEURS - AKIG

**Date:** Décembre 2024  
**Statut:** ✅ Complet et prêt à la validation  
**Version:** 1.0 Production

---

## 📚 TABLE DES MATIÈRES

1. [Part 1 : Validation des Standards Web](#part-1--validation-des-standards-web)
2. [Part 2 : Automatisation des Tests](#part-2--automatisation-des-tests)
3. [Part 3 : Validation Manuelle Utilisateur](#part-3--validation-manuelle-utilisateur)
4. [Part 4 : Suivi & Assurance Qualité](#part-4--suivi--assurance-qualité)
5. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## PART 1 : Validation des Standards Web

### 🎯 Objectif
Vérifier que l'application respecte les standards web (HTML5, CSS3, ES6+) et fonctionne sur tous les navigateurs.

### ✅ Standards Supportés

#### HTML5
```
✓ Semantic HTML5 tags (header, nav, main, article, section, footer)
✓ Input types (email, number, date, tel, url)
✓ Data attributes (data-*)
✓ Canvas & SVG
✓ Web Storage (localStorage, sessionStorage)
✓ Web Workers
```

#### CSS3
```
✓ Flexbox (tous les navigateurs modernes)
✓ CSS Grid (tous les navigateurs modernes)
✓ CSS Variables (--var-name)
✓ CSS Animations & Transitions
✓ CSS Gradients
✓ Transform & Perspective
✓ Media Queries (responsive design)
```

#### JavaScript ES6+
```
✓ Arrow Functions (=>)
✓ Template Literals (`string`)
✓ Destructuring
✓ Spread Operator (...)
✓ Classes
✓ Promises & async/await
✓ Array methods (map, filter, reduce)
✓ Object methods (Object.assign, Object.entries)
```

### 🔧 Configuration Babel (Transpilation)

**Vérifier que `.babelrc.json` existe :**

```bash
# Terminal PowerShell Windows
cat .babelrc.json
```

**Contenu attendu :**

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": ["Chrome 90", "Firefox 88", "Safari 14", "Edge 90"]
      },
      "useBuiltIns": "usage",
      "corejs": 3
    }],
    "@babel/preset-react"
  ],
  "plugins": [
    "@babel/plugin-proposal-class-properties"
  ]
}
```

**Commandes de vérification :**

```bash
# Vérifier les packages Babel
npm list @babel/core @babel/preset-env core-js

# Résultat attendu :
# ✓ @babel/core@7.x.x
# ✓ @babel/preset-env@7.x.x
# ✓ core-js@3.x.x
```

### 🎨 Configuration PostCSS (Préfixes CSS)

**Vérifier que `postcss.config.js` existe :**

```bash
cat postcss.config.js
```

**Contenu attendu :**

```javascript
module.exports = {
  plugins: {
    'autoprefixer': {
      overrideBrowserslist: ['Chrome 90', 'Firefox 88', 'Safari 14', 'Edge 90']
    },
    'postcss-preset-env': {
      stage: 3
    }
  }
}
```

**Commandes de vérification :**

```bash
# Vérifier Autoprefixer
npm list autoprefixer postcss-preset-env

# Résultat attendu :
# ✓ autoprefixer@10.x.x
# ✓ postcss-preset-env@7.x.x
```

### 📦 Polyfills Requis

**Vérifier la présence de Core-JS :**

```bash
npm list core-js whatwg-fetch isomorphic-fetch
```

**Résultat attendu :**

```
✓ core-js@3.x.x (pour Promise, Array methods, etc.)
✓ whatwg-fetch@3.x.x (optionnel, pour fetch sur IE)
✓ isomorphic-fetch (optionnel, pour fetch universel)
```

**À importer en début de fichier principal (main.js ou App.js) :**

```javascript
// Import des polyfills
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Ensuite : votre code application
import React from 'react';
import App from './App';
```

### 🚀 Vérification de la Compilation

**Exécuter le script de validation :**

```bash
# Terminal
node scripts/validate-web-standards.js
```

**Résultat attendu :**

```
✅ CSS Grid: Chrome 57+, Firefox 52+, Safari 10.1+, Edge 16+
✅ CSS Flexbox: Chrome 29+, Firefox 20+, Safari 9+, Edge 11+
✅ Arrow Functions: Native support
✅ Template Literals: Native support
✅ .babelrc.json found
✅ postcss.config.js found
✅ tailwind.config.js found
✅ core-js: 3.x.x detected
```

### 📋 Checklist de Validation - Standards Web

**À cocher avant validation finale :**

- [ ] `.babelrc.json` configuré avec `@babel/preset-env`
- [ ] `postcss.config.js` configuré avec Autoprefixer
- [ ] `core-js` installé dans `package.json`
- [ ] `node scripts/validate-web-standards.js` retourne ✅
- [ ] Aucune erreur de transpilation au build
- [ ] Pas de warnings "Unexpected token" en développement
- [ ] CSS généré contient les préfixes `-webkit-`, `-moz-`, `-ms-`
- [ ] Test rapide : ouvrir l'app dans Chrome, Firefox, Safari, Edge sans erreurs console

---

## PART 2 : Automatisation des Tests

### 🎯 Objectif
Exécuter les tests automatisés sur 8 navigateurs différents (Desktop + Mobile + Legacy).

### 🏗️ Architecture des Tests

**Tests disponibles :**

```
frontend/tests/
├── contracts.spec.js           (22 tests) - Gestion des contrats
├── payments.spec.js            (20 tests) - Traitement des paiements
├── dashboard-sms.spec.js       (25 tests) - Dashboard & SMS
├── exports.spec.js             (18 tests) - Export PDF/CSV/Excel
├── e2e.spec.js                 (8 tests)  - Authentification end-to-end
└── ui.snap.spec.ts             (18 tests) - Visual regression tests
```

**Total : 109+ tests sur l'ensemble de l'application**

### 🚀 Exécution Locale (Playwright)

#### 1️⃣ Installation des dépendances

```bash
# Terminal PowerShell
cd frontend
npm install @playwright/test --save-dev
npx playwright install

# Résultat : tous les navigateurs téléchargés (~1-2 GB)
# Chrome, Firefox, Safari, Edge, Webkit
```

#### 2️⃣ Exécuter tous les tests

```bash
# Tous les navigateurs en parallèle
npm run test:all

# Résultat attendu :
# ✓ contracts.spec.js (22 tests)
# ✓ payments.spec.js (20 tests)
# ✓ dashboard-sms.spec.js (25 tests)
# ✓ exports.spec.js (18 tests)
# ✓ e2e.spec.js (8 tests)
# ✓ ui.snap.spec.ts (18 tests)
# Total: 109 passed in 4m 23s
```

#### 3️⃣ Exécuter par navigateur spécifique

```bash
# Chrome uniquement
npm run test:chrome

# Firefox uniquement
npm run test:firefox

# Safari uniquement
npm run test:safari

# Edge uniquement
npm run test:edge

# Mobile (Android + iOS)
npm run test:mobile

# Legacy (IE11 simulation)
npm run test:legacy
```

#### 4️⃣ Mode Debug/Interactive

```bash
# Mode debug - pause avant chaque action
npm run test:debug

# Mode UI - dashboard visuel
npm run test:ui

# Mode watch - re-run au changement de fichier
npm run test:watch

# Headless mode (defaut) - sans navigateur visuel
npm run test:headless
```

#### 5️⃣ Lire les résultats

**Fichier de résumé :**

```bash
# Après exécution des tests
cat test-results.json

# Ou générer un rapport HTML
npm run test:report

# Ouvre dans le navigateur :
# file:///c:/AKIG/frontend/playwright-report/index.html
```

### 📊 Matrice de Tests Playwright

```
┌─────────────────────────────────────────────────────────┐
│           MATRICE DE TESTS PLAYWRIGHT                   │
├─────────────────────────────────────────────────────────┤
│ Navigateur    │ Version │ OS        │ Tests   │ Temps  │
├─────────────────────────────────────────────────────────┤
│ Chrome        │ Latest  │ Win/Mac   │ 109     │ 45s    │
│ Firefox       │ Latest  │ Win/Mac   │ 109     │ 52s    │
│ Safari        │ Latest  │ macOS     │ 109     │ 48s    │
│ Edge          │ Latest  │ Win/Mac   │ 109     │ 46s    │
│ Android       │ Chrome  │ Android   │ 109     │ 65s    │
│ iOS           │ Safari  │ iOS       │ 109     │ 62s    │
│ iPad          │ Safari  │ iPad OS   │ 109     │ 58s    │
│ IE11          │ Emulated│ Windows   │ 95      │ 70s    │
├─────────────────────────────────────────────────────────┤
│ TOTAL (Seq)   │         │           │         │ 6m 26s │
│ TOTAL (Paral.)│         │           │         │ ~1m 20s│
└─────────────────────────────────────────────────────────┘
```

### 🔄 CI/CD avec GitHub Actions

**Exécution automatique :**

```bash
# Push code vers GitHub
git add .
git commit -m "Update application"
git push origin main

# Actions automatiques :
# 1. 7 jobs lancés en parallèle
# 2. Tests multi-navigateurs sur 3 OS
# 3. Résultats en 25 minutes
```

**Voir les résultats :**

1. Aller sur : `https://github.com/YOUR_USER/akig/actions`
2. Cliquer sur le workflow le plus récent
3. Observer les 7 jobs :
   - ✅ Multi-browser (Chrome, Firefox, Safari)
   - ✅ Mobile (Android, iOS)
   - ✅ Accessibility (axe-core)
   - ✅ Performance (Lighthouse)
   - ✅ Edge cases
   - ✅ Legacy (IE11)
   - ✅ Summary report

### 🛠️ Ajouter un Nouveau Test

**Template de test Playwright :**

```typescript
// tests/new-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Avant chaque test
    await page.goto('http://localhost:3000');
  });

  test('should display the feature', async ({ page }) => {
    // Arrange
    const element = page.locator('[data-testid="feature"]');
    
    // Act
    await element.click();
    
    // Assert
    await expect(element).toBeVisible();
    expect(await element.textContent()).toBe('Expected Text');
  });

  test('should work on all browsers', async ({ browserName }) => {
    // Test spécifique par navigateur
    if (browserName === 'safari') {
      // Safari-specific behavior
    } else if (browserName === 'firefox') {
      // Firefox-specific behavior
    }
  });
});
```

**Ajouter le test :**

```bash
# 1. Créer le fichier
cat > tests/new-feature.spec.ts << 'EOF'
[contenu ci-dessus]
EOF

# 2. Exécuter
npm run test tests/new-feature.spec.ts

# 3. Ajouter à Git
git add tests/new-feature.spec.ts
git commit -m "Add test for new feature"
```

### 📋 Checklist de Validation - Tests Automatisés

- [ ] Tous les navigateurs Playwright installés (`npx playwright install`)
- [ ] `npm run test:all` retourne 109+ ✅
- [ ] GitHub Actions workflow configuré (`.github/workflows/playwright-tests.yml`)
- [ ] CI/CD tests passent sur tous les OS (Windows, macOS, Ubuntu)
- [ ] Rapport HTML généré après tests (`playwright-report/`)
- [ ] Aucune faille d'accessibilité détectée
- [ ] Performance > 80 sur Lighthouse
- [ ] Tests mobiles (Android + iOS) passent
- [ ] Tests legacy (IE11) acceptables

---

## PART 3 : Validation Manuelle Utilisateur

### 🎯 Objectif
Tester l'application sur des vrais navigateurs avec une approche utilisateur (fonctionnalité, performance, UX).

### 🌐 Navigateurs à Tester

#### Sur Windows 10/11

**Chrome (dernière version)**
```
1. Télécharger : https://www.google.com/chrome/
2. Installer avec options par défaut
3. Ouvrir l'app : http://localhost:3000
```

**Firefox (dernière version)**
```
1. Télécharger : https://www.mozilla.org/firefox/
2. Installer avec options par défaut
3. Ouvrir l'app : http://localhost:3000
```

**Edge (dernière version - Chromium)**
```
1. Pré-installé sur Windows 10/11
2. Ouvrir et aller à : http://localhost:3000
```

**Anciennes versions (Optionnel)**
```
Chrome 90, Firefox 88, Edge 90 (pour vérifier rétro-compatibilité)
Utiliser : https://www.oldversion.com/ ou VM virtuelles
```

#### Sur macOS

**Safari (dernière version)**
```
1. Ouvrir Safari (menu Apple > Safari)
2. Aller à : http://localhost:3000
3. Check: Preferences > Privacy pour activer console
```

**Chrome macOS**
```
1. Télécharger : https://www.google.com/chrome/
2. Installer depuis le .dmg
3. Ouvrir l'app
```

**Firefox macOS**
```
1. Télécharger : https://www.mozilla.org/firefox/
2. Installer depuis le .dmg
3. Ouvrir l'app
```

#### Sur Mobile (Android/iOS)

**Android - Chrome**
```
1. Ouvrir l'app Chrome
2. Aller à : http://[YOUR_IP_ADDRESS]:3000
   (obtenir IP : ipconfig sur Windows, ifconfig sur Mac/Linux)
3. Tester comme sur desktop
```

**Android - Firefox**
```
1. Télécharger Firefox pour Android
2. Aller à : http://[YOUR_IP_ADDRESS]:3000
3. Tester
```

**iOS - Safari**
```
1. Ouvrir l'app Safari
2. Aller à : http://[YOUR_IP_ADDRESS]:3000
3. Tester (ou utiliser Xcode simulator)
```

**iOS - Edge (optionnel)**
```
1. Télécharger Microsoft Edge depuis App Store
2. Aller à : http://[YOUR_IP_ADDRESS]:3000
```

### 📋 Checklist Fonctionnelle - Tous les Navigateurs

#### 🔐 Authentification

```
TESTS À FAIRE SUR CHAQUE NAVIGATEUR :

☐ Page de connexion s'affiche
☐ Formulaire de connexion accepte email + mot de passe
☐ Connexion réussit avec bonnes identifiants
☐ Message d'erreur s'affiche avec mauvaises identifiants
☐ Bouton "Se souvenir de moi" fonctionne
☐ Lien "Mot de passe oublié" fonctionne
☐ Page d'inscription s'affiche
☐ Validation email en temps réel
☐ Validation mot de passe (force) en temps réel
☐ Token JWT stocké dans localStorage
☐ Déconnexion efface le token
☐ Accès refusé sans token (redirection login)
☐ Responsive design (desktop 1920px, tablet 768px, mobile 375px)
```

#### 📊 Dashboard

```
☐ Dashboard s'affiche après connexion
☐ KPIs affichent les bonnes valeurs
☐ Graphiques Chart.js s'affichent correctement
☐ Graphiques responsive (rédimensionner la fenêtre)
☐ Filtre par période fonctionne
☐ Boutons d'export présents et actifs
☐ SMS widget affiche les derniers SMS
☐ Pas d'erreurs JavaScript en console (F12)
☐ Pas de layout shift en chargeant les données
☐ Performance acceptable (< 3s pour charger)
```

#### 📝 Gestion des Contrats

```
☐ Tableau des contrats s'affiche
☐ Bouton "Nouveau contrat" accessible
☐ Formulaire de création contrat valide les champs
☐ Fichiers à télécharger (PDF)
☐ Édition d'un contrat fonctionne
☐ Suppression d'un contrat fonctionne (avec confirmation)
☐ Recherche par nom/numéro fonctionne
☐ Pagination fonctionne (10, 25, 50 par page)
☐ Tri par colonne fonctionne
☐ Sticky header du tableau (scroll vertical)
☐ Responsive design sur mobile
```

#### 💰 Traitement des Paiements

```
☐ Liste des paiements s'affiche
☐ Création de nouveau paiement fonctionne
☐ Validations des champs OK
☐ Support multi-devises (USD, EUR, XOF, etc.)
☐ Conversion de devises fonctionne
☐ Historique des paiements accessible
☐ Filtres par période/statut/devise fonctionnent
☐ Édition de paiement autorisée/refusée selon statut
☐ Suppression de paiement fonctionne (softdelete)
☐ Export en CSV fonctionne
☐ Pas d'erreurs d'arrondi monétaire
```

#### 📱 SMS & Notifications

```
☐ Page SMS s'affiche
☐ Liste des SMS reçus s'affiche
☐ Envoi d'un SMS test fonctionne
☐ Templates SMS disponibles
☐ Sélection de destinataires fonctionne
☐ Envoi en masse fonctionne
☐ Historique SMS visible
☐ Notifications toast s'affichent (success/error)
☐ Notifications restent 5 secondes avant disparition
☐ Sons de notification (si activés)
```

#### 📥 Export de Données

```
☐ Bouton Export PDF présent
☐ Bouton Export CSV présent
☐ Bouton Export Excel présent
☐ Export PDF se génère en < 3s
☐ Export CSV formaté correctement (UTF-8, séparateurs)
☐ Export Excel avec styles et header
☐ Fichiers téléchargement automatique en navigateur
☐ Noms de fichiers contiennent la date
☐ Données cohérentes (même que tableau)
```

### ⏱️ Tests de Performance

**À tester sur chaque navigateur :**

```
TIMING À MESURER (avec F12 > Network > Timings) :

☐ First Contentful Paint (FCP) < 2s
☐ Largest Contentful Paint (LCP) < 4s
☐ Cumulative Layout Shift (CLS) < 0.1
☐ Time to Interactive (TTI) < 3.5s
☐ Total page size < 2MB

ACTIONS À MESURER :

☐ Clic "Nouveau contrat" → Form visible < 500ms
☐ Clic "Sauvegarder contrat" → API response < 1s
☐ Tableau contracts charge < 2s
☐ Export PDF génère < 3s
☐ Graphiques Chart.js se tracent < 1.5s
☐ Filtre dashboard applique < 800ms
```

### 🔍 Tests de Responsive Design

**Breakpoints à tester :**

```
DESKTOP (1920 x 1080)
☐ Layout complet visible
☐ Sidebar navigation visible
☐ Toutes les colonnes du tableau visibles
☐ Graphiques occupent plein espace

LAPTOP (1366 x 768)
☐ Layout se compacte gracefully
☐ Aucune scrollbar horizontale
☐ Boutons restent accessibles

TABLET (768 x 1024)
☐ Sidebar devient hamburger menu
☐ Tableau switch en mobile view
☐ Graphiques stack verticalement
☐ Touch targets > 48px

MOBILE (375 x 812)
☐ Navigation en hamburger menu
☐ Texte lisible sans zoom
☐ Boutons > 44px (Apple standard)
☐ Aucune content cutoff
☐ Formulaires avec clavier iOS
☐ Aucune horizontal scrollbar

REDIMENSIONNEMENT
☐ Draguer les côtés de la fenêtre
☐ Vérifier aucun layout break
☐ Flexbox adapte correctement
☐ Images ne pixelisent pas
```

### 🎨 Tests Visuels

**À vérifier sur chaque navigateur :**

```
TYPOGRAPHIE
☐ Polices de caractères correctes (Google Fonts)
☐ Tailles identiques à tous les navigateurs
☐ Anti-aliasing smooth
☐ Aucun caractère cassé/manquant

COULEURS
☐ Couleurs identiques (sauf rendus naturels)
☐ Contraste respecte WCAG AA (4.5:1 ratio)
☐ Pas de "color banding" (dégradés)

IMAGES & SVG
☐ Images chargent correctement
☐ SVG ne pixelisent pas au zoom
☐ Icons s'affichent correctement
☐ Retina display (@2x images)

FORMES & ESPACES
☐ Boutons arrondis = courbes lisses
☐ Ombres sont cohérentes
☐ Padding/margin identiques
☐ Bordures droites
```

### 🔊 Tests d'Accessibilité

**À tester sur chaque navigateur :**

```
CLAVIER
☐ Tab navigate tous les éléments interactifs
☐ Shift+Tab navigue en sens inverse
☐ Enter active les boutons
☐ Space active les checkboxes
☐ Arrows naviguent les dropdowns/menus
☐ Esc ferme les modals

SCREEN READER
☐ Ouvrir Voiceover (macOS: Cmd+F5)
☐ Ouvrir NVDA ou JAWS (Windows - tester au moins NVDA)
☐ Labels associés aux inputs
☐ Boutons annoncent correctement
☐ Images ont alt text
☐ Listes annoncées comme listes
☐ Tables ont headers correctement associées

ZOOM
☐ Zoom 200% → layout reste OK (pas de cutoff)
☐ Zoom 400% → scrollbar horizontal acceptable
☐ Texte lisible à 200%
☐ Boutons restent cliquables à zoom 200%

CONTRASTE
☐ Ratio contraste > 4.5:1 pour texte normal
☐ Ratio contraste > 3:1 pour texte large
☐ Utiliser : https://webaim.org/resources/contrastchecker/
```

### 🐛 Console JavaScript

**À vérifier sur chaque navigateur (F12 > Console):**

```
AUCUNE ERREUR DE :
☐ ReferenceError (variable undefined)
☐ TypeError (function not a function)
☐ SyntaxError (parse error)
☐ NetworkError (API non disponible)
☐ PermissionError (localStorage disabled)
☐ CORS errors (API crossorigin)

WARNINGS ACCEPTABLES :
⚠️  Deprecation warnings (React 17→18, etc)
⚠️  DevTools reminders ("Don't paste untrusted code")
⚠️  AdBlock notifications

SOURCES À VÉRIFIER :
☐ Aucune erreur de source mapping
☐ Console.error() ne devrait pas être appelé
☐ Pas de undefined logs
```

### 📋 Checklist Finale - Validation Manuelle

**À cocher pour CHAQUE navigateur :**

**Chrome (Windows/macOS)**
- [ ] Version : _____ (ex: 120.0.6099.129)
- [ ] Authentification ✅
- [ ] Dashboard + KPIs ✅
- [ ] Contrats CRUD ✅
- [ ] Paiements ✅
- [ ] SMS ✅
- [ ] Exports PDF/CSV/Excel ✅
- [ ] Performance (FCP < 2s, LCP < 4s) ✅
- [ ] Responsive desktop (1920x1080) ✅
- [ ] Console JavaScript: ✅ No errors

**Firefox (Windows/macOS)**
- [ ] Version : _____ (ex: 121.0)
- [ ] [Même checklist que Chrome]

**Safari (macOS/iOS)**
- [ ] Version : _____ (ex: 17.1)
- [ ] [Même checklist que Chrome]
- [ ] Extra: Zoom pinch-to-zoom fonctionne (mobile) ✅

**Edge (Windows)**
- [ ] Version : _____ (ex: 120.0.2210.77)
- [ ] [Même checklist que Chrome]

**Mobile Android (Chrome/Firefox)**
- [ ] Responsive tablet (768x1024) ✅
- [ ] Responsive mobile (375x812) ✅
- [ ] Touch targets > 48px ✅
- [ ] Clavier ne cache pas inputs ✅
- [ ] Scroll fluide ✅

**Mobile iOS (Safari/Edge)**
- [ ] Responsive tablet (768x1024) ✅
- [ ] Responsive mobile (375x812) ✅
- [ ] Touch targets > 44px ✅
- [ ] Clavier ne cache pas inputs ✅
- [ ] Scroll fluide ✅
- [ ] Swipe back navigation fonctionne ✅

---

## PART 4 : Suivi & Assurance Qualité

### 🎯 Objectif
Configurer le monitoring en production pour tracker les erreurs par navigateur et mesurer la performance utilisateur.

### 🔍 Erreurs en Production avec Sentry

#### Configuration Sentry

**1. Créer un compte Sentry :**

```
1. Aller sur : https://sentry.io/
2. Sign up avec email
3. Créer une organisation (ex: "AKIG Production")
4. Créer un projet React
5. Copier le DSN (ex: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx)
```

**2. Configurer dans l'application :**

```typescript
// src/utils/monitoring.ts (déjà créé)

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new BrowserTracing()
  ]
});
```

**3. Ajouter à `.env` :**

```bash
# .env
REACT_APP_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**4. Dans `src/App.jsx`, wrapper l'app :**

```jsx
import * as Sentry from "@sentry/react";

const SentryApp = Sentry.withProfiler(App);

export default SentryApp;
```

#### Consulter les Erreurs Sentry

**Dashboard Sentry :**

1. Aller sur : `https://sentry.io/` (login)
2. Sélectionner votre organisation + projet
3. Voir toutes les erreurs en temps réel

**Filtrer par navigateur :**

```
Issues > Chercher par tag:
- browser.name: "chrome"
- browser.name: "firefox"
- browser.name: "safari"
- browser.name: "edge"

OU

- os.name: "Windows"
- os.name: "macOS"
- os.name: "iOS"
- os.name: "Android"
```

**Interprétation :**

```
HIGH PRIORITY (Corriger immédiatement)
❌ TypeError: Cannot read property 'xxx' of undefined
❌ ReferenceError: 'xxx' is not defined
❌ NetworkError: Failed to fetch

MEDIUM PRIORITY (Corriger cette sprint)
⚠️  Deprecation warnings
⚠️  Unhandled promise rejections
⚠️  Slow API calls (> 1s)

LOW PRIORITY (Corriger bientôt)
ℹ️  Console warnings
ℹ️  Accessibility warnings
```

### 📊 Analytics avec Google Analytics 4

#### Configuration GA4

**1. Créer une propriété GA4 :**

```
1. Aller sur : https://analytics.google.com/
2. Créer un nouveau compte
3. Créer une propriété "AKIG Production"
4. Obtenir le Measurement ID (ex: G-XXXXXXXXXX)
```

**2. Configurer dans l'application :**

```typescript
// src/utils/analytics.ts (déjà créé)

import ReactGA from "react-ga4";

ReactGA.initialize(process.env.REACT_APP_GA_ID);
```

**3. Ajouter à `.env` :**

```bash
# .env
REACT_APP_GA_ID=G-XXXXXXXXXX
```

**4. Tracker les pages :**

```typescript
// Dans src/App.jsx ou Router
import ReactGA from "react-ga4";

useEffect(() => {
  ReactGA.pageview(window.location.pathname);
}, [location]);
```

#### Consulter les Données GA4

**Dashboard GA4 :**

1. Aller sur : `https://analytics.google.com/`
2. Sélectionner votre propriété
3. Voir les rapports

**Données utiles :**

```
UTILISATEURS
- Nombre d'utilisateurs actifs
- Nouvelles sessions
- Utilisateurs par pays/région

APPAREILS
- Breakdown par navigateur
  - Chrome: 45%
  - Safari: 30%
  - Firefox: 15%
  - Edge: 10%

- Breakdown par OS
  - Windows: 60%
  - macOS: 20%
  - iOS: 15%
  - Android: 5%

- Breakdown par appareil
  - Desktop: 70%
  - Mobile: 25%
  - Tablet: 5%

COMPORTEMENT
- Événements custom (Login, Export PDF, SMS Sent)
- Durée moyenne de session
- Taux de rebond
- Pages les plus consultées
```

**Créer un rapport personnalisé :**

```
1. Cliquer sur "Create" (+ button)
2. Sélectionner "Custom Report"
3. Ajouter dimensions :
   - Browser
   - Operating System
   - Device Category
4. Ajouter métriques :
   - Sessions
   - Users
   - Average Session Duration
5. Sauvegarder et partager avec l'équipe
```

### 🎯 Incidents & Alertes

#### Créer une alerte Sentry

```
1. Sentry Dashboard > Alerts > Create Alert
2. Set condition:
   - Error rate > 5% (en une heure)
   - Ou : Nombre d'erreurs > 10 (en 5 min)
3. Set action:
   - Send email à l'équipe
   - Post to Slack
   - Send SMS (optionnel)
4. Save
```

#### Créer une alerte GA4

```
1. GA4 Dashboard > Admin > Alerts
2. Create Alert
3. Condition: User-initiated event rate drop > 20%
4. Notification: Email to alerts@company.com
5. Save
```

### 📋 Procédure d'Investigation d'Erreur

**Quand une erreur est reportée :**

```
1. RÉCUPÉRER LES INFOS
   - URL où l'erreur s'est produite
   - Navigateur et version
   - Système d'exploitation
   - Étapes pour reproduire
   - Screenshot si possible

2. VÉRIFIER SUR LOCAL
   - npm run dev (démarrer l'app localement)
   - Ouvrir DevTools (F12)
   - Reproduire les étapes
   - Regarder la console pour les erreurs

3. VÉRIFIER DANS SENTRY
   - Aller sur Sentry
   - Chercher l'erreur par message
   - Voir le stack trace complet
   - Vérifier la fréquence (1x ou 1000x?)
   - Identifier les navigateurs affectés

4. VÉRIFIER LE CODE
   - Ouvrir le fichier de la stack trace
   - Regarder le contexte
   - Vérifier le git blame (qui a écrit ce code)
   - Vérifier la version du navigateur concerné

5. CORRIGER
   - Écrire la correction
   - Ajouter un test pour la reproduire
   - Commit avec message explicite
   - Push et vérifier en CI/CD

6. DÉPLOYER & VALIDER
   - Déployer en production
   - Vérifier dans Sentry que l'erreur disparaît (dans 1h)
   - Confirmer en GA4 que les utilisateurs ne voient plus d'erreurs
```

### 📈 Tableau de Bord de Suivi

**Metrics à tracker quotidiennement :**

```
KPI PRODUCTION AKIG
═══════════════════════════════════════════════════════

ERREURS (Sentry)
├─ Total errors today: _______
├─ Critical errors (fixme): _______
├─ Top 3 errors:
│  ├─ _________________ (count: ___)
│  ├─ _________________ (count: ___)
│  └─ _________________ (count: ___)
└─ Errors by browser:
   ├─ Chrome: _____ (45%)
   ├─ Safari: _____ (30%)
   ├─ Firefox: _____ (15%)
   └─ Edge: _____ (10%)

UTILISATEURS (GA4)
├─ Active users (today): _______
├─ New sessions: _______
├─ Avg session duration: _____ min
├─ Bounce rate: _____%
└─ Device breakdown:
   ├─ Desktop: _____ (70%)
   ├─ Mobile: _____ (25%)
   └─ Tablet: _____ (5%)

PERFORMANCE (Lighthouse CI)
├─ Performance score: _____ / 100
├─ Accessibility score: _____ / 100
├─ Best practices score: _____ / 100
└─ SEO score: _____ / 100

STATUS
├─ API response time: _____ ms (target: < 500ms)
├─ Page load time: _____ s (target: < 3s)
├─ Uptime: ____% (target: > 99.9%)
└─ Database health: ✅ / ⚠️ / ❌
```

### 🔧 Quick Setup Checklist

**À faire avant le lancement :**

- [ ] Compte Sentry créé et configured
- [ ] Sentry DSN en `.env`
- [ ] Monitoring.ts importé dans App.jsx
- [ ] Compte GA4 créé et configured
- [ ] GA4 ID en `.env`
- [ ] Analytics.ts importé dans App.jsx
- [ ] Alertes Sentry configurées (email/Slack)
- [ ] Alertes GA4 configurées (email)
- [ ] Dashboard Sentry bookmarké
- [ ] Dashboard GA4 bookmarké
- [ ] Équipe formation sur lecture des rapports
- [ ] Procédure d'incident documentée

---

## Troubleshooting & FAQ

### ❌ Les tests ne passent pas

**Problème : `Error: Timeout waiting for port 3000`**

```bash
# Solution
# 1. Vérifier que l'app est en cours d'exécution
npm run dev

# 2. Dans un autre terminal
npm run test

# 3. Si toujours pas d'écoute
lsof -i :3000                    # macOS/Linux
netstat -ano | findstr :3000     # Windows PowerShell

# 4. Tuer le processus et recommencer
```

**Problème : `Test timeout 30s`**

```bash
# Le test prend trop longtemps
# 1. Augmenter le timeout
test.setTimeout(60000); // 60 secondes

# 2. Ou améliorer la performance
# - Optimiser les requêtes API
# - Réduire la complexité du rendu
# - Utiliser des fixtures de test plus simples
```

### ⚠️ Navigateur ne démarre pas

**Problème : `browser.launch is not a function`**

```bash
# Solution
npm install @playwright/test --save-dev
npx playwright install  # ← Important!

# Vérifier l'installation
ls node_modules/.bin/playwright
```

**Problème : `Safari browser not available on Windows`**

```bash
# Safari fonctionne UNIQUEMENT sur macOS
# Solution: Utiliser un Mac pour tester Safari
# OU utiliser Browserstack/BrowserMob pour tests distants
```

### 🔴 Erreur: Cross-Origin Request Blocked (CORS)

**Problème en navigateur :**

```
XMLHttpRequest cannot load http://api.com/data
due to access control checks
```

**Solution :**

```javascript
// Backend (Express)
app.use(cors({
  origin: ['http://localhost:3000', 'https://production-domain.com'],
  credentials: true
}));
```

**Vérifier :**

```bash
# Chrome DevTools > Network > Headers
# Chercher:
Response Header: Access-Control-Allow-Origin: http://localhost:3000
Request Header: Origin: http://localhost:3000
```

### 🚀 App est lente en production

**Mesurer la performance :**

```
1. Chrome DevTools > Lighthouse (F12)
2. Cliquer "Analyze page load"
3. Attendre le rapport
4. Regarder les sections rouges (problèmes)
```

**Optimisations courantes :**

```
☐ Compresser les images (ImageOptim, Tinypng)
☐ Code splitting (lazy load routes)
☐ Bundle minification
☐ Cache HTTP (Service Worker)
☐ CDN pour assets statiques
☐ Lazy load components
☐ Réduire polyfills inutiles
```

### 📱 Test sur mobile ne fonctionne pas

**Problème : `Cannot reach localhost:3000 from phone`**

```bash
# Solution
# 1. Trouver votre IP locale
ipconfig getifaddr en0              # macOS
ipconfig                            # Windows (chercher IPv4 Address)

# 2. Dans le téléphone
# Aller à : http://YOUR_IP:3000
# Ex: http://192.168.1.100:3000

# 3. Vérifier que le firewall permet
# Windows Firewall > Allow app through
# Cocher Node.js ou le port 3000
```

### 🔓 Erreur localStorage undefined

**Problème : `TypeError: Cannot read property 'setItem' of undefined`**

```typescript
// Solution
const storage = typeof window !== 'undefined' ? localStorage : null;

if (storage) {
  storage.setItem('key', 'value');
} else {
  console.warn('localStorage not available');
}
```

**Ou utiliser une librairie :**

```bash
npm install js-cookie
```

```typescript
import Cookies from 'js-cookie';
Cookies.set('key', 'value');
```

### 🔐 JWT Token expiré

**Problème : Utilisateur déconnecté aléatoirement**

```typescript
// Solution: Auto-refresh token
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const newToken = await response.json();
    localStorage.setItem('token', newToken.accessToken);
  } catch (error) {
    // Token expiré, rediriger vers login
    window.location.href = '/login';
  }
};

// Appeler 5 minutes avant expiration
setInterval(refreshToken, 55 * 60 * 1000); // 55 min
```

### 🐛 Console Error: "AKIG is not defined"

**Problème :**

```
ReferenceError: AKIG is not defined
```

**Solution :**

```typescript
// Vérifier que window.AKIG est défini
if (typeof window !== 'undefined') {
  window.AKIG = {
    // Configuration globale
    version: '1.0.0'
  };
}
```

### 📊 Sentry n'envoie pas les erreurs

**Problème : Erreurs n'apparaissent pas dans Sentry**

```bash
# 1. Vérifier le DSN
echo $REACT_APP_SENTRY_DSN
# Devrait afficher: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# 2. Vérifier que Sentry est init avant l'app
// src/index.js
import * as Sentry from "@sentry/react";
Sentry.init({ ... });  // ← Avant ReactDOM.render()
ReactDOM.render(<App />, document.getElementById('root'));

# 3. Déclencher une erreur de test
window.TestError = new Error("Test Sentry");
throw window.TestError;

# 4. Vérifier dans Sentry dashboard après 1-2 minutes
```

### 📈 GA4 ne track pas les événements

**Problème : Événements custom n'arrivent pas en GA4**

```typescript
// Solution
import ReactGA from "react-ga4";

// S'assurer que l'init est appelée
ReactGA.initialize(process.env.REACT_APP_GA_ID);

// Tracker l'événement
ReactGA.event({
  category: "engagement",
  action: "pdf_export",
  label: "contract_123",
  value: 1
});

// Vérifier le timing: GA4 peut prendre 24-48h pour apparaître
// Mais Real-time report devrait montrer immédiatement
```

---

## 📞 Support & Escalade

**Problème non résolu ?**

1. **Consultation logs détaillés**
   ```bash
   npm run dev 2>&1 | tee debug.log
   npm run test 2>&1 | tee test.log
   ```

2. **Chercher sur StackOverflow/GitHub**
   - Copier le message d'erreur exact
   - Ajouter le navigateur et version
   - Chercher sur : stackoverflow.com, github.com/issues

3. **Reporter un bug**
   ```bash
   git log -1 --oneline  # Dernière version
   npm list --depth=0    # Dépendances clés
   uname -a              # OS info
   ```

4. **Contacter l'équipe support**
   - Email: support@akig.com
   - Slack: #akig-bugs
   - Inclure les logs et reproduction steps

---

## ✅ Conclusion

**Système de validation complet mis en place :**

✅ Standards web validés (HTML5, CSS3, ES6+)
✅ Tests automatisés (109+ tests, 8 navigateurs)
✅ Validation manuelle (checklists détaillées)
✅ Monitoring production (Sentry + GA4)

**Prochaines étapes :**

1. Exécuter `npm run test:all` pour valider tous les tests
2. Faire la validation manuelle sur les 5+ navigateurs
3. Configurer Sentry et GA4 en production
4. Mettre en place les alertes
5. Former l'équipe aux procédures d'investigation

**Questions ?** Consulter le troubleshooting ci-dessus ou escalader à l'équipe technique.

---

**Livraison validée : Décembre 2024** ✅
