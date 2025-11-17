# Guide d'instrumentation OpenTelemetry

## Vue d'ensemble

Ce guide montre comment ajouter le traçage OpenTelemetry aux services et routes de l'application AKIG.

## Pattern d'instrumentation

### 1. Service (business logic)

```javascript
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('akig-service-name');

async function myFunction(params) {
  const span = tracer.startSpan('myFunction');
  try {
    // Enregistrer les paramètres importants
    span.setAttributes({
      'param.key': params.value,
      'param.type': typeof params.value,
    });

    // Logique métier
    const result = await doSomething(params);

    // Enregistrer le résultat
    span.setAttributes({
      'result.status': 'success',
      'result.count': result.length,
    });

    return result;
  } catch (error) {
    // Enregistrer l'exception
    span.recordException(error);
    span.setAttributes({
      'error.code': error.code,
      'error.name': error.name,
    });
    throw error;
  } finally {
    // Toujours terminer le span
    span.end();
  }
}
```

### 2. Route HTTP (controller)

```javascript
const { trace } = require('@opentelemetry/api');
const router = express.Router();

const tracer = trace.getTracer('akig-routes-name');

router.post('/api/resource', async (req, res) => {
  const span = tracer.startSpan('POST /api/resource');
  try {
    // Enregistrer le contexte de la requête
    span.setAttributes({
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.get('user-agent'),
      'user.id': req.user?.id,
      'request.body.size': JSON.stringify(req.body).length,
    });

    // Logique métier (appeler un service)
    const result = await MyService.create(req.body);

    // Enregistrer la réponse
    span.setAttributes({
      'http.status_code': 201,
      'response.id': result.id,
    });

    res.status(201).json(result);
  } catch (error) {
    // Enregistrer l'erreur
    span.recordException(error);
    span.setAttributes({
      'http.status_code': 500,
      'error.type': error.constructor.name,
    });
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});
```

### 3. Opération de base de données

```javascript
// Dans un service
async function fetchContract(contractId) {
  const span = tracer.startSpan('query:fetchContract');
  try {
    span.setAttributes({
      'db.operation': 'SELECT',
      'db.table': 'contracts',
      'db.contract_id': contractId,
    });

    const result = await pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [contractId]
    );

    span.setAttributes({
      'db.rows_count': result.rows.length,
      'db.query_time_ms': result.duration, // Si disponible
    });

    return result.rows[0];
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

## Attributs standards

### HTTP Spans

| Attribut | Exemple | Usage |
|----------|---------|-------|
| `http.method` | `POST` | Méthode HTTP |
| `http.url` | `/api/payments` | URL requête |
| `http.status_code` | `201` | Code réponse |
| `http.client_ip` | `192.168.1.1` | IP client |

### Database Spans

| Attribut | Exemple | Usage |
|----------|---------|-------|
| `db.system` | `postgresql` | Type BD |
| `db.operation` | `INSERT` | Type opération |
| `db.table` | `contracts` | Nom table |
| `db.rows_affected` | `1` | Lignes affectées |

### Business Spans

| Attribut | Exemple | Usage |
|----------|---------|-------|
| `service.name` | `akig-api` | Service |
| `operation.name` | `processPayment` | Opération |
| `user.id` | `123` | Utilisateur |
| `resource.id` | `456` | Ressource |

## Niveaux de détail

### Minimal (léger)
```javascript
const span = tracer.startSpan('operation');
span.setAttributes({ 'status': 'ok' });
span.end();
```

### Standard (recommandé)
```javascript
const span = tracer.startSpan('processPayment');
try {
  span.setAttributes({
    'payment.id': id,
    'payment.amount': amount,
    'user.id': userId,
  });
  
  // logique
  
  span.setAttributes({ 'status': 'success' });
} catch (err) {
  span.recordException(err);
} finally {
  span.end();
}
```

### Détaillé (production)
```javascript
const span = tracer.startSpan('processPayment');
try {
  const startTime = Date.now();
  
  span.setAttributes({
    'payment.id': id,
    'payment.amount': amount,
    'payment.currency': 'XOF',
    'payment.method': method,
    'user.id': userId,
    'user.role': role,
    'timestamp': new Date().toISOString(),
  });
  
  // logique
  
  span.addEvent('payment_validated', {
    'validation.method': 'strict',
    'validation.time_ms': Date.now() - startTime,
  });
  
  span.setAttributes({
    'status': 'success',
    'operation.duration_ms': Date.now() - startTime,
  });
} catch (err) {
  span.recordException(err);
  span.setAttributes({
    'error.code': err.code,
    'error.message': err.message,
    'error.stack_trace': err.stack,
  });
} finally {
  span.end();
}
```

## Patterns spécifiques

### Validation

```javascript
async function validatePayment(payment) {
  const span = tracer.startSpan('validatePayment');
  try {
    // Valider chaque champ
    const validations = {
      amount: validateAmount(payment.amount),
      invoice: validateInvoice(payment.invoiceId),
      method: validateMethod(payment.method),
    };

    span.addEvent('validation_complete', {
      'validations.passed': Object.values(validations).filter(v => v).length,
      'validations.total': Object.keys(validations).length,
    });

    return Object.values(validations).every(v => v);
  } finally {
    span.end();
  }
}
```

### Transactions multi-étapes

```javascript
async function processPayment(payment) {
  const rootSpan = tracer.startSpan('processPayment');
  try {
    // Étape 1
    const validateSpan = tracer.startSpan('validate', { parent: rootSpan });
    try {
      validatePayment(payment);
    } finally {
      validateSpan.end();
    }

    // Étape 2
    const saveSpan = tracer.startSpan('saveToDatabase', { parent: rootSpan });
    try {
      await pool.query('INSERT INTO payments ...', [payment]);
    } finally {
      saveSpan.end();
    }

    // Étape 3
    const pdfSpan = tracer.startSpan('generateReceipt', { parent: rootSpan });
    try {
      await generateReceiptPDF(payment);
    } finally {
      pdfSpan.end();
    }

    rootSpan.setAttributes({ 'status': 'completed' });
  } catch (err) {
    rootSpan.recordException(err);
    throw err;
  } finally {
    rootSpan.end();
  }
}
```

### Erreurs contrôlées

```javascript
async function getContract(id) {
  const span = tracer.startSpan('getContract');
  try {
    span.setAttributes({ 'contract.id': id });

    const result = await pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      const err = new Error('Contract not found');
      err.code = 'NOT_FOUND';
      span.recordException(err);
      span.setAttributes({
        'error.type': 'not_found',
        'http.status_code': 404,
      });
      throw err;
    }

    span.setAttributes({ 'resource.found': true });
    return result.rows[0];
  } finally {
    span.end();
  }
}
```

### Timing et performance

```javascript
async function longOperation() {
  const span = tracer.startSpan('longOperation');
  try {
    const startTime = performance.now();

    // Opération 1
    const t1 = performance.now();
    await operation1();
    span.addEvent('operation1_complete', {
      'duration_ms': performance.now() - t1,
    });

    // Opération 2
    const t2 = performance.now();
    await operation2();
    span.addEvent('operation2_complete', {
      'duration_ms': performance.now() - t2,
    });

    span.setAttributes({
      'total_duration_ms': performance.now() - startTime,
    });
  } finally {
    span.end();
  }
}
```

## Checklist d'instrumentation

- [ ] Service/fonction a un span `tracer.startSpan('name')`
- [ ] Span a un `try/finally` pour `span.end()`
- [ ] Entrées importantes enregistrées en `setAttributes()`
- [ ] Résultats/outputs enregistrés
- [ ] Erreurs catchées avec `recordException()`
- [ ] Codes HTTP enregistrés en `http.status_code`
- [ ] IDs de ressources capturées (user, payment, contract)
- [ ] Pas d'informations sensibles (mots de passe, tokens)

## Vérification

```bash
# Vérifier que les traces s'affichent
npm run dev

# Devrait afficher lors des requêtes:
# {
#   traceId: '...',
#   spanId: '...',
#   name: 'POST /api/payments',
#   duration: 145,
#   ...attributes...
# }
```

## Ressources

- [OpenTelemetry JS API](https://opentelemetry.io/docs/instrumentation/js/api/)
- [Semantic Conventions](https://opentelemetry.io/docs/specs/otel/protocol/)
- `OTEL_SETUP.md` - Configuration complète

---

**Bien instrumenter aide à diagnostiquer et optimiser** ✅
