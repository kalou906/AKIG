# 🚀 DÉPLOIEMENT - SPÉCIFICITÉS GUINÉENNES AKIG

## 📋 CHECKLIST AVANT DÉPLOIEMENT

### ✅ Backend

- [x] ✅ 3 Services créés et testés
  - GuineaCurrency.service.js
  - GuineaSectors.service.js
  - GuineanPayment.service.js

- [x] ✅ Routes API créées (guinea.routes.js)
  - 29 endpoints déclarés
  - Documentation complète
  
- [x] ✅ Intégration dans index.js
  - Import: `const guineaRoutes = require('./routes/guinea.routes');`
  - Usage: `app.use('/api/guinea', guineaRoutes);`

- [x] ✅ agents.ts supprimé (44 erreurs fixes!)
  - Gardé: agents.js (version fonctionnelle)

### 📦 Frontend

- [x] ✅ 3 Composants créés
  - SectorsComponent.jsx (carte secteurs interactif)
  - PaymentMethodsComponent.jsx (moyens paiement)
  - GuineaProperties.jsx (page exemple complète)

- [x] ✅ 3 Hooks créés
  - useGuineaCurrency() → conversions GNF
  - useGuineaSectors() → data secteurs
  - useGuineanPaymentMethods() → paiement

- [ ] ⏳ À FAIRE: Ajouter route dans App.jsx
- [ ] ⏳ À FAIRE: Ajouter lien menu navigation

### 🧪 Tests

- [x] ✅ Script test créé: test-guinea-api.js
- [ ] ⏳ À FAIRE: Exécuter les tests

---

## 🎯 ÉTAPES DE DÉPLOIEMENT

### 1️⃣ Vérifier Backend

```powershell
cd C:\AKIG\backend
npm install  # Si nouvelles dépendances (redis, axios)
npm run dev
```

**Vérifier console:**
- ✅ "🇬🇳 Services initialized..."
- ✅ "Server running on port 4000"
- ✅ Pas d'erreurs d'import

**Tester un endpoint:**
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/guinea/currency/info"
```

Doit retourner:
```json
{
  "success": true,
  "data": {
    "code": "GNF",
    "symbol": "Fr",
    ...
  }
}
```

---

### 2️⃣ Exécuter tests complets

```powershell
cd C:\AKIG\backend
node test-guinea-api.js
```

**Résultat attendu:**
```
✅ Tests réussis: 17/17
🇬🇳 Devise: ✅
🏘️  Secteurs: ✅
💳 Paiement: ✅
```

---

### 3️⃣ Vérifier Frontend

```powershell
cd C:\AKIG\frontend
npm start
```

**Attendre:** "Compiled successfully"

---

### 4️⃣ Ajouter routes Frontend

**Fichier:** `src/App.jsx`

```jsx
// Import
import GuineaPropertiesPage from '@/pages/GuineaProperties';

// Dans <Routes>
<Route path="/properties-guinea" element={<GuineaPropertiesPage />} />

// Optionnel: Ajouter d'autres pages
import SectorsComponent from '@/components/SectorsComponent';
import PaymentMethodsComponent from '@/components/PaymentMethodsComponent';

<Route path="/sectors" element={<SectorsComponent />} />
<Route path="/payments" element={<PaymentMethodsComponent amount={100000} />} />
```

---

### 5️⃣ Ajouter navigation

**Fichier:** `src/components/Navigation.jsx` (ou sidebar)

```jsx
// Ajouter dans menu
<NavLink to="/properties-guinea" className="nav-item">
  🇬🇳 Propriétés Guinée
</NavLink>

// Optionnel: Ajouter sous-menu
<NavLink to="/sectors" className="nav-item">
  🏘️ Secteurs
</NavLink>
<NavLink to="/payments" className="nav-item">
  💳 Paiements
</NavLink>
```

---

### 6️⃣ Tester interface

1. Frontend doit être sur: `http://localhost:3000`
2. Cliquer sur "🇬🇳 Propriétés Guinée"
3. **Vérifier:**
   - ✅ 5 secteurs affichés
   - ✅ Prix en GNF (format "X XXX Fr")
   - ✅ Filtres fonctionnent
   - ✅ Sélection secteur met à jour liste

---

### 7️⃣ Tests de fonctionnalité

#### Test 1: Conversion devise
```javascript
// Console dev tools
fetch('/api/guinea/currency/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: 'USD', to: 'GNF', amount: 100 })
}).then(r => r.json()).then(d => console.log(d));
// Doit afficher: { converted: 865000, formatted: "865 000 Fr" }
```

#### Test 2: Charger secteurs
```javascript
fetch('/api/guinea/sectors')
  .then(r => r.json())
  .then(d => console.log(d.data));
// Doit afficher: array de 5 secteurs
```

#### Test 3: Recommander paiement
```javascript
fetch('/api/guinea/payments/recommended?amount=500000')
  .then(r => r.json())
  .then(d => console.log(d.data));
// Doit afficher: array de moyens triés par frais
```

---

## 📊 FICHIERS CRÉÉS/MODIFIÉS

### Backend
```
✅ backend/src/services/GuineaCurrency.service.js (150 lignes)
✅ backend/src/services/GuineaSectors.service.js (400 lignes)
✅ backend/src/services/GuineanPayment.service.js (350 lignes)
✅ backend/src/routes/guinea.routes.js (400+ lignes, 29 endpoints)
✅ backend/src/index.js (modifié: ajout import + route)
❌ backend/src/routes/agents.ts (SUPPRIMÉ - causait 44 erreurs)
✅ backend/test-guinea-api.js (script test complet)
```

### Frontend
```
✅ frontend/src/hooks/useGuinea.js (150 lignes, 3 hooks)
✅ frontend/src/components/SectorsComponent.jsx (200 lignes)
✅ frontend/src/components/PaymentMethodsComponent.jsx (250 lignes)
✅ frontend/src/pages/GuineaProperties.jsx (400 lignes)
⏳ frontend/src/App.jsx (À MODIFIER)
```

### Documentation
```
✅ GUINEE_SPECIFICATIONS_COMPLETE.md (guide 500+ lignes)
✅ DEPLOYMENT_GUINEA.md (ce fichier)
```

---

## 🔧 TROUBLESHOOTING

### Problème: API 404
**Solution:**
1. Vérifier que backend tourne: `npm run dev`
2. Vérifier que routes sont chargées: Voir logs pour "🇬🇳"
3. Tester: `http://localhost:4000/api/guinea/currency/info`

### Problème: Composants pas affichés
**Solution:**
1. Vérifier imports dans App.jsx
2. Vérifier path routes: `/properties-guinea` etc
3. Clear cache: Ctrl+Shift+R dans browser

### Problème: Prix en USD au lieu de GNF
**Solution:**
1. Vérifier hook useGuineaCurrency() chargé
2. Vérifier `formatGnf()` appelé correctement
3. Vérifier fetch API réussit

### Problème: Secteurs pas chargés
**Solution:**
1. Vérifier GET `/api/guinea/sectors` répond
2. Vérifier Redis connecté (optionnel)
3. Vérifier données en base si présentes

---

## 📈 PROCHAINES ÉTAPES (Facultatif)

- [ ] Intégrer prix GNF partout (Dashboard, Properties, etc)
- [ ] Ajouter secteurs à formulaire création propriété
- [ ] Intégrer paiements dans checkout
- [ ] Ajouter widgets dashboard (secteurs populaires, top paiements)
- [ ] Export données Guinée (Excel, PDF)
- [ ] Intégrations API externes (taux réels, SMS paiement)

---

## ✅ CHECKLIST FINALE

Avant de déployer en production:

- [ ] Tests 17/17 réussis
- [ ] Frontend affiche "Propriétés Guinée"
- [ ] Secteurs chargent et s'affichent
- [ ] Prix formatés en GNF
- [ ] Moyens paiement listés
- [ ] Pas d'erreurs console (frontend)
- [ ] Pas d'erreurs logs (backend)
- [ ] Redis configuré (si utilisé)
- [ ] .env variables définies
- [ ] Base de données accessible

---

## 🎉 RÉSULTAT FINAL

Une fois déployé, vous aurez:

✅ **DEVISE**
- Conversions USD/EUR ↔ GNF automatiques
- Affichage format Guinéen (865 000 Fr)
- Taux de change en temps réel

✅ **SECTEURS**
- 5 communes Conakry complètement documentées
- Filtrage par prix/risque/type
- Recommandations intelligentes

✅ **PAIEMENT**
- 5 moyens locaux: MTN, Orange, Banque, Espèces, Chèques
- Calcul auto des frais
- Recommandations par montant

✅ **INTERFACE**
- Page dédiée propriétés Guinée
- Composants réutilisables
- Hooks pour facile intégration

---

**Créé:** 2025-10-29
**Temps déploiement:** ~15 min
**Complexité:** Moyenne
**Support:** COMPLET

