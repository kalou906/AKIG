# Migrations et Service Préférences Utilisateur

## Vue d'ensemble

Le système de préférences utilisateur permet à chaque utilisateur de personnaliser :
- **Langue** (locale): fr, en, es
- **Thème**: light, dark, auto
- **Notifications**: canal, type, fréquence
- **Widgets**: configuration du dashboard
- **Filtres sauvegardés**: recherches favorites

## Architecture

```
┌─────────────────────────────────┐
│   Frontend (React)              │
│ - Paramètres utilisateur        │
│ - Widgets configurables         │
│ - Filtres sauvegardés           │
└────────────┬────────────────────┘
             │
             │ API calls
             ▼
┌─────────────────────────────────┐
│   Backend (Node.js)             │
│ - userPreferences service       │
│ - Validation                    │
│ - OTel tracing                  │
└────────────┬────────────────────┘
             │
             │ SQL queries
             ▼
┌─────────────────────────────────┐
│   Database (PostgreSQL)         │
│ - user_preferences table        │
│ - Indexes et triggers           │
│ - JSONB pour flexibilité        │
└─────────────────────────────────┘
```

## Migration SQL

### Fichier

`backend/db/migrations/001_user_preferences.sql`

### Structure de la table

```sql
CREATE TABLE user_preferences (
  user_id INT PRIMARY KEY,           -- Clé étrangère vers users.id
  locale TEXT DEFAULT 'fr',          -- Langue (fr, en, es)
  theme TEXT DEFAULT 'light',        -- Thème (light, dark, auto)
  
  -- Notifications
  notif_channel TEXT DEFAULT 'email',
  notif_email BOOLEAN DEFAULT true,
  notif_sms BOOLEAN DEFAULT false,
  notif_push BOOLEAN DEFAULT false,
  notif_frequency TEXT DEFAULT 'immediate',
  
  -- Configuration JSON
  widgets JSONB DEFAULT '[]',        -- Widgets du dashboard
  saved_filters JSONB DEFAULT '{}',  -- Filtres sauvegardés
  
  -- Timestamps
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Indexes

```sql
-- Accélère les requêtes par user_id
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Pour filtrer par langue
CREATE INDEX idx_user_preferences_locale ON user_preferences(locale);

-- Pour grouper par thème
CREATE INDEX idx_user_preferences_theme ON user_preferences(theme);

-- Pour notifications
CREATE INDEX idx_user_preferences_notif_channel ON user_preferences(notif_channel);
```

### Trigger

Mise à jour automatique du timestamp `updated_at` :

```sql
CREATE TRIGGER user_preferences_update_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();
```

### Exécuter la migration

```bash
# Avec psql
psql $DATABASE_URL -f backend/db/migrations/001_user_preferences.sql

# Vérifier
psql $DATABASE_URL -c "SELECT * FROM user_preferences LIMIT 1;"
```

## Service userPreferences

### Fonctions disponibles

#### 1. getPreferences(pool, userId)

Récupère les préférences d'un utilisateur. Crée les préférences par défaut si nécessaire.

```javascript
const preferences = await getPreferences(pool, 1);
// {
//   user_id: 1,
//   locale: 'fr',
//   theme: 'light',
//   notif_channel: 'email',
//   widgets: [],
//   saved_filters: {}
// }
```

#### 2. createDefaultPreferences(pool, userId)

Crée les préférences par défaut pour un nouvel utilisateur.

```javascript
const defaultPrefs = await createDefaultPreferences(pool, 1);
// Crée avec:
// - locale: 'fr'
// - theme: 'light'
// - notif_email: true
// - notif_sms: false
// - notif_push: false
```

#### 3. updatePreferences(pool, userId, updates)

Met à jour un ou plusieurs champs de préférences.

```javascript
const updated = await updatePreferences(pool, 1, {
  theme: 'dark',
  locale: 'en',
  notif_frequency: 'daily'
});
```

**Validation** :
- `locale`: fr, en, es
- `theme`: light, dark, auto
- `notif_channel`: email, sms, push, none
- `notif_frequency`: immediate, daily, weekly, never
- `notif_*` booléens: true/false

#### 4. updateWidgets(pool, userId, widgets)

Met à jour la configuration des widgets du dashboard.

```javascript
const widgets = [
  { id: 'occupancy', type: 'chart' },
  { id: 'revenue', type: 'stat' },
  { id: 'payments', type: 'list' }
];

await updateWidgets(pool, 1, widgets);
```

**Structure widget** :
```javascript
{
  id: 'unique-id',         // Identifiant unique
  type: 'chart|stat|list', // Type de widget
  config: {                // Configuration optionnelle
    title: 'Mon widget',
    size: 'md',
    refresh: 60000         // Refresh en ms
  }
}
```

#### 5. saveFilter(pool, userId, filterName, filterConfig)

Sauvegarde un filtre de recherche.

```javascript
const filterConfig = {
  status: 'active',
  period: '30d',
  minAmount: 1000
};

await saveFilter(pool, 1, 'active-30j', filterConfig);
```

**Structure filtre sauvegardé** :
```javascript
{
  active-30j: {
    config: { status: 'active', period: '30d', minAmount: 1000 },
    created_at: '2025-10-24T10:00:00Z',
    updated_at: '2025-10-24T10:00:00Z'
  }
}
```

#### 6. deleteFilter(pool, userId, filterName)

Supprime un filtre sauvegardé.

```javascript
await deleteFilter(pool, 1, 'active-30j');
```

## Utilisation dans les routes

### Récupérer les préférences

```javascript
// backend/src/routes/userPreferences.js
const express = require('express');
const { getPreferences } = require('../services/userPreferences');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const preferences = await getPreferences(pool, req.user.id);
    res.json(preferences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

### Mettre à jour les préférences

```javascript
router.put('/', requireAuth, async (req, res) => {
  try {
    const updated = await updatePreferences(pool, req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

### Configurer les widgets

```javascript
router.post('/widgets', requireAuth, async (req, res) => {
  try {
    const widgets = await updateWidgets(pool, req.user.id, req.body.widgets);
    res.json({ widgets });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

## Frontend - Utilisation

### Récupérer les préférences

```javascript
// frontend/src/hooks/usePreferences.js
import { useEffect, useState } from 'react';

export function usePreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/preferences')
      .then(r => r.json())
      .then(setPreferences)
      .finally(() => setLoading(false));
  }, []);

  const updatePreferences = async (updates) => {
    const res = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updated = await res.json();
    setPreferences(updated);
    return updated;
  };

  return { preferences, loading, updatePreferences };
}
```

### Utiliser dans un composant

```javascript
// frontend/src/components/Settings.jsx
import { usePreferences } from '../hooks/usePreferences';

export default function Settings() {
  const { preferences, updatePreferences } = usePreferences();

  const handleThemeChange = async (theme) => {
    await updatePreferences({ theme });
  };

  const handleLocaleChange = async (locale) => {
    await updatePreferences({ locale });
  };

  return (
    <div>
      <h2>Paramètres</h2>
      
      <label>
        Langue:
        <select 
          value={preferences?.locale}
          onChange={e => handleLocaleChange(e.target.value)}
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>

      <label>
        Thème:
        <select 
          value={preferences?.theme}
          onChange={e => handleThemeChange(e.target.value)}
        >
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
          <option value="auto">Auto</option>
        </select>
      </label>
    </div>
  );
}
```

## Tests

### Exécuter les tests

```bash
npm test -- userPreferences.test.js
```

### Couverture

```
✓ getPreferences (création par défaut)
✓ createDefaultPreferences
✓ updatePreferences (validation complète)
✓ updateWidgets (validation complexe)
✓ saveFilter et deleteFilter
✓ Edge cases (NULL, structures complexes)
```

## Données d'exemple

### Préférences d'un utilisateur français

```json
{
  "user_id": 1,
  "locale": "fr",
  "theme": "dark",
  "notif_channel": "email",
  "notif_email": true,
  "notif_sms": false,
  "notif_push": false,
  "notif_frequency": "daily",
  "widgets": [
    {
      "id": "occupancy",
      "type": "chart",
      "config": {
        "title": "Taux d'occupation",
        "period": "month"
      }
    },
    {
      "id": "revenue",
      "type": "stat",
      "config": {
        "title": "Revenu",
        "currency": "XOF"
      }
    }
  ],
  "saved_filters": {
    "active-contracts": {
      "config": {
        "status": "active",
        "type": "residential"
      },
      "created_at": "2025-10-20T10:00:00Z",
      "updated_at": "2025-10-24T14:30:00Z"
    }
  }
}
```

## Bonnes pratiques

✅ **À faire** :
- Créer les préférences par défaut au signup
- Valider avant de sauvegarder en BD
- Utiliser JSONB pour la flexibilité
- Tracer avec OpenTelemetry
- Cacher les données sensibles

❌ **À éviter** :
- Stocker des tokens dans les préférences
- Pas de validation des inputs
- Requêtes N+1 pour les filtres
- Pas d'indexes sur JSONB
- Modifications directes du JSON

## Performance

### Requête typique

```sql
SELECT * FROM user_preferences WHERE user_id = 1;
```

Temps: ~1-2ms (avec index)

### Mise à jour JSON

```sql
UPDATE user_preferences 
SET widgets = jsonb_set(widgets, '{0,config,title}', '"New Title"')
WHERE user_id = 1;
```

Temps: ~5-10ms

## Ressources

- `backend/db/migrations/001_user_preferences.sql` - Migration
- `backend/src/services/userPreferences.js` - Service (300+ lignes)
- `backend/tests/userPreferences.test.js` - Tests (400+ lignes)
- `LOGGING_TRACING.md` - Traçabilité distribuée
- `ALERTS_BUSINESS.md` - Alertes en temps réel

---

**Les préférences utilisateur rendent l'app personnelle et engageante** ✨
