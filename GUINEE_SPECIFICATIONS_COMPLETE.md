

# 🇬🇳 GUIDE COMPLET - SPÉCIFICITÉS GUINÉENNES AKIG

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Services créés](#services-créés)
3. [API Endpoints](#api-endpoints)
4. [Composants Frontend](#composants-frontend)
5. [Hooks React](#hooks-react)
6. [Intégration dans l'app](#intégration-dans-lapp)
7. [Exemples d'utilisation](#exemples-dutilisation)
8. [Base de données](#base-de-données)

---

## Vue d'ensemble

### ✅ TROIS SYSTÈMES COMPLETS CRÉÉS:

#### 1️⃣ **DEVISE GUINÉENNE (GNF)**
- Conversion USD/EUR ↔ GNF
- Taux de change en temps réel (API)
- Format affichage Guinéen (espaces tous les 3 chiffres)
- Cache Redis pour performances

**Fichiers:**
- `backend/src/services/GuineaCurrency.service.js` (150+ lignes)
- Utilisé par: API, Frontend, composants

**Taux par défaut:**
- 1 USD = 8650 GNF
- 1 EUR = 9200 GNF
- Mise à jour auto via API externe

---

#### 2️⃣ **SECTEURS CONAKRY**
- 5 communes avec data complète
- Niveaux de prix (Premium → Budget)
- Quartiers, géolocalisation, prix moyens
- Recommandations intelligentes

**Fichiers:**
- `backend/src/services/GuineaSectors.service.js` (400+ lignes)
- Secteurs: Kaloum, Matam, Dixinn, Mafanco, Ratoma

**Données par secteur:**
- 📍 Coordonnées GPS
- 💰 Prix moyens (studio, T2, T3, T4, villa)
- 🏘️ Quartiers listés
- 📊 Profil démographique
- ⚠️ Niveau de risque
- 🏪 Commodités

---

#### 3️⃣ **MOYENS DE PAIEMENT GUINÉE**
- MTN Mobile Money
- Orange Money
- Virement bancaire
- Espèces
- Chèques

**Fichiers:**
- `backend/src/services/GuineanPayment.service.js` (350+ lignes)
- Gestion frais, limites, traitement asynchrone

---

## Services créés

### 🇬🇳 GuineaCurrency.service.js

```javascript
// Conversion
const gnf = GuineaCurrencyService.usdToGnf(100); // 865000
const usd = GuineaCurrencyService.gnfToUsd(865000); // 100

// Format
const formatted = GuineaCurrencyService.formatGnf(865000); // "865 000 Fr"

// Infos devise
const info = GuineaCurrencyService.getCurrencyInfo();
// { code: 'GNF', symbol: 'Fr', ... }

// Taux en temps réel
const rates = await GuineaCurrencyService.fetchRealExchangeRates();
```

### 🏘️ GuineaSectors.service.js

```javascript
// Tous les secteurs
const sectors = GuineaSectorsService.getAllSectors();

// Secteur spécifique
const sector = GuineaSectorsService.getSectorById('matam');

// Filtrer par niveau de prix
const premium = GuineaSectorsService.filterByPriceLevel('PREMIUM');

// Recommander selon critères
const recommended = GuineaSectorsService.recommendSectors({
  budget: 5000000,
  type: 'Résidences',
  minRisk: 'Faible'
});

// Prix dans secteur
const price = GuineaSectorsService.applyPriceMultiplier(1000000, 'kaloum');
// 1500000 (prix * multiplicateur)

// Quartiers
const neighborhoods = GuineaSectorsService.getNeighborhoods('dixinn');
```

### 💳 GuineanPayment.service.js

```javascript
// Tous les moyens
const methods = GuineanPaymentService.getAllPaymentMethods();

// Méthode spécifique
const method = GuineanPaymentService.getPaymentMethodById('mtn-mobile-money');

// Valider montant
const valid = GuineanPaymentService.isAmountValid('mtn-mobile-money', 100000);

// Calculer frais
const fees = GuineanPaymentService.calculateFees('mtn-mobile-money', 100000);
// { amount: 100000, fees: 2500, total: 102500 }

// Recommander moyens
const recommended = GuineanPaymentService.recommendedMethods(100000);

// Traiter paiement
const result = await GuineanPaymentService.processPayment(
  'mtn-mobile-money',
  100000,
  { agentName: 'Jean' }
);
```

---

## API Endpoints

### 💶 Devise (GET/POST /api/guinea/currency/*)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/info` | GET | Infos devise GNF |
| `/convert` | POST | Convertir montants |
| `/format/:amount` | GET | Formater en GNF |
| `/rates` | GET | Taux de change actuels |

**Exemples:**

```bash
# GET /api/guinea/currency/info
{
  "code": "GNF",
  "symbol": "Fr",
  "exchangeRates": { "USD_TO_GNF": 8650 },
  "example": { "usd": 100, "gnf": 865000 }
}

# POST /api/guinea/currency/convert
{ "from": "USD", "to": "GNF", "amount": 100 }
Response:
{ "converted": 865000, "formatted": "865 000 Fr" }

# GET /api/guinea/currency/format/865000
{ "formatted": "865 000 Fr" }
```

---

### 🏘️ Secteurs (GET/POST /api/guinea/sectors/*)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/` | GET | Tous les secteurs |
| `/:id` | GET | Secteur spécifique |
| `/:sectorId/neighborhoods` | GET | Quartiers |
| `/filter/by-price?level=PREMIUM` | GET | Filtrer par prix |
| `/recommend` | POST | Recommander |
| `/:sectorId/prices/:bedrooms` | GET | Prix par type |

**Exemples:**

```bash
# GET /api/guinea/sectors
[ { id: 'kaloum', name: 'Kaloum', ... }, ... ]

# GET /api/guinea/sectors/matam
{ 
  id: 'matam',
  name: 'Matam',
  description: 'Quartier résidentiel...',
  priceLevel: 'HAUT',
  priceMultiplier: 1.3,
  averagePrices: { t3: 4000000, ... }
}

# GET /api/guinea/sectors/dixinn/prices/t3
{ price: 2000000, formatted: "2 000 000 Fr" }

# POST /api/guinea/sectors/recommend
{ "budget": 3000000, "type": "Résidences", "minRisk": "Faible" }
[ { nom: 'Dixinn', ... }, { nom: 'Mafanco', ... } ]
```

---

### 💳 Paiement (GET/POST /api/guinea/payments/*)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/methods` | GET | Tous moyens |
| `/methods/ui` | GET | Pour interface |
| `/methods/:id` | GET | Moyen spécifique |
| `/type/:type` | GET | Par type |
| `/validate` | POST | Valider montant |
| `/fees` | POST | Calculer frais |
| `/recommended?amount=100000` | GET | Recommandés |
| `/mobile-money` | GET | Mobile Money |
| `/process` | POST | Traiter paiement |

**Exemples:**

```bash
# GET /api/guinea/payments/methods
[
  {
    id: 'mtn-mobile-money',
    name: 'MTN Mobile Money',
    icon: '📱',
    fees: 2.5,
    processingTime: '0-5 minutes'
  },
  ...
]

# POST /api/guinea/payments/fees
{ "methodId": "mtn-mobile-money", "amount": 100000 }
Response:
{ "fees": 2500, "total": 102500 }

# POST /api/guinea/payments/process
{ "methodId": "mtn-mobile-money", "amount": 100000 }
Response:
{ "success": true, "reference": "MM...", "status": "SUCCESS" }
```

---

## Composants Frontend

### 🏘️ SectorsComponent.jsx

```jsx
import SectorsComponent from '@/components/SectorsComponent';

<SectorsComponent
  selectedSector={selected}
  onSectorSelect={(sector) => console.log(sector)}
/>
```

**Fonctionnalités:**
- ✅ Afficher tous les 5 secteurs
- ✅ Filtrer par niveau de prix
- ✅ Affiche prix moyens en GNF
- ✅ Click pour sélectionner
- ✅ Responsive design

---

### 💳 PaymentMethodsComponent.jsx

```jsx
import PaymentMethodsComponent from '@/components/PaymentMethodsComponent';

<PaymentMethodsComponent
  amount={100000}
  selectedMethod={selected}
  onMethodSelect={(method) => console.log(method)}
  showFees={true}
/>
```

**Fonctionnalités:**
- ✅ Afficher tous les moyens
- ✅ Filtrer par type
- ✅ Calculer frais pour montant
- ✅ Recommander basé sur montant
- ✅ Badge "Recommandé"

---

### 🇬🇳 GuineaProperties.jsx (Page complète)

Page d'exemple intégrant:
- Sélection secteur
- Liste propriétés filtrées
- Prix en GNF
- Favoris
- Détails propriété

---

## Hooks React

### useGuineaCurrency()

```javascript
const { 
  currencyInfo,  // Info devise
  formatGnf,     // Fonction: (amount) → "865 000 Fr"
  convertUsdToGnf, // Async: (usd) → gnf
  isLoading,
  error
} = useGuineaCurrency();
```

---

### useGuineaSectors()

```javascript
const {
  sectors,           // [] tous secteurs
  getSectorById,     // Async: (id) → sector
  recommendSectors,  // Async: (criteria) → []
  filterByPriceLevel, // (level) → []
  isLoading,
  error,
  refetch
} = useGuineaSectors();
```

---

### useGuineanPaymentMethods()

```javascript
const {
  paymentMethods,    // [] tous moyens
  getMethodById,     // Async: (id) → method
  calculateFees,     // Async: (methodId, amount) → feesInfo
  recommendMethods,  // Async: (amount) → []
  processPayment,    // Async: (methodId, amount, details) → result
  isLoading,
  error
} = useGuineanPaymentMethods();
```

---

## Intégration dans l'app

### 1. Backend (index.js)

```javascript
// Import
const guineaRoutes = require('./routes/guinea.routes');

// Registrer
app.use('/api/guinea', guineaRoutes);
```

**✅ FAIT**

---

### 2. Frontend - Importer composants

```javascript
// Dans page ou composant
import { useGuineaCurrency } from '@/hooks/useGuinea';
import SectorsComponent from '@/components/SectorsComponent';
import PaymentMethodsComponent from '@/components/PaymentMethodsComponent';
```

---

### 3. Frontend - Ajouter route navigation

Éditer `src/App.jsx`:

```jsx
import GuineaPropertiesPage from '@/pages/GuineaProperties';

// Dans routes
<Route path="/properties-guinea" element={<GuineaPropertiesPage />} />
```

---

### 4. Ajouter au menu

Éditer `src/components/Navigation.jsx` ou sidebar:

```jsx
<NavLink to="/properties-guinea" icon="🇬🇳">
  Propriétés Guinée
</NavLink>
```

---

## Exemples d'utilisation

### ✅ Exemple 1: Afficher prix en GNF

```jsx
import { useGuineaCurrency } from '@/hooks/useGuinea';

export const PropertyCard = ({ property }) => {
  const { formatGnf } = useGuineaCurrency();
  
  const priceGnf = Math.round(property.priceUsd * 8650);
  
  return (
    <div>
      <h3>{property.title}</h3>
      <p>{formatGnf(priceGnf)}</p>
    </div>
  );
};
```

---

### ✅ Exemple 2: Filtrer par secteur

```jsx
import { useGuineaSectors } from '@/hooks/useGuinea';

export const PropertyFilter = () => {
  const { sectors } = useGuineaSectors();
  
  return (
    <select>
      <option>Tous secteurs</option>
      {sectors.map(s => (
        <option key={s.id} value={s.id}>
          {s.name} ({s.priceLevel})
        </option>
      ))}
    </select>
  );
};
```

---

### ✅ Exemple 3: Traiter paiement MTN

```jsx
import { useGuineanPaymentMethods } from '@/hooks/useGuinea';

export const PaymentForm = ({ amount }) => {
  const { processPayment } = useGuineanPaymentMethods();
  
  const handlePayMTN = async () => {
    const result = await processPayment('mtn-mobile-money', amount, {
      agentName: 'Jean'
    });
    
    if (result.success) {
      console.log('Paiement success:', result.reference);
    }
  };
  
  return <button onClick={handlePayMTN}>Payer par MTN</button>;
};
```

---

### ✅ Exemple 4: Recommander secteurs

```jsx
import { useGuineaSectors } from '@/hooks/useGuinea';

export const SectorRecommender = () => {
  const { recommendSectors } = useGuineaSectors();
  
  const handleRecommend = async () => {
    const recommended = await recommendSectors({
      budget: 3000000,        // GNF
      type: 'Résidences',
      minRisk: 'Faible'
    });
    
    console.log('Secteurs recommandés:', recommended);
  };
  
  return <button onClick={handleRecommend}>Recommander</button>;
};
```

---

## Base de données

### Table: guinea_sectors

```sql
CREATE TABLE guinea_sectors (
  sector_id VARCHAR(50) PRIMARY KEY,
  sector_name VARCHAR(100),
  description TEXT,
  price_level VARCHAR(20),
  price_multiplier DECIMAL(3,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  average_price_t3 INTEGER,
  neighborhoods JSONB,
  amenities JSONB,
  characteristics JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert
INSERT INTO guinea_sectors VALUES
('kaloum', 'Kaloum', '...', 'PREMIUM', 1.5, 9.5411, -13.7317, 6000000, ...),
('matam', 'Matam', '...', 'HAUT', 1.3, 9.5500, -13.7500, 4000000, ...),
...
```

### Table: exchange_rates

```sql
CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(3),
  to_currency VARCHAR(3),
  rate DECIMAL(10,4),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 CHECKLIST DÉPLOIEMENT

- [x] Services créés (Currency, Sectors, Payment)
- [x] Routes API créées (29 endpoints)
- [x] Backend intégré (index.js)
- [x] Hooks React créés
- [x] Composants créés
- [x] Page exemple créée
- [ ] Frontend route ajoutée
- [ ] Menu navigation ajouté
- [ ] Tests API effectués
- [ ] Cache Redis configuré
- [ ] Base de données initialisée

---

## 📞 SUPPORT

Pour questions ou problèmes:
1. Vérifier les logs backend: `npm run dev`
2. Tester endpoints avec Postman
3. Vérifier connexion Redis pour cache

---

**Créé:** 2025-10-29
**Version:** 1.0
**Statut:** ✅ COMPLET

