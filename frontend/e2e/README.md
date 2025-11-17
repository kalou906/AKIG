# 🧪 Tests E2E Playwright - AKIG

## 📦 Installation

```bash
# Installer les dépendances Playwright
npm install -D @playwright/test

# Installer les navigateurs
npx playwright install
```

## 🚀 Exécution des Tests

### Tous les tests
```bash
npm run test:e2e
```

### Mode UI interactif
```bash
npm run test:e2e:ui
```

### Tests rapides (Chromium uniquement)
```bash
npm run test:fast
```

### Tests par fichier
```bash
npx playwright test login.spec.ts
npx playwright test dashboard.spec.ts
npx playwright test tenants.spec.ts
```

### Mode debug
```bash
npx playwright test --debug
```

## 📊 Rapports

Après exécution, ouvrir le rapport HTML :
```bash
npx playwright show-report
```

## 📁 Structure

```
e2e/
├── login.spec.ts       # Tests authentification
├── dashboard.spec.ts   # Tests page Dashboard
└── tenants.spec.ts     # Tests gestion locataires
```

## ✅ Couverture Actuelle

- ✅ Login flow (formulaire, validation, redirection)
- ✅ Dashboard (KPIs, navigation)
- ✅ Tenants (liste, recherche, filtres, modal)
- ✅ Raccourcis clavier (Ctrl+K pour Genius Panel)
- ✅ Responsive (Desktop + Mobile)

## 🔧 Configuration

Voir `playwright.config.ts` pour :
- Navigateurs testés (Chromium, Firefox, Safari, Mobile)
- Timeouts et retries
- Screenshots/vidéos en cas d'échec
- Serveur de dev automatique

## 🎯 Bonnes Pratiques

1. **Sélecteurs robustes** : Privilégier `role`, `text`, `aria-label`
2. **Attentes explicites** : Toujours utiliser `waitForURL`, `waitForSelector`
3. **Isolation** : Chaque test doit être indépendant (beforeEach login)
4. **Assertions claires** : Messages d'erreur descriptifs
5. **Screenshots** : Automatiques en cas d'échec

## 🔍 Debugging

```bash
# Mode headed (voir le navigateur)
npx playwright test --headed

# Mode debug pas à pas
npx playwright test --debug

# Trace viewer
npx playwright show-trace trace.zip
```

## 📝 Exemple de Test

```typescript
import { test, expect } from '@playwright/test';

test('should display dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@akig.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## 🚨 CI/CD

Les tests E2E tournent automatiquement sur GitHub Actions :
- ✅ Sur chaque push main/develop
- ✅ Sur chaque Pull Request
- ✅ Rapports uploadés en artifacts

Voir `.github/workflows/ci-cd.yml`
