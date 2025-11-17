# 🔄 Guide de Migration AKIG v2 → v3

## Vue d'ensemble

Ce guide vous accompagne dans la migration de votre système AKIG v2 (Node 18 + Express + React 18) vers AKIG v3 (Node 22 + NestJS + Next.js 15).

### Changements majeurs

| Composant | v2 | v3 | Impact |
|-----------|----|----|--------|
| Backend Runtime | Node 18.20.3 | Node 22.11.0 | ⚠️ BREAKING |
| Backend Framework | Express 4.18 | NestJS 10.4 | ⚠️ BREAKING |
| Frontend Framework | React 18 + Vite | Next.js 15 (React 19) | ⚠️ BREAKING |
| Database | PostgreSQL 15 | PostgreSQL 16 + TimescaleDB | ✅ Compatible |
| ORM | pg (raw SQL) | Prisma 6.1 | ⚠️ BREAKING |
| State Management | Jotai + SWR | Zustand + React Query | ⚠️ BREAKING |
| Auth | bcrypt + JWT | Argon2id + JWT EdDSA | ⚠️ BREAKING |

---

## 📋 Prérequis Migration

### Sauvegarde complète

```bash
# 1. Backup base de données
pg_dump -U akig -d akig_db > backup_v2_$(date +%Y%m%d).sql

# 2. Backup fichiers uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz ./backend/uploads

# 3. Backup .env
cp .env .env.backup_v2

# 4. Export users (pour re-hashing passwords)
psql -U akig -d akig_db -c "COPY users TO '/tmp/users_export.csv' CSV HEADER;"
```

### Vérification système actuel

```bash
# Versions installées
node --version  # Doit être 18.20.3
psql --version  # Doit être PostgreSQL 15

# État de la DB
psql -U akig -d akig_db -c "SELECT COUNT(*) FROM users;"
psql -U akig -d akig_db -c "SELECT COUNT(*) FROM tenants;"
psql -U akig -d akig_db -c "SELECT COUNT(*) FROM contracts;"
psql -U akig -d akig_db -c "SELECT COUNT(*) FROM payments;"

# Sauvegarder les résultats pour validation post-migration
```

---

## 🔧 Migration Backend: Express → NestJS

### Étape 1: Installation environnement v3

```bash
# 1. Installation Node 22
nvm install 22.11.0
nvm use 22.11.0

# 2. Installation pnpm
npm install -g pnpm@9.14.2

# 3. Clone AKIG v3
git clone https://github.com/akig-corp/akig-v3.git
cd akig-v3

# 4. Installation dépendances
pnpm install
```

### Étape 2: Migration base de données

```bash
# 1. Restaurer dump v2 dans nouvelle DB
createdb -U postgres akig_v3
psql -U postgres -d akig_v3 < backup_v2_YYYYMMDD.sql

# 2. Activer extensions TimescaleDB
psql -U postgres -d akig_v3 -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
psql -U postgres -d akig_v3 -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 3. Générer Prisma schema depuis DB existante
cd apps/api
pnpm prisma db pull
pnpm prisma generate

# 4. Créer migration initiale
pnpm prisma migrate dev --name init_from_v2

# 5. Appliquer migrations supplémentaires v3
pnpm db:migrate:deploy
```

### Étape 3: Migration données sensibles

#### Re-hashing passwords (bcrypt → Argon2id)

Créer script `scripts/rehash-passwords.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';

const prisma = new PrismaClient();

async function rehashPasswords() {
  const users = [];
  
  // Lire export CSV des users v2
  fs.createReadStream('/tmp/users_export.csv')
    .pipe(csvParser())
    .on('data', (row) => users.push(row))
    .on('end', async () => {
      console.log(`🔐 Re-hashing ${users.length} passwords...`);
      
      for (const user of users) {
        try {
          // Vérifier que le hash bcrypt est valide
          const isValidBcrypt = user.password_hash.startsWith('$2b$');
          
          if (!isValidBcrypt) {
            console.warn(`⚠️  User ${user.email}: Invalid bcrypt hash, skipping`);
            continue;
          }
          
          // Générer nouveau hash Argon2id
          // Note: On ne peut pas "décrypter" bcrypt, donc on force un reset password
          const temporaryPassword = Math.random().toString(36).substring(2, 15);
          const newHash = await argon2.hash(temporaryPassword, {
            type: argon2.argon2id,
            memoryCost: 65536, // 64 MB
            timeCost: 3,
            parallelism: 4,
          });
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordHash: newHash,
              // Forcer reset password au premier login
              metadata: {
                ...user.metadata,
                forcePasswordReset: true,
                migrationDate: new Date().toISOString(),
              },
            },
          });
          
          console.log(`✅ User ${user.email}: Password re-hashed`);
          
          // Envoyer email reset password
          // await sendPasswordResetEmail(user.email, temporaryPassword);
          
        } catch (error) {
          console.error(`❌ User ${user.email}: Error -`, error.message);
        }
      }
      
      console.log('✅ Password re-hashing complete');
      await prisma.$disconnect();
    });
}

rehashPasswords();
```

Exécution:

```bash
cd scripts
pnpm ts-node rehash-passwords.ts
```

#### Migration sessions JWT

Les tokens JWT v2 (RS256) ne sont **pas compatibles** avec v3 (EdDSA). Solution:

```bash
# Invalider toutes les sessions v2
psql -U akig -d akig_v3 -c "DELETE FROM sessions WHERE created_at < NOW();"

# Les users devront se reconnecter avec nouveaux tokens EdDSA
```

### Étape 4: Migration routes Express → NestJS

Mapping automatique (script fourni):

```bash
node scripts/migrate-routes-to-nestjs.js \
  --source=../akig-v2/backend/src/routes \
  --target=./apps/api/src
```

Vérifications manuelles requises:
- ✅ Middleware customs
- ✅ Guards RBAC
- ✅ Exception filters
- ✅ Interceptors

---

## 🎨 Migration Frontend: React + Vite → Next.js 15

### Étape 1: Analyse pages React v2

```bash
# Lister toutes les pages React
find ../akig-v2/frontend/src/pages -name "*.jsx" -o -name "*.tsx"
```

### Étape 2: Migration manuelle (pas d'outil automatique)

Pour chaque page React v2, créer équivalent Next.js v3:

**Exemple: Dashboard.jsx → app/dashboard/page.tsx**

v2 (React + React Router):
```jsx
// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    axios.get('/api/dashboard/kpis')
      .then(res => setKpis(res.data))
      .catch(err => console.error(err));
  }, []);
  
  return (
    <div>
      <h1>Dashboard</h1>
      {kpis && <KPIGrid data={kpis} />}
    </div>
  );
}
```

v3 (Next.js App Router + Server Components):
```typescript
// app/dashboard/page.tsx
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { KPIGrid } from '@/components/features/kpi-grid';

export const metadata: Metadata = {
  title: 'Dashboard | AKIG v3',
};

async function getKPIs() {
  const cookieStore = await cookies();
  const token = cookieStore.get('akig-token')?.value;
  
  const res = await fetch(`${process.env.API_URL}/api/v1/dashboard/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 }, // Cache 30s
  });
  
  if (!res.ok) throw new Error('Failed to fetch KPIs');
  return res.json();
}

export default async function DashboardPage() {
  const kpis = await getKPIs();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <KPIGrid data={kpis} />
    </div>
  );
}
```

### Étape 3: Migration state management

**Jotai → Zustand**

v2:
```typescript
// atoms.ts
import { atom } from 'jotai';

export const userAtom = atom(null);
export const themeAtom = atom('light');
```

v3:
```typescript
// lib/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'akig-auth' }
  )
);
```

### Étape 4: Migration API calls

**axios → API Client typé**

v2:
```typescript
import axios from 'axios';

const response = await axios.get('/api/tenants');
const tenants = response.data;
```

v3:
```typescript
import { apiClient } from '@/lib/api-client';
import { Tenant } from '@/types';

const tenants = await apiClient.get<Tenant[]>('/api/v1/tenants');
```

---

## ✅ Validation Post-Migration

### Checklist données

```bash
# Comparer counts v2 vs v3
echo "Users:"
psql -U akig -d akig_v2 -t -c "SELECT COUNT(*) FROM users;"
psql -U akig -d akig_v3 -t -c "SELECT COUNT(*) FROM users;"

echo "Tenants:"
psql -U akig -d akig_v2 -t -c "SELECT COUNT(*) FROM tenants;"
psql -U akig -d akig_v3 -t -c "SELECT COUNT(*) FROM tenants;"

echo "Contracts:"
psql -U akig -d akig_v2 -t -c "SELECT COUNT(*) FROM contracts;"
psql -U akig -d akig_v3 -t -c "SELECT COUNT(*) FROM contracts;"

echo "Payments:"
psql -U akig -d akig_v2 -t -c "SELECT COUNT(*) FROM payments;"
psql -U akig -d akig_v3 -t -c "SELECT COUNT(*) FROM payments;"
```

### Tests fonctionnels

```bash
# 1. Tests unitaires
pnpm --filter @akig/api test:ci

# 2. Tests E2E critiques
pnpm --filter @akig/web test:e2e --grep "login|payment|contract"

# 3. Tests manuels
# - Créer un locataire
# - Créer un contrat
# - Enregistrer un paiement
# - Générer un reçu PDF
# - Exporter rapport Excel
```

### Performance

```bash
# Load test avec k6
k6 run --vus 100 --duration 30s k6/scenarios/payment-load-test.js

# Objectifs:
# - p95 < 200ms
# - p99 < 500ms
# - Error rate < 0.1%
```

---

## 🔙 Plan de Rollback

En cas de problème critique:

### Option 1: Rollback partiel (DB seulement)

```bash
# 1. Stop v3
docker compose down

# 2. Restaurer DB v2
psql -U postgres -d postgres -c "DROP DATABASE akig_v3;"
psql -U postgres -d postgres -c "CREATE DATABASE akig_v2;"
psql -U postgres -d akig_v2 < backup_v2_YYYYMMDD.sql

# 3. Redémarrer v2
cd ../akig-v2
docker compose up -d
```

### Option 2: Rollback complet

```bash
# Utiliser script automatique
./scripts/rollback-to-v2.sh --backup-date=YYYYMMDD
```

---

## 📞 Support Migration

En cas de difficulté:

- 📧 Email: migration-support@akig.gn
- 💬 Slack: #migration-v3
- 🎫 Ticket: support.akig.gn

---

## ⏱️ Timeline Recommandée

| Phase | Durée | Description |
|-------|-------|-------------|
| **Préparation** | 1 semaine | Backups, tests v2, formation équipe |
| **Migration Dev** | 2 semaines | Setup v3, migration DB, tests |
| **Migration Staging** | 1 semaine | Tests E2E, validation users |
| **Migration Prod** | 1 jour | Downtime 2-4h, validation |
| **Monitoring Post-Migration** | 1 semaine | Suivi métriques, corrections bugs |

**Total estimé: 5-6 semaines**
