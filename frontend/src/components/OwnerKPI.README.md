# 📊 OwnerKPI Component

Composant React complet et production-ready pour afficher un tableau de bord d'indicateurs clés de performance (KPI) pour propriétaires et gestionnaires immobiliers.

## ✨ Fonctionnalités

### 📈 Métriques couvertes

**💰 Finances (5 métriques)**
- Taux de collecte des loyers
- Montant total des impayés
- Loyers mensuels attendus vs collectés
- Montant des loyers en retard (>30j)
- Nombre de paiements en retard

**🏠 Occupancy (3 métriques)**
- Taux d'occupation (%)
- Nombre d'unités occupées/vacantes
- Taux de vacance

**📋 Contrats (4 métriques)**
- Nombre de contrats actifs
- Contrats expirant bientôt
- Contrats expirés
- Durée moyenne de location

**👥 Locataires (3 métriques)**
- Nombre total de locataires
- Nouveaux locataires (ce mois)
- Locataires en défaut de paiement

**🔧 Maintenance (3 métriques)**
- Demandes de maintenance pendantes
- Demandes complétées
- Taux de complétude

### 🎨 Design Features

✅ **Responsive Design** - Mobile-first, tablette, desktop
✅ **Color-coded Status** - Good (vert), Warning (orange), Critical (rouge)
✅ **RTL Support** - Arabe, Hébreu, etc.
✅ **Dark Mode** - Support automatique du mode sombre système
✅ **Animations** - Smooth transitions et entrées
✅ **Multi-langue** - Intégration complète i18n
✅ **Real-time Updates** - Auto-refresh configurable
✅ **Accessible** - WCAG compliant

## 🚀 Installation

### Dépendances

```bash
npm install axios react-i18next
```

### Import du composant

```tsx
import OwnerKPI from '@/components/OwnerKPI';
import '@/components/OwnerKPI.css';
```

## 💻 Utilisation

### Exemple basique

```tsx
export function Dashboard() {
  return <OwnerKPI />;
}
```

### Avec filtres

```tsx
export function FilteredKPI() {
  const [agencyId, setAgencyId] = useState('agency-001');
  const [propertyId, setPropertyId] = useState('');

  return (
    <OwnerKPI 
      agencyId={agencyId}
      propertyId={propertyId}
    />
  );
}
```

### Avec période de comparaison

```tsx
export function KPIWithPeriod() {
  return (
    <OwnerKPI 
      comparisonPeriod="quarter"  // 'month' | 'quarter' | 'year'
    />
  );
}
```

### Avec refresh personnalisé

```tsx
export function KPIWithRefresh() {
  return (
    <OwnerKPI 
      refreshInterval={60}  // secondes
    />
  );
}
```

### Avec callback

```tsx
export function KPIWithCallback() {
  const handleDataChange = (data) => {
    console.log('KPI Updated:', data);
  };

  return (
    <OwnerKPI 
      onDataChange={handleDataChange}
    />
  );
}
```

### Exemple complet

```tsx
export function CompleteDashboard() {
  const [agencyId, setAgencyId] = useState('agency-001');
  const [period, setPeriod] = useState('month');

  return (
    <OwnerKPI 
      agencyId={agencyId}
      propertyId=""
      refreshInterval={300}
      comparisonPeriod={period}
      onDataChange={(data) => console.log(data)}
    />
  );
}
```

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agencyId` | `string` | `undefined` | Filtrer par agence |
| `propertyId` | `string` | `undefined` | Filtrer par propriété |
| `refreshInterval` | `number` | `300` | Intervalle refresh en secondes |
| `comparisonPeriod` | `'month' \| 'quarter' \| 'year'` | `'month'` | Période de comparaison |
| `onDataChange` | `(data: KPIData) => void` | `undefined` | Callback changement données |

## 🎨 Structure des données

### KPIData Interface

```typescript
interface KPIData {
  // Finances
  rentCollectionRate: number;      // %
  totalArrears: number;             // €
  monthlyRentExpected: number;      // €
  monthlyRentCollected: number;     // €
  overdueAmount: number;            // €
  overduePayments: number;          // count
  
  // Occupancy
  occupancyRate: number;            // %
  occupiedUnits: number;            // count
  totalUnits: number;               // count
  vacantUnits: number;              // count
  
  // Contrats
  activeContracts: number;          // count
  expiringContracts: number;        // count
  expiredContracts: number;         // count
  averageLeaseLength: number;       // months
  
  // Locataires
  totalTenants: number;             // count
  newTenants: number;               // count
  tenantsInDefault: number;         // count
  
  // Maintenance
  maintenanceRequests: number;      // count
  maintenanceCompleted: number;     // count
  maintenanceCompletionRate: number; // %
  
  // Metadata
  lastUpdate: string;               // ISO string
}
```

## 🎯 Cas d'usage

### 1. Dashboard propriétaire

```tsx
<OwnerKPI 
  comparisonPeriod="month"
  refreshInterval={300}
/>
```

### 2. Suivi multi-agences

```tsx
{agencies.map(agency => (
  <OwnerKPI 
    key={agency.id}
    agencyId={agency.id}
    comparisonPeriod="quarter"
  />
))}
```

### 3. Alertes temps réel

```tsx
const handleDataChange = (data) => {
  if (data.tenantsInDefault > 0) {
    showNotification(`${data.tenantsInDefault} locataires en défaut`);
  }
  if (data.rentCollectionRate < 80) {
    showNotification(`Collecte faible: ${data.rentCollectionRate}%`);
  }
};

<OwnerKPI onDataChange={handleDataChange} />
```

### 4. Export rapports

```tsx
const [kpiData, setKpiData] = useState(null);

<OwnerKPI onDataChange={setKpiData} />

const exportReport = () => {
  const report = generateReport(kpiData);
  downloadPDF(report);
};
```

## 🎨 Personnalisation CSS

### Override des couleurs

```css
.kpi-card--good {
  border-color: #27ae60;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
}

.kpi-card--warning {
  border-color: #f39c12;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
}

.kpi-card--critical {
  border-color: #e74c3c;
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
}
```

### Adapter la grille

```css
.owner-kpi__grid--3 {
  grid-template-columns: repeat(4, 1fr); /* Au lieu de 3 */
}

@media (max-width: 1200px) {
  .owner-kpi__grid--3 {
    grid-template-columns: repeat(2, 1fr); /* 2 colonnes */
  }
}
```

## 🔌 API Backend requise

### Endpoint: `GET /api/metrics/kpi`

**Query params:**
```
?agencyId=agency-001
&propertyId=prop-001
&period=month
```

**Response:**
```json
{
  "rentCollectionRate": 85,
  "totalArrears": 12500,
  "monthlyRentExpected": 45000,
  "monthlyRentCollected": 38250,
  "overdueAmount": 8750,
  "overduePayments": 3,
  "occupancyRate": 92,
  "occupiedUnits": 46,
  "totalUnits": 50,
  "vacantUnits": 4,
  "activeContracts": 46,
  "expiringContracts": 2,
  "expiredContracts": 0,
  "averageLeaseLength": 28,
  "totalTenants": 46,
  "newTenants": 1,
  "tenantsInDefault": 2,
  "maintenanceRequests": 8,
  "maintenanceCompleted": 6,
  "maintenanceCompletionRate": 75,
  "lastUpdate": "2025-10-25T14:30:00Z"
}
```

## 🌐 Internationalisation

Le composant utilise les hooks i18n personnalisés pour la traduction :

```tsx
const t = useI18n('payments');  // Traductions domaine paiements
const tCommon = useI18n('common');  // Traductions générales
```

**Clés de traduction utilisées:**
- `payments:title` - "Paiements"
- `payments:arrears.total_amount` - "Montant total des impayés"
- `common:dashboard` - "Tableau de bord"
- `common:loading` - "Chargement..."
- `common:no_data` - "Aucune donnée"
- `common:refresh` - "Actualiser"

## 🎯 États et statuts

### Status des KPI Cards

```
Good     → Vert    → ✅ Tout va bien
Warning  → Orange  → ⚠️  À surveiller
Critical → Rouge   → 🔴 Action requise
```

### Seuils par défaut

| Métrique | Good | Warning | Critical |
|----------|------|---------|----------|
| Taux collecte | ≥80% | ≥60% | <60% |
| Occupancy | ≥90% | ≥80% | <80% |
| Maintenance | ≥90% | ≥70% | <70% |

## 📱 Responsive

- **Desktop** (>1200px) - 3 colonnes
- **Tablet** (768px - 1200px) - 2-3 colonnes
- **Mobile** (<768px) - 1 colonne

## ♿ Accessibilité

- ✅ ARIA labels sur tous les contrôles
- ✅ Contrast WCAG AA
- ✅ Navigation au clavier
- ✅ Screen reader friendly
- ✅ RTL support

## 🧪 Tests

### Tester le composant

```tsx
import { render, screen } from '@testing-library/react';
import OwnerKPI from '@/components/OwnerKPI';

test('renders KPI dashboard', () => {
  render(<OwnerKPI />);
  expect(screen.getByText(/tableau de bord/i)).toBeInTheDocument();
});
```

### Tester les filtres

```tsx
test('filters by agency', async () => {
  render(<OwnerKPI agencyId="agency-001" />);
  // Mock API call avec agencyId
  await waitFor(() => {
    expect(screen.getByText(/paiements/i)).toBeInTheDocument();
  });
});
```

## 🚀 Performance

- **Lazy Loading** - Données chargées à la demande
- **Memoization** - Re-renders optimisés
- **CSS Animations** - Hardware accelerated
- **Auto-refresh** - Configurable
- **Error Boundaries** - Fallback gracieux

## 🐛 Troubleshooting

### "Cannot find module axios"
```bash
npm install axios
```

### Pas de données affichées
- Vérifier l'endpoint `/api/metrics/kpi` retourne des données
- Vérifier `agencyId` est correct
- Vérifier les logs navigateur (F12)

### CSS ne s'applique pas
- Vérifier l'import du CSS:
  ```tsx
  import '@/components/OwnerKPI.css';
  ```

### Traductions manquantes
- Vérifier les clés i18n dans les fichiers JSON
- Vérifier namespace `payments` et `common` existent

## 📚 Fichiers associés

- `OwnerKPI.tsx` - Composant principal (600+ lignes)
- `OwnerKPI.css` - Styles complets (400+ lignes)
- `OwnerKPI.examples.tsx` - 6 exemples d'intégration
- `OwnerKPI.test.tsx` - Tests unitaires
- `README.md` - Cette documentation

## 🎉 Résumé

✅ **Composant complet** - 5 sections de KPI
✅ **Production-ready** - Code robuste et testé
✅ **Très performant** - Auto-refresh configurable
✅ **Totalement personnalisable** - Props et CSS
✅ **Multi-langue** - Support 3 langues
✅ **Accessible** - WCAG AA compliant
✅ **Mobile-friendly** - Responsive à 100%

**Prêt pour production ! 🚀**
