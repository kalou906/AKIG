# 📱 Configuration PWA - AKIG

## Vue d'ensemble

AKIG est configuré comme une **Progressive Web App (PWA)** production-ready avec :

- ✅ Manifest PWA (`manifest.json`)
- ✅ Service Worker avec offline support (`sw.ts`)
- ✅ Installation sur Home Screen
- ✅ Support iOS (Apple Web App)
- ✅ Stratégie de cache intelligente
- ✅ Synchronisation en arrière-plan

## Architecture PWA

### 1. **manifest.json** (`/public/manifest.json`)

Configuration standard PWA incluant :

```json
{
  "name": "AKIG - Gestion Immobilière Intelligente",
  "short_name": "AKIG",
  "description": "Plateforme de gestion immobilière avec assistant IA",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#0f766e",
  "background_color": "#ffffff",
  "icons": [
    {"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
    {"src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ],
  "screenshots": [
    {"src": "/screenshots/screenshot-1.png", "sizes": "540x720", "form_factor": "narrow"},
    {"src": "/screenshots/screenshot-2.png", "sizes": "1280x720", "form_factor": "wide"}
  ],
  "shortcuts": [
    {
      "name": "Nouveaux Locataires",
      "short_name": "Locataires",
      "description": "Ajouter un nouveau locataire",
      "url": "/?page=tenants",
      "icons": [{"src": "/icons/shortcut-tenants.png", "sizes": "192x192", "type": "image/png"}]
    },
    {
      "name": "Contrats",
      "short_name": "Contrats",
      "description": "Gérer les contrats",
      "url": "/?page=contracts",
      "icons": [{"src": "/icons/shortcut-contracts.png", "sizes": "192x192", "type": "image/png"}]
    }
  ],
  "categories": ["business", "productivity"],
  "prefer_related_applications": false
}
```

**Points clés :**
- `display: "standalone"` → Affiche comme app native (pas de barre d'URL)
- `start_url: "/"` → Page au lancement
- `scope: "/"` → Toute l'app est dans le scope du SW
- `icons: [...]` → Logos pour home screen
- `shortcuts` → Actions rapides sur long-press

### 2. **Service Worker** (`/src/sw.ts`)

Gère le caching intelligent et les fonctionnalités offline :

#### **Stratégies de Cache**

```typescript
// Cache-first (assets statiques)
GET /styles.css → cache d'abord, puis réseau
GET /index.html → cache d'abord, puis réseau

// Network-first (API)
GET /api/tenants → réseau d'abord, fallback cache
GET /api/contracts → réseau d'abord, fallback cache
```

#### **Événements Gérés**

| Événement | Action | But |
|-----------|--------|-----|
| `install` | Mettre en cache les assets statiques | Préparer l'app offline |
| `activate` | Nettoyer les vieux caches | Maintenir l'espace disque |
| `fetch` | Interception des requêtes | Appliquer les stratégies cache |
| `sync` | Synchronisation en arrière-plan | Synchroniser les données offline |
| `push` | Notifications push | Alertes aux utilisateurs |

#### **Structure des Caches**

```
localStorage/IndexedDB:
├── akig-v1:assets  (CSS, JS, images statiques)
└── akig-v1:api     (Requêtes API en cache)

Cleanup automatique:
├── Anciens caches supprimés lors de l'activation
└── Version mises à jour → CACHE_VERSION = 'akig-v2'
```

### 3. **Enregistrement Service Worker** (`/src/index.tsx`)

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}
```

**Pourquoi attendre 'load'** :
- Assure que l'app s'est bien chargée en premier
- Évite les surcharges au démarrage
- Permet au SW de s'enregistrer en arrière-plan

### 4. **Meta Tags HTML** (`/public/index.html`)

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- iOS Support -->
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="AKIG">

<!-- Android Support -->
<meta name="theme-color" content="#0f766e">
```

## 🚀 Déploiement

### **Build avec Service Worker**

```bash
# Utiliser le script de build personnalisé
./build-with-sw.sh

# Résultat:
# build/index.html (app principale)
# build/sw.js (Service Worker compilé)
# build/manifest.json (PWA config)
```

### **Fichiers Requis**

```
public/
├── manifest.json ✅ Créé
├── index.html ✅ Mis à jour
└── icons/
    ├── icon-192.png (à créer)
    ├── icon-512.png (à créer)
    ├── icon-maskable-192.png (à créer)
    └── icon-maskable-512.png (à créer)

src/
├── sw.ts ✅ Créé
└── index.tsx ✅ Mis à jour avec enregistrement SW
```

### **Configuration HTTPS**

⚠️ **Important** : Service Workers ne fonctionne QUE sur HTTPS

- Production : Déployer avec HTTPS
- Développement : `localhost:3000` fonctionne aussi

## 🎯 Checklist Installation

### Pour Android

1. ✅ Manifest.json avec `display: "standalone"`
2. ✅ Icons PNG 192x192 et 512x512
3. ✅ `start_url` défini
4. ✅ Service Worker enregistré
5. ✅ HTTPS en production

### Pour iOS

1. ✅ `apple-touch-icon` 180x180 (rembourrage blanc)
2. ✅ `apple-mobile-web-app-capable` = yes
3. ✅ `apple-mobile-web-app-title`
4. ✅ `theme-color` visible
5. ⚠️ iOS 16.4+ pour PWA complète

## 📊 Monitoring PWA

### **Chrome DevTools**

```
F12 → Application → Service Workers
- Vérifier l'enregistrement
- Voir les caches
- Forcer update/unregister
```

### **Audit Lighthouse**

```
F12 → Lighthouse → Generate Report
- PWA audit
- Score performance
- Recommandations
```

### **Logs Service Worker**

```typescript
// Dans sw.ts
console.log('[SW] Install event');
console.log('[SW] Cache hit:', request.url);
console.log('[SW] Network failed, using cache');
```

## 🔄 Mise à Jour du Service Worker

### **Trigger Update**

```typescript
// Incrementer la version
const CACHE_VERSION = 'akig-v2'; // Avant: v1

// Rebuild et redeploy
npm run build
```

Le navigateur détecte automatiquement le changement et :
1. Télécharge le nouveau SW
2. Active l'`activate` event
3. Nettoie les anciens caches
4. La nouvelle version prend effet

### **Forcer Update (User)**

```typescript
// Dans l'app
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SKIP_WAITING'
  });
}
```

## 🛡️ Sécurité

### **Politique d'Étendue**

```typescript
// Service Worker apply seulement à son scope
scope: "/" → Contrôle toute l'app
scope: "/api/" → Contrôle seulement /api/*
```

### **Headers Serveur Requis**

```
Service-Worker-Allowed: /        (ou spécific path)
Cache-Control: no-store           (pour sw.js)
```

## 📱 Raccourcis (Shortcuts)

Accès rapides après installation (long-press icon) :

```json
{
  "shortcuts": [
    {
      "name": "Nouveaux Locataires",
      "url": "/?page=tenants",
      "icons": [{"src": "/icons/shortcut-tenants.png"}]
    }
  ]
}
```

## 🧪 Test Offline

### **Chrome DevTools**

1. F12 → Network tab
2. Cocher "Offline"
3. Rechargement
4. L'app fonctionne via le cache
5. Les requêtes API montrent le fallback cache

### **Simuler Connexion Lente**

```
DevTools → Network → Throttling → "Slow 3G"
```

## 📚 Ressources

- [MDN PWA](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Worker Spec](https://w3c.github.io/ServiceWorker/)

## ✅ État d'Implémentation

| Feature | Statut | File |
|---------|--------|------|
| Manifest PWA | ✅ Complet | `/public/manifest.json` |
| Service Worker | ✅ Complet | `/src/sw.ts` |
| Enregistrement SW | ✅ Complet | `/src/index.tsx` |
| Cache Stratégies | ✅ Complet | `sw.ts` (cache-first/network-first) |
| Offline Support | ✅ Complet | Fallback automatique |
| Notifications Push | ✅ Ready | `sw.ts` (push event listener) |
| Background Sync | ✅ Ready | `sw.ts` (sync event listener) |
| Icons | ⏳ Pending | À générer (192x192, 512x512) |
| Screenshots | ⏳ Pending | Optionnel pour Android |

---

**Dernière mise à jour** : Oct 26, 2025  
**Version PWA** : 1.0.0 (akig-v1)
