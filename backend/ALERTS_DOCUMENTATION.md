/**
 * Alerts System Documentation
 * backend/ALERTS_DOCUMENTATION.md
 * 
 * Guide d'utilisation du système d'alertes et notifications
 */

# 🚨 Système d'Alertes AKIG

## Vue d'ensemble

Le système d'alertes permet de notifier les utilisateurs et les administrateurs de manière centralisée via plusieurs canaux (email, SMS, WhatsApp, in-app, Slack, webhooks).

## Architecture

### Types d'Alertes

```javascript
ALERT_TYPES = {
  ERROR: 'error',           // ❌ Erreur
  WARNING: 'warning',       // ⚠️ Avertissement
  INFO: 'info',             // ℹ️ Information
  SUCCESS: 'success',       // ✅ Succès
  SECURITY: 'security',     // 🔒 Sécurité
  PAYMENT: 'payment',       // 💰 Paiement
  MAINTENANCE: 'maintenance', // 🔧 Maintenance
  COMPLIANCE: 'compliance', // 📋 Conformité
  SYNC: 'sync',             // 🔄 Synchronisation
}
```

### Niveaux de Sévérité

```javascript
SEVERITY_LEVELS = {
  CRITICAL: 'critical',     // 🔴 Critique
  HIGH: 'high',             // 🟠 Haute
  MEDIUM: 'medium',         // 🟡 Moyenne
  LOW: 'low',               // 🟢 Basse
  INFO: 'info',             // 🔵 Info
}
```

### Canaux de Notification

```javascript
CHANNELS = {
  EMAIL: 'email',           // 📧 Email
  SMS: 'sms',               // 📱 SMS
  WHATSAPP: 'whatsapp',     // 💬 WhatsApp
  IN_APP: 'in_app',         // 🔔 In-app
  SLACK: 'slack',           // 💼 Slack
  WEBHOOK: 'webhook',       // 🪝 Webhook personnalisé
}
```

## Utilisation

### 1. Alerter les Administrateurs

```javascript
const { alertAdmins } = require('./services/alerts');

// Usage simple
await alertAdmins('Une erreur critique est survenue', {
  type: 'error',
  severity: 'critical',
  channels: ['email', 'sms'],
});

// Avec détails
await alertAdmins('Paiement échoué', {
  type: 'payment',
  severity: 'high',
  channels: ['email'],
  details: {
    amount: 5000,
    contract_id: 'abc123',
    reason: 'Carte bancaire expirée',
  },
  code: 'PAYMENT_FAILED',
});
```

### 2. Alerter un Utilisateur Spécifique

```javascript
const { alertUser } = require('./services/alerts');

await alertUser(userId, 'Votre contrat expire bientôt', {
  type: 'warning',
  severity: 'medium',
  channels: ['in_app', 'email'],
});
```

### 3. Configuration de la Gestion Globale des Erreurs

```javascript
const { setupGlobalErrorHandling } = require('./services/alerts');

// Appelé dans index.js
setupGlobalErrorHandling();

// Capture automatiquement:
// - Les exceptions non gérées
// - Les rejets de promesses non gérées
// - Les envoie aux admins
```

## API Endpoints

### GET /api/alerts
Récupère les alertes de l'utilisateur

**Query parameters:**
- `unread` (boolean) - Afficher seulement les non-lues
- `limit` (number) - Nombre max (défaut: 50)
- `offset` (number) - Décalage (défaut: 0)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "error",
    "severity": "high",
    "message": "Une erreur est survenue",
    "details": {},
    "code": "ERROR_CODE",
    "read": false,
    "created_at": "2025-10-25T10:00:00Z"
  }
]
```

### GET /api/alerts/stats
Récupère les statistiques d'alertes

**Response:**
```json
{
  "total": 45,
  "unread": 12,
  "critical_count": 2,
  "high_count": 8,
  "error_count": 15,
  "last_alert": "2025-10-25T10:00:00Z"
}
```

### POST /api/alerts/:id/read
Marque une alerte comme lue

### POST /api/alerts/read-all
Marque toutes les alertes comme lues

### DELETE /api/alerts/:id
Supprime une alerte

### POST /api/alerts/send-admin (Admin only)
Envoie une alerte aux administrateurs

**Body:**
```json
{
  "message": "Alerte manuelle",
  "type": "warning",
  "severity": "high",
  "channels": ["email", "sms"],
  "details": {}
}
```

### PATCH /api/alerts/preferences
Met à jour les préférences d'alertes

**Body:**
```json
{
  "channels": ["email", "sms", "in_app"],
  "severity": "medium",
  "enabled": true
}
```

### GET /api/alerts/health/critical (Admin only)
Affiche les alertes critiques des dernières 24h

## Cas d'Usage

### 1. Erreur de Paiement

```javascript
const { alertAdmins } = require('./services/alerts');

try {
  // Traiter le paiement
} catch (error) {
  await alertAdmins(`Paiement échoué: ${error.message}`, {
    type: 'payment',
    severity: 'high',
    channels: ['email', 'sms'],
    details: {
      paymentId: payment.id,
      amount: payment.amount,
      error: error.message,
    },
    code: 'PAYMENT_ERROR',
  });
}
```

### 2. Notification de Contrat

```javascript
const { alertUser } = require('./services/alerts');

// Notification 30 jours avant expiration
const expiringContracts = await getExpiringContracts(30);

for (const contract of expiringContracts) {
  await alertUser(contract.tenant_id, 
    `Votre contrat ${contract.number} expire le ${contract.end_date}`,
    {
      type: 'warning',
      severity: 'medium',
      channels: ['in_app', 'email'],
    }
  );
}
```

### 3. Alerte de Maintenance

```javascript
// Dans les routes de maintenance
router.post('/:id/alert', async (req, res) => {
  const { message } = req.body;
  
  await alertAdmins(`Maintenance signalée: ${message}`, {
    type: 'maintenance',
    severity: 'high',
    channels: ['email'],
    details: {
      maintenanceId: req.params.id,
    },
  });
});
```

### 4. Alerte de Conformité

```javascript
// Audit de conformité
const issues = await auditCompliance();

if (issues.length > 0) {
  await alertAdmins(
    `${issues.length} problème(s) de conformité détecté(s)`,
    {
      type: 'compliance',
      severity: 'critical',
      channels: ['email', 'sms', 'slack'],
      details: { issues },
      code: 'COMPLIANCE_ISSUE',
    }
  );
}
```

## Base de Données

### Tables

1. **alert_logs** - Historique des alertes
2. **in_app_alerts** - Alertes in-app non lues
3. **alert_preferences** - Préférences utilisateur
4. **alert_webhooks** - Webhooks personnalisés
5. **alert_delivery_log** - Log de livraison

### Vues

- `vw_alert_stats` - Statistiques par utilisateur
- `vw_system_alerts` - Alertes critiques système
- `vw_alert_delivery_stats` - Stats de livraison par canal

## Sécurité

- ✅ Authentification requise pour tous les endpoints
- ✅ Validation des inputs
- ✅ Rate limiting appliqué
- ✅ Audit logging de toutes les actions
- ✅ Chiffrement des emails sensibles
- ✅ GDPR: suppression en cascade avec user

## Performance

- 📊 Index sur user_id, severity, type, read
- 🧹 Nettoyage automatique des anciennes alertes
- ⚡ Requêtes optimisées avec vues
- 🔄 Gestion de queue pour les alertes en masse

## Intégrations

### Slack
```bash
# Dans .env
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Webhooks Personnalisés
```javascript
// Dans les préférences utilisateur
{
  "webhook_url": "https://example.com/webhooks/alerts",
  "event_types": ["error", "critical"]
}
```

## Logs

Les logs de synchronisation sont conservés dans `alert_logs` :

```javascript
const logs = await getSyncLogs();
// Retourne les 20 derniers logs
```

## Tests

```bash
# Envoyer une alerte de test
curl -X POST http://localhost:4002/api/alerts/test \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Response
{
  "success": true,
  "sent": 3
}
```

## Dépannage

### Les alertes ne sont pas envoyées

1. Vérifier que les canaux sont configurés
2. Vérifier les logs d'erreur dans le service
3. Vérifier les permissions d'accès à la base de données

### Les préférences ne sont pas respectées

1. Vérifier `alert_preferences` table
2. Vérifier colonnes `alert_channels`, `alert_severity` dans `users`

### Les webhooks ne déclenchent pas

1. Vérifier l'URL du webhook
2. Vérifier les logs de livraison
3. Vérifier les event_types configurés

## Statut de Production

✅ **Prêt pour production**

- Tous les endpoints implémentés
- Gestion d'erreurs complète
- Validation des inputs
- Audit logging
- Performance optimisée
- Sécurité configurée

