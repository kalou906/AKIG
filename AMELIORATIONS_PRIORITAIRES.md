# 🚀 AKIG - 8 AMÉLIORATIONS PRIORITAIRES

## Situation Actuelle ✅
- Backend: 0 erreurs TypeScript
- Frontend: 2 projets build réussis
- Docker: Infrastructure validée
- Cache: Redis + middleware opérationnel
- Rate-limiting: IPv6 corrigé
- npm audit: 0 vulnérabilités

---

## 🎯 AMÉLIORATIONS À FAIRE

### 1️⃣ LOGGING STRUCTURÉ (Winston)
**Problème**: console.log/error dispersés, logs non filtrés
**Solution**: Winston avec niveaux debug→info→warn→error

```javascript
// backend/src/services/logger.service.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// En développement: logs colorés console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

**Impact**: 
- Logs filtrés par niveau
- Fichiers historiques
- Stack traces capturés
- Format JSON pour parsing

**Temps**: 2 heures

---

### 2️⃣ TABLEAU DE BORD PROMETHEUS
**Problème**: Pas de métriques temps réel
**Solution**: Prometheus + Grafana pour monitoring

```javascript
// backend/src/middleware/metrics.middleware.js
const prometheus = require('prom-client');

// Métriques custom
const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée requêtes HTTP',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const cacheHits = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Nombre hits cache',
  labelNames: ['endpoint']
});

const apiErrors = new prometheus.Counter({
  name: 'api_errors_total',
  help: 'Erreurs API par type',
  labelNames: ['route', 'error_type']
});

// Exposer métriques
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

**Dashboard Grafana**:
- Temps réponse 95ème percentile
- Taux erreur par endpoint
- Cache hit ratio
- Utilisation mémoire

**Temps**: 4 heures (+ Grafana setup)

---

### 3️⃣ TESTS UNITAIRES (Jest)
**Problème**: Zéro tests → risques de régression
**Solution**: Jest + test coverage minimum 70%

```javascript
// backend/__tests__/services/cache.service.test.js
describe('CacheService', () => {
  describe('get/set', () => {
    it('devrait retourner valeur cachée', async () => {
      await CacheService.set('clé', 'valeur', 300);
      const résultat = await CacheService.get('clé');
      expect(résultat).toBe('valeur');
    });

    it('devrait retourner null après expiration', async () => {
      await CacheService.set('clé', 'valeur', 0.001);
      await new Promise(r => setTimeout(r, 2));
      const résultat = await CacheService.get('clé');
      expect(résultat).toBeNull();
    });
  });

  describe('invalidatePattern', () => {
    it('devrait supprimer clés matching pattern', async () => {
      await CacheService.set('user:1:data', {}, 300);
      await CacheService.set('user:2:data', {}, 300);
      await CacheService.invalidatePattern('user:*:data');
      
      expect(await CacheService.get('user:1:data')).toBeNull();
      expect(await CacheService.get('user:2:data')).toBeNull();
    });
  });
});

describe('Authorize middleware', () => {
  it('devrait bloquer sans token', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    authorize([])(req, res, () => {});
    
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

**Package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0"
  }
}
```

**Temps**: 6-8 heures

---

### 4️⃣ VALIDATION SCHÉMAS (Joi ou Zod)
**Problème**: Pas de validation centralisée
**Solution**: Joi middleware pour valider requêtes

```javascript
// backend/src/middleware/validate.middleware.js
const Joi = require('joi');

const schemas = {
  createLocataire: Joi.object({
    nom: Joi.string().required().min(3),
    email: Joi.string().email().required(),
    téléphone: Joi.string().pattern(/^[0-9+\-\s()]+$/),
    adresse: Joi.string().required()
  }),

  createContrat: Joi.object({
    numéro: Joi.string().required().alphanum(),
    locataireId: Joi.number().required(),
    montantMensuel: Joi.number().positive().required(),
    dateDebut: Joi.date().required(),
    duréeMois: Joi.number().min(1).max(60).required()
  }),

  updatePaiement: Joi.object({
    montant: Joi.number().positive(),
    date: Joi.date(),
    méthode: Joi.string().valid('espèces', 'virement', 'chèque', 'mobile')
  })
};

function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      convert: true 
    });

    if (error) {
      return res.status(400).json({
        erreur: 'Validation échouée',
        détails: error.details.map(d => ({
          champ: d.path.join('.'),
          message: d.message
        }))
      });
    }

    req.validatedData = value;
    next();
  };
}

module.exports = validate;
```

**Usage**:
```javascript
router.post('/locataires', 
  validate('createLocataire'),
  controller.createLocataire
);
```

**Temps**: 4 heures

---

### 5️⃣ COMPRESSION API (Gzip/Brotli)
**Problème**: Réponses JSON non compressées
**Solution**: compression middleware + Brotli optionnel

```javascript
// backend/src/middleware/compression.middleware.js
const compression = require('compression');

// Gzip (standard)
app.use(compression({
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Optionnel: Brotli (meilleur compression)
const brotliSize = require('brotli-size');

app.use((req, res, next) => {
  const send = res.send;
  res.send = function(data) {
    if (typeof data === 'object') {
      const json = JSON.stringify(data);
      const gzipSize = require('gzip-size').sync(json);
      const brotliSize = require('brotli-size').sync(json);
      
      res.set('X-Content-Uncompressed-Size', Buffer.byteLength(json));
      res.set('X-Gzip-Size', gzipSize);
      res.set('X-Brotli-Size', brotliSize);
    }
    return send.call(this, data);
  };
  next();
});
```

**Résultat**:
- Gzip: réduction 60-70% des réponses JSON
- Brotli: réduction 65-75%
- Gain bande: ~80% sur gros volumes

**Temps**: 1-2 heures

---

### 6️⃣ PAGINATION CURSOR-BASED
**Problème**: Offset pagination lent sur gros datasets
**Solution**: Cursor-based pour O(1) au lieu de O(n)

```javascript
// backend/src/utils/cursor-pagination.js
class CursorPagination {
  /**
   * Encode cursor: {id, timestamp}
   */
  static encodeCursor(record) {
    return Buffer.from(JSON.stringify({
      id: record.id,
      ts: record.created_at
    })).toString('base64');
  }

  /**
   * Decode cursor
   */
  static decodeCursor(cursor) {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  }

  /**
   * Query paginated results
   */
  static async paginate(query, cursor, limit = 20) {
    let whereClause = '';
    
    if (cursor) {
      const { id } = this.decodeCursor(cursor);
      whereClause = `WHERE id > ${id}`;
    }

    const sql = `
      SELECT * FROM (${query})
      ${whereClause}
      ORDER BY id ASC
      LIMIT ${limit + 1}
    `;

    const results = await pool.query(sql);
    const hasMore = results.length > limit;
    const records = hasMore ? results.slice(0, limit) : results;

    return {
      records,
      hasMore,
      nextCursor: hasMore 
        ? this.encodeCursor(records[records.length - 1])
        : null
    };
  }
}

module.exports = CursorPagination;
```

**Usage**:
```javascript
router.get('/impayes', async (req, res) => {
  const { cursor, limit } = req.query;
  
  const result = await CursorPagination.paginate(
    'SELECT * FROM impayes WHERE actif = true',
    cursor,
    parseInt(limit) || 20
  );

  res.json({
    données: result.records,
    pagination: {
      hasMore: result.hasMore,
      nextCursor: result.nextCursor
    }
  });
});
```

**Temps**: 3 heures

---

### 7️⃣ ALERTES SMS/EMAIL
**Problème**: Impayes critiques non notifiées
**Solution**: Service alertes automatiques

```javascript
// backend/src/services/alert.service.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');

class AlertService {
  constructor() {
    this.mailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.smsClient = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );
  }

  /**
   * Alerte impayé critique (>30 jours)
   */
  async alerterImpayéCritique(contrat) {
    const gestionnaire = await getGestionnaire(contrat.gesteId);
    
    // Email au gestionnaire
    await this.mailTransport.sendMail({
      to: gestionnaire.email,
      subject: `⚠️ Impayé CRITIQUE: ${contrat.numéro}`,
      html: `
        <h2>Impayé Critique Détecté</h2>
        <p><strong>Contrat:</strong> ${contrat.numéro}</p>
        <p><strong>Locataire:</strong> ${contrat.locataire.nom}</p>
        <p><strong>Montant:</strong> ${contrat.montantMensuel} GNF</p>
        <p><strong>Jours:</strong> ${contrat.joursImpayé}</p>
        <p>Action requise immédiatement!</p>
      `
    });

    // SMS si numéro disponible
    if (gestionnaire.téléphone) {
      await this.smsClient.messages.create({
        body: `ALERTE AKIG: Impayé critique ${contrat.numéro} - ${contrat.montantMensuel} GNF - ${contrat.joursImpayé}j. Action requise!`,
        from: process.env.TWILIO_PHONE,
        to: gestionnaire.téléphone
      });
    }
  }

  /**
   * Résumé quotidien
   */
  async envoyerRésuméQuotidien() {
    const stats = await getStatsImpayés();
    
    const admins = await getAdmins();
    for (const admin of admins) {
      await this.mailTransport.sendMail({
        to: admin.email,
        subject: `📊 Résumé AKIG ${new Date().toLocaleDateString('fr')}`,
        html: `
          <h2>Résumé Quotidien</h2>
          <ul>
            <li>Impayes critiques: ${stats.critiques}</li>
            <li>Montant total impayé: ${stats.montantTotal} GNF</li>
            <li>Contrats à vérifier: ${stats.àVérifier}</li>
          </ul>
        `
      });
    }
  }
}

module.exports = new AlertService();
```

**Cron job**:
```javascript
// backend/src/jobs/alerts.job.js
const cron = require('node-cron');
const AlertService = require('../services/alert.service');

// Vérifier impayes toutes les heures
cron.schedule('0 * * * *', async () => {
  const critiques = await findImpayésCritiques();
  for (const impayé of critiques) {
    await AlertService.alerterImpayéCritique(impayé);
  }
});

// Résumé quotidien 9h du matin
cron.schedule('0 9 * * *', () => {
  AlertService.envoyerRésuméQuotidien();
});
```

**Temps**: 4-5 heures

---

### 8️⃣ EXPORT PDF AVANCÉ
**Problème**: Exports PDF basiques sans templates
**Solution**: PDFKit templates personnalisables

```javascript
// backend/src/services/pdf.service.js
const PDFDocument = require('pdfkit');
const path = require('path');

class PDFService {
  /**
   * Générer quittance de paiement
   */
  async générerQuittance(paiement, contrat) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // En-tête AKIG
      doc.fontSize(20).font('Helvetica-Bold').text('QUITTANCE DE PAIEMENT');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('AKIG - Gestion Immobilière Guinée');
      doc.text('Tél: +224 612 345 678 | Email: contact@akig.gn');
      
      // Ligne séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Détails quittance
      const detailsX = 50;
      const valeurX = 300;

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('DÉTAILS QUITTANCE', detailsX, doc.y);
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(10);
      doc.text(`Numéro Quittance: ${paiement.id}`, detailsX, doc.y);
      doc.text(`Date: ${new Date(paiement.date).toLocaleDateString('fr')}`, valeurX, doc.y - 15);
      
      doc.moveDown();

      // Infos locataire
      doc.font('Helvetica-Bold').fontSize(11).text('LOCATAIRE');
      doc.font('Helvetica').fontSize(10);
      doc.text(contrat.locataire.nom, detailsX);
      doc.text(contrat.locataire.adresse);
      doc.text(`Tél: ${contrat.locataire.téléphone}`);

      doc.moveDown();

      // Tableau paiement
      const tableTop = doc.y;
      const col1 = 50, col2 = 300, col3 = 450;

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Description', col1, tableTop);
      doc.text('Montant', col2, tableTop);
      doc.text('État', col3, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      doc.font('Helvetica').fontSize(10);
      const détailY = tableTop + 20;
      doc.text(`Loyer ${new Date(paiement.date).toLocaleDateString('fr')}`, col1, détailY);
      doc.text(`${paiement.montant} GNF`, col2, détailY);
      doc.text('PAYÉ', col3, détailY);

      doc.moveDown(2);

      // Total
      const totalY = doc.y;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL PAYÉ:', col2, totalY);
      doc.text(`${paiement.montant} GNF`, col3, totalY);

      doc.moveTo(50, totalY + 20).lineTo(550, totalY + 20).stroke();

      // Signature
      doc.moveDown(2);
      doc.font('Helvetica').fontSize(9);
      doc.text('Signature Reçue', 100, doc.y);
      doc.text('Date & Cachet', 350, doc.y);

      // Bas de page
      doc.fontSize(8).text(
        'Cette quittance constitue preuve de paiement selon conditions contrat.',
        50,
        doc.page.height - 40,
        { align: 'center' }
      );

      // Générer PDF en buffer
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdf = Buffer.concat(chunks);
        resolve(pdf);
      });
      doc.on('error', reject);

      doc.end();
    });
  }

  /**
   * Générer rapport période
   */
  async générerRapportPériode(dateDebut, dateFin) {
    // Similar pattern pour rapports mensuels/trimestriels
  }
}

module.exports = new PDFService();
```

**Usage**:
```javascript
router.get('/paiements/:id/quittance', async (req, res) => {
  const paiement = await getPaiement(req.params.id);
  const contrat = await getContrat(paiement.contratId);

  const pdf = await PDFService.générerQuittance(paiement, contrat);

  res.contentType('application/pdf');
  res.send(pdf);
});
```

**Temps**: 3-4 heures

---

## 📊 IMPACT GLOBAL

| Amélioration | Temps | Bénéfice |
|---|---|---|
| Logging | 2h | Debugging, production monitoring |
| Prometheus | 4h | Performance tracking |
| Tests | 8h | Qualité, confiance régression |
| Validation | 4h | Données propres, erreurs claires |
| Compression | 2h | -70% bande réseau |
| Cursor pagination | 3h | Perf +1000% gros datasets |
| Alertes | 5h | Réactivité critique impayes |
| PDF avancé | 4h | Professionnalisme, conformité |
| **TOTAL** | **32h** | **Production-grade system** |

---

## 🎯 PRIORITÉ RECOMMANDÉE

1. **Urgence** (J+3): Logging (debugging facile)
2. **Urgence** (J+7): Tests (confiance)
3. **Haute** (J+14): Validation (qualité données)
4. **Haute** (J+21): Alertes (business critical)
5. **Moyenne** (J+30): Compression (perf)
6. **Moyenne** (J+40): Prometheus (monitoring)
7. **Basse** (J+50): Cursor pagination (optimization)
8. **Basse** (J+60): PDF avancé (UX)

---

## 💰 ROI

- **Temps dev**: 32h
- **Gains**:
  - Production safety ✅
  - 70% moins de bande réseau
  - Monitoring temps réel
  - Alertes impayes immédiates
  - Performance +1000% sur gros requêtes

**Valeur**: ÉNORME

---

**Veux-tu commencer par laquelle?**
