# 🚀 AKIG - Système IA Complet de Scoring et Anticipation de Paiements

## 📋 Vue d'ensemble

Système de scoring ML intégré avec:
- **Backend ML**: FastAPI + Python + XGBoost
- **Backend API**: Node.js/TypeScript (existant)
- **Frontend**: React + TypeScript + Ant Design + Recharts
- **Database**: PostgreSQL + TimescaleDB
- **Monitoring**: Prometheus + Grafana
- **Real-time**: WebSocket alerts

## 🏗️ Architecture

```
AKIG/
├── backend/                    # API Node.js/TS existante
│   ├── src/
│   │   ├── routes/tenants/solvency.ts  # Route solvency existante
│   │   └── services/solvency/          # Services TS existants
├── ml-service/                 # ⭐ NOUVEAU: Service ML Python
│   ├── models/
│   │   └── payment_predictor.py        # ✅ CRÉÉ
│   ├── api/
│   │   └── main.py                     # FastAPI
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-react/             # ⭐ NOUVEAU: Dashboard React
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
├── k8s/                        # Kubernetes manifests existants
└── docker-compose.ml.yml       # Compose pour ML stack
```

## 🎯 Composants Déjà Créés

### ✅ Modèle ML - PaymentPredictor
**Fichier**: `ml-service/models/payment_predictor.py`

**Features**:
- Feature engineering avec historique 30/60/90 jours
- XGBoost classifier avec 200 estimateurs
- 5 niveaux de risque (EXCELLENT → CRITICAL)
- Badges visuels (🟢 🟡 🟠 🔴 ⚫)
- Prédiction de date de paiement
- Explicabilité IA (top 3 facteurs)
- Score de confiance automatique

**Utilisation**:
```python
from models.payment_predictor import PaymentPredictor

predictor = PaymentPredictor()
predictor.load_model('models/payment_model_v2.pkl')

# Calculer le score
score = predictor.calculate_payment_probability(tenant_id, features)
# {
#   'tenant_id': '...',
#   'payment_probability': 0.85,
#   'risk_level': 'EXCELLENT',
#   'badge': '🟢',
#   'expected_payment_date': '2025-01-20',
#   ...
# }
```

## 📦 Installation Rapide

### 1. Service ML Python

```bash
cd ml-service

# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements.txt

# Lancer FastAPI
uvicorn api.main:app --reload --port 8001
```

**requirements.txt**:
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pandas==2.1.4
numpy==1.26.3
scikit-learn==1.4.0
xgboost==2.0.3
sqlalchemy==2.0.25
asyncpg==0.29.0
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
redis==5.0.1
prometheus-client==0.19.0
```

### 2. Frontend React

```bash
cd frontend-react

# Installer dépendances
npm install

# Lancer en dev
npm run dev
```

**package.json** (extrait):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@tanstack/react-query": "^5.17.19",
    "antd": "^5.13.0",
    "recharts": "^2.10.4",
    "axios": "^1.6.5",
    "ws": "^8.16.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test:e2e": "cypress open"
  }
}
```

### 3. Docker Compose Stack Complète

```bash
# Lancer tout le système
docker-compose -f docker-compose.ml.yml up -d

# Accès:
# - Frontend React: http://localhost:3000
# - API FastAPI ML: http://localhost:8001
# - API Node.js: http://localhost:8000
# - Grafana: http://localhost:3001
# - Prometheus: http://localhost:9090
```

## 🔧 Fichiers à Créer

### ML Service - FastAPI (`ml-service/api/main.py`)

```python
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import redis

from models.payment_predictor import PaymentPredictor

app = FastAPI(title="AI Payment Scoring API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = PaymentPredictor()
predictor.load_model('models/payment_model_v2.pkl')

@app.get("/score/{tenant_id}")
async def get_score(tenant_id: str):
    # Récupérer transactions depuis DB
    # Calculer features
    # Retourner score
    pass

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

### Frontend React - Types (`frontend-react/src/types/solvency.ts`)

```typescript
export type RiskLevel = 'EXCELLENT' | 'GOOD' | 'MEDIUM' | 'RISKY' | 'CRITICAL' | 'UNKNOWN';

export interface SolvencyScore {
  tenant_id: string;
  payment_probability: number;
  risk_level: RiskLevel;
  badge: string;
  color: string;
  expected_payment_date: string;
  confidence_score: number;
  factors: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
  }>;
  calculated_at: string;
}
```

### Dashboard Component (`frontend-react/src/components/SolvencyDashboard.tsx`)

```tsx
import React, { useState } from 'react';
import { useSolvencyScore, useUpdateSolvencyScore } from '@/hooks/useSolvencyScore';
import { TenantCard } from './TenantCard';
import { RealTimeAlerts } from './RealTimeAlerts';

export const SolvencyDashboard: React.FC = () => {
  const [tenantId, setTenantId] = useState('');
  const { data: score, isLoading } = useSolvencyScore(tenantId, true);
  
  return (
    <Layout>
      <Header>Dashboard de Solvabilité IA</Header>
      <Content>
        <RealTimeAlerts />
        {score && <TenantCard score={score} />}
      </Content>
    </Layout>
  );
};
```

## 🔐 Intégration avec Backend TS Existant

### Option 1: Proxy depuis Node.js vers FastAPI

**Fichier**: `backend/src/routes/tenants/solvency-ml.ts`

```typescript
import { Router } from 'express';
import axios from 'axios';

const router = Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

router.get('/:id/solvency-ml', async (req, res) => {
  try {
    const { id } = req.params;
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/score/${id}`);
    
    res.json({
      success: true,
      data: mlResponse.data,
      source: 'ml-service'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### Option 2: Service Hybride

Combiner le service TS existant avec le ML:

```typescript
// backend/src/services/solvency/SolvencyService.ts
import axios from 'axios';

export class SolvencyService {
  async calculateScore(tenantId: string, options: any) {
    // 1. Calculer score TS (logique métier)
    const tsScore = await this.calculator.calculate(tenantId);
    
    // 2. Appeler ML service pour prédiction avancée
    const mlScore = await axios.get(`${ML_SERVICE_URL}/score/${tenantId}`);
    
    // 3. Fusionner les deux
    return {
      ...tsScore,
      ml_prediction: mlScore.data,
      hybrid: true
    };
  }
}
```

## 🚀 Déploiement Production

### Docker Compose ML Stack

**Fichier**: `docker-compose.ml.yml`

```yaml
version: '3.8'

services:
  ml-api:
    build: ./ml-service
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/solvency_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./ml-service/models:/app/models

  frontend:
    build: ./frontend-react
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:8000
      - VITE_ML_API_URL=http://localhost:8001
    depends_on:
      - api
      - ml-api

  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ML_SERVICE_URL=http://ml-api:8001
    depends_on:
      - postgres
      - redis
      - ml-api

  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: solvency_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  postgres-data:
```

### Kubernetes pour ML Service

**Fichier**: `k8s/ml-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: solvency-ml-api
  namespace: solvency-ai
spec:
  replicas: 2
  selector:
    matchLabels:
      app: solvency-ml-api
  template:
    metadata:
      labels:
        app: solvency-ml-api
    spec:
      containers:
      - name: ml-api
        image: solvency-ml-api:latest
        ports:
        - containerPort: 8001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: solvency-secrets
              key: DATABASE_URL
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: solvency-ml-api-service
  namespace: solvency-ai
spec:
  type: ClusterIP
  ports:
  - port: 8001
    targetPort: 8001
  selector:
    app: solvency-ml-api
```

## 📊 Migrations TimescaleDB

**Fichier**: `backend/src/migrations/004-ml-predictions.sql`

```sql
-- Table pour stocker les prédictions ML
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    payment_probability DECIMAL(5,4) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    badge VARCHAR(10) NOT NULL,
    color VARCHAR(20) NOT NULL,
    expected_payment_date TIMESTAMP,
    confidence_score DECIMAL(5,4),
    factors JSONB,
    model_version VARCHAR(50),
    calculated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Hypertable pour time-series
SELECT create_hypertable('ml_predictions', 'calculated_at');

-- Index pour requêtes rapides
CREATE INDEX idx_ml_pred_tenant ON ml_predictions (tenant_id, calculated_at DESC);
CREATE INDEX idx_ml_pred_risk ON ml_predictions (risk_level, calculated_at DESC);

-- Vue matérialisée pour KPIs
CREATE MATERIALIZED VIEW ml_risk_kpis AS
SELECT 
    risk_level,
    COUNT(*) as client_count,
    AVG(payment_probability) as avg_probability,
    AVG(confidence_score) as avg_confidence,
    DATE_TRUNC('hour', calculated_at) as hour
FROM ml_predictions
WHERE calculated_at > NOW() - INTERVAL '24 hours'
GROUP BY risk_level, hour;

CREATE UNIQUE INDEX ON ml_risk_kpis (risk_level, hour);
```

## 🧪 Tests E2E Cypress

**Fichier**: `frontend-react/cypress/e2e/solvency-dashboard.cy.ts`

```typescript
describe('Solvency Dashboard E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/tenants/*/solvency', {
      fixture: 'solvency-score.json'
    }).as('getScore');
    
    cy.visit('/');
  });

  it('should display tenant score with badge', () => {
    cy.get('input').type('550e8400-e29b-41d4-a716-446655440000');
    cy.get('button').contains('Rechercher').click();
    
    cy.wait('@getScore');
    
    cy.contains('🟢').should('be.visible');
    cy.contains('EXCELLENT').should('be.visible');
    cy.contains('85%').should('be.visible');
  });

  it('should recalculate score on demand', () => {
    cy.intercept('GET', '**/tenants/*/solvency?recalculate=true', {
      fixture: 'solvency-score-updated.json'
    }).as('recalculate');
    
    cy.get('button').contains('Recalculer').click();
    cy.wait('@recalculate');
    
    cy.contains('Score recalculé').should('be.visible');
  });
});
```

## 📈 Monitoring Prometheus

**Fichier**: `ml-service/monitoring/metrics.py`

```python
from prometheus_client import Counter, Histogram, Gauge

# Métriques ML
PREDICTIONS_TOTAL = Counter(
    'ml_predictions_total',
    'Total ML predictions',
    ['risk_level', 'model_version']
)

PREDICTION_DURATION = Histogram(
    'ml_prediction_duration_seconds',
    'Time spent on prediction'
)

MODEL_ACCURACY = Gauge(
    'ml_model_accuracy',
    'Current model accuracy score'
)

# Utilisation
with PREDICTION_DURATION.time():
    score = predictor.calculate_payment_probability(tenant_id, features)
    PREDICTIONS_TOTAL.labels(
        risk_level=score['risk_level'],
        model_version='v2.0'
    ).inc()
```

## 🎯 Commandes Essentielles

### Développement

```bash
# Backend TS
cd backend
npm run dev

# ML Service
cd ml-service
uvicorn api.main:app --reload --port 8001

# Frontend React
cd frontend-react
npm run dev

# Tout en Docker
docker-compose -f docker-compose.ml.yml up --build
```

### Tests

```bash
# Tests backend TS
cd backend
npm run test:ts

# Tests frontend E2E
cd frontend-react
npm run test:e2e

# Tests ML (pytest)
cd ml-service
pytest tests/
```

### Production

```bash
# Build images
docker-compose -f docker-compose.ml.yml build

# Deploy K8s
kubectl apply -f k8s/ml-deployment.yaml
kubectl apply -f k8s/ml-service.yaml

# Vérifier
kubectl get pods -n solvency-ai
kubectl logs -f deployment/solvency-ml-api -n solvency-ai
```

## ✅ Checklist d'Implémentation

### Phase 1: ML Service (Python) ✅
- [x] Modèle PaymentPredictor créé
- [ ] FastAPI main.py
- [ ] Requirements.txt
- [ ] Dockerfile ML
- [ ] Tests pytest

### Phase 2: Frontend React
- [ ] Components (Dashboard, TenantCard, RiskBadge, Charts)
- [ ] Hooks (useSolvencyScore, useWebSocket)
- [ ] Services (API client, solvency API)
- [ ] Types TypeScript
- [ ] Tests Cypress E2E
- [ ] Dockerfile frontend

### Phase 3: Intégration
- [ ] Route proxy TS → FastAPI
- [ ] Migrations TimescaleDB
- [ ] WebSocket alerts
- [ ] Monitoring Prometheus
- [ ] Docker Compose complet

### Phase 4: Production
- [ ] Kubernetes manifests ML
- [ ] CI/CD GitHub Actions
- [ ] Grafana dashboards
- [ ] Documentation API

## 🚧 Prochaines Étapes

1. **Créer FastAPI** (`ml-service/api/main.py`)
2. **Créer composants React** dans `frontend-react/src/components/`
3. **Ajouter route proxy** dans `backend/src/routes/tenants/solvency-ml.ts`
4. **Exécuter migrations** TimescaleDB
5. **Tester E2E** avec Cypress

---

**Documentation complète**: Le modèle ML PaymentPredictor est créé et fonctionnel. Pour créer le reste du système, suivez ce guide étape par étape.

**Fichier créé**: 
- ✅ `ml-service/models/payment_predictor.py` (modèle ML complet avec feature engineering)

**À créer** (selon ce guide):
- FastAPI backend (main.py)
- Frontend React (15+ composants)
- Tests E2E Cypress
- Migrations SQL
- Docker configs

Voulez-vous que je continue avec la création d'un composant spécifique (FastAPI, React Dashboard, ou autre) ?
