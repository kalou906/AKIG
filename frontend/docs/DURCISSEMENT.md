# Durcissement opérationnel AKIG

## Architecture et modules
- **Frontend** : React 18, TypeScript, Tailwind, design system premium, charts, layout, pages métier, hooks, context UIConfig.
- **Backend attendu** : API REST stable (auth, tenants, properties, payments, reports, health).
- **Couplage** : client HTTP unique, API client modulaire, mapping et validation des schémas, retry réseau, feedback UI robuste.

## Checklist de robustesse
- [x] `tailwind.config.js` premium + purge
- [x] `index.css` utilitaires globaux
- [x] `clientBase.ts` HTTP + timeout + gestion 401 + métriques
- [x] `httpRetry.ts` retry exponentiel
- [x] `shape.ts` normalisation schémas (ensureItems, ensureNumber)
- [x] `mappers/payments.ts` mapping tolérant
- [x] `useQuery` avec retry, deps, enabled
- [x] Design system : Button, Card, Table, Feedback, Badge
- [x] Layout : Navbar, Sidebar (badges dynamiques), MainLayout (bandeau API, uptime), Footer
- [x] Pages : Dashboard, Payments, Reports, Tenants, Settings, ApiExplorer, EndpointStatusGrid
- [x] Tests unitaires utilitaires (shape, retry)
- [x] Script de vérification `scripts/sanityCheck.js`

## Sécurité & performance
- Purge automatique du token sur 401
- Limite de timeout HTTP (10s par défaut)
- Alerte console sur endpoint lent (>2s)
- Logger structuré (`utils/logger.ts`)
- Feedback UI accessible (`aria-live` sur ErrorBanner)
- Sentry/LogRocket prêts (masquage PII recommandé)
- Content-Security-Policy à ajouter dans `index.html`

## Validation manuelle
- Sidebar : tous les badges ✅
- MainLayout : bandeau API vert
- Dashboard : KPIs et charts OK, fallback vide
- Payments : export PDF/CSV, mapping tolérant
- Reports : export, fallback vide
- EndpointStatusGrid : tous les endpoints OK

## Validation automatique
- Lancer :
```bash
cd frontend
npm install node-fetch@2
node scripts/sanityCheck.js
```
- Tous les endpoints doivent répondre 200 et JSON correct.

## Recommandations avancées
- Ajouter tests snapshot sur pages critiques
- Ajouter intercepteur fetch global si besoin de logs avancés
- Sécuriser CSP, filtrer logs Sentry/LogRocket
- Précharger police Inter et premier bundle JS
- Vérifier purge Tailwind (content, safelist)

---
Plateforme AKIG prête, robuste, premium, validée. Pour toute extension, suivre ce modèle d’architecture et de validation.
