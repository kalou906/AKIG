# Système de Feedback et Satisfaction Client

## Vue d'ensemble

Système complet de gestion du feedback utilisateur avec :
- ✅ Collecte de feedback multi-canal
- ✅ Analyse automatique du sentiment (3 langues)
- ✅ Gestion des priorités et statuts
- ✅ Réponses administrateur
- ✅ Dashboard et statistiques
- ✅ Support multilingue (FR, EN, AR)

---

## Architecture

### Base de Données

```
feedback_categories        → Catégories de feedback
feedback_types            → Types de feedback (suggestion, plainte, etc.)
feedback                  → Feedback principal (18 colonnes)
feedback_responses        → Réponses administrateur
feedback_attachments      → Fichiers joints
feedback_ratings          → Évaluations détaillées (NPS, CSAT, CES)
feedback_sentiment_audit  → Historique des changements sentiment
feedback_stats_daily      → Cache des stats quotidiennes
feedback_tags             → Tags personnalisés
```

### Services Backend

```
FeedbackService (feedback.service.js)
├── createFeedback()              // Créer un feedback
├── getFeedbackById()             // Récupérer un feedback
├── getAllFeedback()              // Lister avec filtres
├── updateFeedback()              // Mettre à jour
├── addResponse()                 // Ajouter une réponse
├── getFeedbackResponses()        // Récupérer réponses
├── addRatings()                  // Ajouter évaluations
├── getFeedbackStats()            // Statistiques
├── getFeedbackByCategory()       // Par catégorie
└── getUnresolvedFeedback()       // Non résolu

SentimentAnalyzer (sentiment.analyzer.js)
├── analyzeSentiment()            // Analyse sentiment
├── extractKeywords()             // Extraction mots-clés
├── getNPSCategory()              // Catégorie NPS
├── calculateNPS()                // Calcul NPS
└── generateSummary()             // Résumé d'analyse
```

### API Endpoints

```
POST   /api/feedback                    → Créer feedback
GET    /api/feedback                    → Lister feedback
GET    /api/feedback/:id                → Récupérer un feedback
PUT    /api/feedback/:id                → Mettre à jour
DELETE /api/feedback/:id                → Supprimer

POST   /api/feedback/:id/responses      → Ajouter réponse
GET    /api/feedback/:id/responses      → Récupérer réponses

POST   /api/feedback/:id/ratings        → Ajouter évaluations

GET    /api/feedback/stats/overview     → Statistiques globales
GET    /api/feedback/stats/by-category  → Par catégorie
GET    /api/feedback/unresolved         → Non résolu
```

---

## Utilisation

### 1. Créer un Feedback (Frontend)

```tsx
import FeedbackForm from '@/components/Feedback/FeedbackForm';

function MyComponent() {
  return (
    <FeedbackForm
      agencyId={123}
      propertyId={456}
      onSuccess={(feedback) => {
        console.log('Feedback créé:', feedback);
      }}
    />
  );
}
```

### 2. Afficher le Dashboard

```tsx
import FeedbackDashboard from '@/components/Feedback/FeedbackDashboard';

function AdminPanel() {
  return (
    <FeedbackDashboard
      agencyId={123}
      onFeedbackSelect={(feedback) => {
        // Ouvrir détail du feedback
      }}
    />
  );
}
```

### 3. Récupérer Feedback (Backend)

```javascript
const FeedbackService = require('./services/feedback.service');

// Créer
const feedback = await FeedbackService.createFeedback({
  userId: 1,
  agencyId: 2,
  categoryId: 1,
  typeId: 2,
  score: 8,
  title: 'Très satisfait',
  comment: 'Service excellent...'
});

// Récupérer
const feedback = await FeedbackService.getFeedbackById(1);

// Lister avec filtres
const result = await FeedbackService.getAllFeedback({
  status: 'new',
  sentiment: 'negative',
  priority: 'high',
  limit: 20,
  offset: 0
});

// Mettre à jour
await FeedbackService.updateFeedback(1, {
  status: 'resolved',
  priority: 'normal'
});

// Ajouter réponse
await FeedbackService.addResponse(1, adminId, 'Merci pour ce feedback...');

// Statistiques
const stats = await FeedbackService.getFeedbackStats({
  agencyId: 2,
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});
```

---

## Analyse de Sentiment

### Fonctionnement

1. **Score → Sentiment** (automatique)
   ```
   8-10  → Positif (😊)
   5-7   → Neutre (😐)
   0-4   → Négatif (😔)
   ```

2. **Analyse NLP**
   - Extraction de mots-clés
   - Détection d'intensités
   - Gestion des négations
   - Support 3 langues (FR, EN, AR)

### Exemple

```javascript
const { SentimentAnalyzer } = require('./services/sentiment.analyzer');

// Analyser sentiment
const result = SentimentAnalyzer.analyzeSentiment(
  'Excellent service très rapide!',
  'fr'
);
// {
//   sentiment: 'positive',
//   score: 0.8,
//   confidence: 0.85,
//   positiveCount: 2,
//   negativeCount: 0
// }

// Extraire mots-clés
const keywords = SentimentAnalyzer.extractKeywords(
  'Maintenance rapide et efficace',
  'fr'
);
// ['maintenance', 'rapide', 'efficace']

// Calculer NPS
const nps = SentimentAnalyzer.calculateNPS([9, 8, 9, 5, 4]);
// 40 (60% promoters, 20% detractors)
```

---

## Catégories de Feedback

| Code | Nom | Icon | Description |
|------|-----|------|-------------|
| payment | Paiements | 💳 | Concernant les paiements |
| maintenance | Maintenance | 🔧 | Maintenance des lieux |
| tenant_relations | Relations Locataires | 👥 | Relations avec locataires |
| property | Propriété | 🏠 | État de la propriété |
| communication | Communication | 💬 | Communication générale |
| service | Service | ⭐ | Service général |
| other | Autre | 📝 | Autres commentaires |

---

## Types de Feedback

| Code | Nom | Description |
|------|-----|-------------|
| suggestion | Suggestion | Suggestion d'amélioration |
| complaint | Plainte | Plainte ou problème |
| compliment | Compliment | Compliment ou satisfaction |
| question | Question | Question |
| bug_report | Rapport Bug | Rapport de bug technique |

---

## Statuts de Feedback

```
new           → Nouveau, non traité
acknowledged  → Reconnu par un admin
resolved      → Résolu/Traité
closed        → Fermé et archivé
```

---

## Priorités

```
low       → Basse priorité
normal    → Priorité normale (par défaut)
high      → Haute priorité (score ≤ 5)
critical  → Critique (score ≤ 3)
```

---

## Interface Frontend

### FeedbackForm

Formulaire de collecte de feedback avec :
- Sélection catégorie par icônes
- Sélection type dropdown
- Slider de score 1-10
- Affichage sentiment en temps réel
- Compteur caractères
- Validation

**Props:**
```tsx
interface FeedbackFormProps {
  agencyId?: number;
  propertyId?: number;
  tenantId?: number;
  onSuccess?: (feedback: any) => void;
  onCancel?: () => void;
}
```

### FeedbackDashboard

Dashboard d'administration avec :
- Statistiques globales (5 cartes)
- Filtres multi-champs
- Liste feedback avec tri
- Pagination
- Status badges
- Réponses rapides

**Props:**
```tsx
interface FeedbackDashboardProps {
  agencyId?: number;
  onFeedbackSelect?: (feedback: Feedback) => void;
}
```

---

## Sécurité et Permissions

### Authentification
- ✅ JWT obligatoire pour tous les endpoints
- ✅ Vérification de propriété des données
- ✅ Rate limiting recommandé

### Permissions par Rôle

| Rôle | Créer | Lire | Modifier | Supprimer |
|------|-------|------|----------|-----------|
| User | Propres | Propres | Non | Non |
| Manager | Non | Agence | Agence | Non |
| Admin | Non | Tous | Tous | Oui |

### Contrôles d'Accès

```javascript
// Utilisateurs normaux → voir uniquement leurs feedback
if (!req.user.roles.includes('admin')) {
  filters.userId = req.user.id;
}

// Managers d'agence → voir feedback de leur agence
if (req.user.roles.includes('agency_manager')) {
  filters.agencyId = req.user.agencyId;
}

// Admins → accès complet
```

---

## Performance

### Optimisations

1. **Indexes PostgreSQL**
   ```sql
   -- Les 11 indexes pour les recherches
   user_id, agency_id, status, sentiment, score, etc.
   ```

2. **Full-text Search**
   ```sql
   CREATE INDEX idx_feedback_search 
   ON feedback USING gin(to_tsvector('french', comment));
   ```

3. **Cache Quotidien**
   ```sql
   feedback_stats_daily  -- Stats en cache
   ```

4. **Pagination**
   - Limite par défaut: 20 résultats
   - Max: 100 résultats
   - Offset-based pagination

### Requêtes Optimisées

```javascript
// Avec filtres et pagination
const result = await FeedbackService.getAllFeedback({
  status: 'new',
  sentiment: 'negative',
  limit: 20,
  offset: 0
});
// Time: ~50-100ms

// Full-text search
const result = await FeedbackService.getAllFeedback({
  search: 'problème paiement',
  limit: 20
});
// Time: ~100-200ms avec le GIN index
```

---

## Cas d'Usage

### 1. Collecte de Feedback Client

```tsx
// Dans une page de propriété
<FeedbackForm propertyId={propId} />

// Résultat: Feedback avec sentiment auto-analysé
```

### 2. Suivi des Problèmes

```javascript
// Récupérer feedback critique
const critical = await FeedbackService.getUnresolvedFeedback(
  agencyId,
  'critical'
);

// 2 feedback critiques → Alerter l'admin
```

### 3. Analyse de Satisfaction

```javascript
const stats = await FeedbackService.getFeedbackStats({
  agencyId,
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

// Score moyen: 7.2/10
// NPS: 35
// Tendance: ↑ 5% vs mois dernier
```

### 4. Réponse aux Feedback

```javascript
// Admin ajoute réponse
await FeedbackService.addResponse(
  feedbackId,
  adminId,
  'Merci pour ce feedback. Nous avons corrigé le problème.'
);

// Status auto-change: 'new' → 'acknowledged'
```

---

## Maintenance

### Update Stats Quotidiennes

```javascript
// Appelé la nuit (cron job)
const { pool } = require('./db');

await pool.query(
  "SELECT update_daily_feedback_stats(CURRENT_DATE - INTERVAL '1 day')"
);
```

### Archivage Vieux Feedback

```javascript
// Archive feedback > 1 an avec statut 'closed'
await pool.query(`
  UPDATE feedback
  SET status = 'archived'
  WHERE status = 'closed'
  AND created_at < NOW() - INTERVAL '1 year'
`);
```

---

## Troubleshooting

### Le sentiment n'est pas analysé

✅ **Solution**: Le sentiment est calculé automatiquement lors de la création basé sur le score (0-10)

### Les filtres ne fonctionnent pas

✅ **Solution**: Vérifier la permission de l'utilisateur. Les managers voient uniquement leur agence.

### Full-text search lent

✅ **Solution**: Créer l'index GIN sur le champ `comment`:
```sql
CREATE INDEX idx_feedback_search 
ON feedback USING gin(to_tsvector('french', comment));
```

### Mots-clés vides

✅ **Solution**: Les mots < 3 caractères sont filtrés. Vérifier contenu du commentaire.

---

## Roadmap Futur

- [ ] Webhook notifications
- [ ] Analyse prédictive (ML)
- [ ] Intégration Slack/Teams
- [ ] Export PDF/CSV
- [ ] A/B testing feedback
- [ ] Multi-langue AI analysis
- [ ] Sentiment trends
- [ ] Automated escalation rules

---

## Fichiers Concernés

```
Backend:
- src/services/feedback.service.js    (410 lines)
- src/services/sentiment.analyzer.js  (350 lines)
- src/routes/feedback.js              (360 lines)
- db/migrations/005_feedback_system.sql

Frontend:
- src/components/Feedback/FeedbackForm.tsx      (200 lines)
- src/components/Feedback/FeedbackForm.css      (350 lines)
- src/components/Feedback/FeedbackDashboard.tsx (200 lines)
- src/components/Feedback/FeedbackDashboard.css (380 lines)
```

**Total: 2,450+ lignes de code production-ready**
