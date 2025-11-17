# 🔄 GUIDE COMPLET D'IMPORT DES DONNÉES LEGACY - AKIG

## 📋 Vue d'ensemble

Ce système ultra-professionnel permet d'importer automatiquement toutes vos données de l'ancien logiciel (loyers, paiements, immeubles, locataires, contrats, etc.) vers le nouveau système AKIG.

**Processus en 3 étapes** :
1. **Analyse** : Détecte automatiquement le format et catégorise les données
2. **Validation** : Vérifie la qualité, nettoie et transforme les données
3. **Import** : Importe dans PostgreSQL avec gestion d'erreurs et rollback

---

## 🎯 Formats Supportés

Le système détecte automatiquement et traite :

| Format | Extension | Description |
|--------|-----------|-------------|
| **SQL Dump** | `.sql` | Export PostgreSQL/MySQL standard |
| **SQLite** | `.db`, `.sqlite`, `.sqlite3` | Base SQLite |
| **JSON** | `.json` | Export JSON structuré |
| **CSV** | `.csv` | Fichiers CSV (détection auto du délimiteur) |
| **Excel** | `.xls`, `.xlsx` | Classeurs Excel |
| **Archive** | `.zip`, `.tar`, `.gz` | Archives compressées |
| **Répertoire** | Dossier | Collection de fichiers |

---

## 📦 Installation des Dépendances

```powershell
# Aller dans le répertoire du projet
cd c:\AKIG

# Installer les dépendances Python
pip install psycopg2-binary

# Les autres dépendances sont natives Python 3
```

---

## 🚀 ÉTAPE 1 : Analyse de l'Archive

### Placer votre archive

Copiez votre fichier de sauvegarde dans le projet :

```powershell
# Exemple : copier votre backup
copy "C:\Mes Documents\backup_ancien_logiciel.sql" "c:\AKIG\data\legacy-backup.sql"
```

### Lancer l'analyse

```powershell
# Analyser l'archive
python scripts/legacy-import/analyze-archive.py data/legacy-backup.sql
```

**Ce que fait l'analyseur** :
- ✅ Détecte automatiquement le format
- ✅ Identifie les tables/collections
- ✅ Compte les enregistrements par catégorie
- ✅ Extrait des échantillons de données
- ✅ Génère un rapport JSON détaillé

### Résultat

Un fichier `analysis-report.json` est créé dans `scripts/legacy-import/` :

```json
{
  "format": "sql",
  "categories": {
    "proprietaires": {"count": 155, "sample": [...]},
    "immeubles": {"count": 89, "sample": [...]},
    "locaux": {"count": 342, "sample": [...]},
    "locataires": {"count": 1200, "sample": [...]},
    "contrats": {"count": 856, "sample": [...]},
    "paiements": {"count": 15430, "sample": [...]}
  },
  "statistics": {
    "total_inserts": 18072,
    "tables": {...}
  }
}
```

---

## 🏷️ ÉTAPE 2 : Catégorisation et Validation

### Lancer la validation

```powershell
# Catégoriser et valider les données
python scripts/legacy-import/categorize-data.py scripts/legacy-import/analysis-report.json
```

**Ce que fait le catégoriseur** :
- ✅ Valide tous les champs requis
- ✅ Vérifie les formats (emails, téléphones, dates)
- ✅ Valide les montants (positifs, format numérique)
- ✅ Vérifie les contraintes FK (références entre tables)
- ✅ Transforme vers le nouveau schéma
- ✅ Génère des fichiers JSON propres par catégorie

### Règles de Validation

#### Propriétaires
- **Requis** : `nom`, `contact`
- **Optionnels** : `email`, `telephone`, `adresse`
- **Validations** : Format email, format téléphone

#### Immeubles
- **Requis** : `nom`, `adresse`
- **Optionnels** : `proprietaire_id`, `ville`
- **FK** : `proprietaire_id` → `proprietaires`

#### Locaux (Propriétés)
- **Requis** : `nom`, `type`
- **Optionnels** : `surface`, `pieces`, `immeuble_id`
- **FK** : `immeuble_id` → `immeubles`
- **Types valides** : appartement, maison, bureau, commerce

#### Locataires
- **Requis** : `prenom`, `nom`
- **Optionnels** : `email`, `telephone`, `adresse`
- **Validations** : Format email, format téléphone

#### Contrats
- **Requis** : `local_id`, `locataire_id`, `date_debut`, `loyer`
- **Optionnels** : `date_fin`, `charges`, `depot_garantie`
- **FK** : `local_id` → `locaux`, `locataire_id` → `locataires`
- **Validations** : Dates valides, montants positifs

#### Paiements
- **Requis** : `contrat_id`, `montant`, `date`
- **Optionnels** : `methode`, `reference`
- **FK** : `contrat_id` → `contrats`
- **Méthodes valides** : especes, cheque, virement, carte, mobile_money

### Résultat

Fichiers JSON validés dans `scripts/legacy-import/categorized-data/` :
```
categorized-data/
├── proprietaires.json      # Propriétaires validés
├── immeubles.json          # Immeubles validés
├── locaux.json             # Locaux/propriétés validés
├── locataires.json         # Locataires validés
├── contrats.json           # Contrats validés
├── paiements.json          # Paiements validés
└── charges.json            # Charges validées
```

Rapport de validation `validation-report.json` :
```json
{
  "total_records": 18072,
  "valid_records": 17856,
  "invalid_records": 216,
  "warnings_count": 342,
  "by_category": {
    "proprietaires": {"total": 155, "valid": 153, "invalid": 2},
    "contrats": {"total": 856, "valid": 842, "invalid": 14},
    ...
  }
}
```

---

## 💾 ÉTAPE 3 : Import dans PostgreSQL

### Préparer la base de données

```powershell
# S'assurer que PostgreSQL est lancé
# Vérifier que les tables existent (migrations exécutées)
```

### Mode DRY-RUN (test sans modification)

**RECOMMANDÉ** : Testez d'abord sans rien modifier :

```powershell
python scripts/legacy-import/import-to-postgres.py `
  "postgresql://akig_user:your_password@localhost:5432/akig_db" `
  "scripts/legacy-import/categorized-data" `
  --dry-run
```

Cela simule l'import et affiche :
- ✅ Les requêtes SQL qui seraient exécutées
- ✅ Le nombre d'enregistrements par table
- ✅ Les erreurs potentielles

### Import RÉEL

Une fois satisfait du dry-run :

```powershell
python scripts/legacy-import/import-to-postgres.py `
  "postgresql://akig_user:your_password@localhost:5432/akig_db" `
  "scripts/legacy-import/categorized-data"
```

**Ordre d'import (respecte les FK)** :
1. `proprietaires` → `owners`
2. `immeubles` → `sites`
3. `locaux` → `properties`
4. `locataires` → `tenants`
5. `contrats` → `contracts`
6. `loyers` → `rent_payments`
7. `paiements` → `payments`
8. `charges` → `charges`

**Sécurités** :
- ✅ Transactions atomiques (tout ou rien)
- ✅ Rollback automatique en cas d'erreur
- ✅ Import par batch (100 records à la fois)
- ✅ Gestion des doublons (ON CONFLICT DO UPDATE)
- ✅ Logs détaillés de chaque opération

### Résultat

Rapport d'import `import-report.json` :
```json
{
  "imported": {
    "proprietaires": {"table": "owners", "count": 153, "errors": 0},
    "immeubles": {"table": "sites", "count": 87, "errors": 0},
    "locaux": {"table": "properties", "count": 338, "errors": 4},
    "locataires": {"table": "tenants", "count": 1198, "errors": 2},
    "contrats": {"table": "contracts", "count": 842, "errors": 0},
    "paiements": {"table": "payments", "count": 15234, "errors": 196}
  }
}
```

---

## 🎯 Workflow Complet - Exemple Réel

### Cas d'usage : Backup SQL de l'ancien système

```powershell
# 1. Vous avez un fichier backup_immobilier.sql

# 2. Analyser
python scripts/legacy-import/analyze-archive.py data/backup_immobilier.sql
# ✅ Résultat : 6 catégories trouvées, 18K enregistrements

# 3. Valider et catégoriser
python scripts/legacy-import/categorize-data.py scripts/legacy-import/analysis-report.json
# ✅ Résultat : 17.8K valides, 200 invalides, 342 warnings

# 4. Vérifier les fichiers JSON générés
ls scripts/legacy-import/categorized-data/
# proprietaires.json, immeubles.json, locaux.json, ...

# 5. Test d'import (DRY-RUN)
python scripts/legacy-import/import-to-postgres.py `
  $env:DATABASE_URL `
  "scripts/legacy-import/categorized-data" `
  --dry-run
# ✅ Vérifie que tout fonctionne sans modifier la base

# 6. Import RÉEL
python scripts/legacy-import/import-to-postgres.py `
  $env:DATABASE_URL `
  "scripts/legacy-import/categorized-data"
# ✅ 17.8K enregistrements importés avec succès !

# 7. Vérifier dans la base
psql -U akig_user -d akig_db -c "SELECT COUNT(*) FROM owners"
psql -U akig_user -d akig_db -c "SELECT COUNT(*) FROM contracts"
```

---

## 🔧 Mapping des Champs

### Propriétaires (owners)

| Ancien champ | Nouveau champ | Type |
|--------------|---------------|------|
| `id` | `id` | INTEGER |
| `nom` | `company_name` | VARCHAR |
| `contact` | `contact_name` | VARCHAR |
| `email` | `email` | VARCHAR |
| `telephone` | `phone` | VARCHAR |
| `adresse` | `address` | TEXT |

### Immeubles (sites)

| Ancien champ | Nouveau champ | Type |
|--------------|---------------|------|
| `id` | `id` | INTEGER |
| `nom` | `name` | VARCHAR |
| `adresse` | `address` | TEXT |
| `proprietaire_id` | `owner_id` | INTEGER (FK) |

### Locaux (properties)

| Ancien champ | Nouveau champ | Type |
|--------------|---------------|------|
| `id` | `id` | INTEGER |
| `nom` | `name` | VARCHAR |
| `type` | `type` | VARCHAR |
| `surface` | `surface_area` | DECIMAL |
| `pieces` | `rooms` | INTEGER |
| `immeuble_id` | `site_id` | INTEGER (FK) |

### Contrats (contracts)

| Ancien champ | Nouveau champ | Type |
|--------------|---------------|------|
| `id` | `id` | INTEGER |
| `local_id` | `property_id` | INTEGER (FK) |
| `locataire_id` | `tenant_id` | INTEGER (FK) |
| `date_debut` | `start_date` | DATE |
| `date_fin` | `end_date` | DATE |
| `loyer` | `rent_amount` | DECIMAL |
| `depot_garantie` | `security_deposit` | DECIMAL |

### Paiements (payments)

| Ancien champ | Nouveau champ | Type |
|--------------|---------------|------|
| `id` | `id` | INTEGER |
| `contrat_id` | `contract_id` | INTEGER (FK) |
| `montant` | `amount` | DECIMAL |
| `date` | `payment_date` | DATE |
| `methode` | `payment_method` | VARCHAR |

---

## ⚠️ Gestion des Erreurs

### Erreurs Communes

#### 1. Table manquante
```
❌ Table manquante: owners
```
**Solution** : Exécuter les migrations avant l'import
```powershell
psql -U akig_user -d akig_db -f backend/db/migrations/001_create_property_management.sql
```

#### 2. Contrainte FK violée
```
❌ Référence FK introuvable: proprietaire_id = 999
```
**Solution** : Le catégoriseur signale ces problèmes dans les warnings. Corriger les données ou importer d'abord les parents.

#### 3. Format de données invalide
```
⚠️ Format email invalide: contact@incomplete
⚠️ Montant négatif: loyer = -500
```
**Solution** : Les warnings sont dans `validation-report.json`. Corriger manuellement les données sources ou accepter les avertissements.

#### 4. Doublons
```
ON CONFLICT (id) DO UPDATE
```
**Solution** : Le système gère automatiquement les doublons en mettant à jour les enregistrements existants.

---

## 📊 Vérification Post-Import

### Vérifier les comptages

```sql
-- Compter les enregistrements par table
SELECT 'owners' AS table_name, COUNT(*) FROM owners
UNION ALL
SELECT 'sites', COUNT(*) FROM sites
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
```

### Vérifier les relations FK

```sql
-- Vérifier les sites sans propriétaire
SELECT * FROM sites WHERE owner_id NOT IN (SELECT id FROM owners);

-- Vérifier les contrats orphelins
SELECT * FROM contracts 
WHERE property_id NOT IN (SELECT id FROM properties)
   OR tenant_id NOT IN (SELECT id FROM tenants);
```

### Vérifier les données

```sql
-- Top 10 propriétaires par nombre de sites
SELECT o.company_name, COUNT(s.id) AS nb_sites
FROM owners o
LEFT JOIN sites s ON s.owner_id = o.id
GROUP BY o.id, o.company_name
ORDER BY nb_sites DESC
LIMIT 10;

-- Total paiements par contrat
SELECT c.id, t.first_name, t.last_name, 
       COUNT(p.id) AS nb_paiements,
       SUM(p.amount) AS total_paye
FROM contracts c
JOIN tenants t ON t.id = c.tenant_id
LEFT JOIN payments p ON p.contract_id = c.id
GROUP BY c.id, t.first_name, t.last_name
ORDER BY total_paye DESC
LIMIT 20;
```

---

## 🎓 Cas d'Usage Avancés

### Import de plusieurs fichiers CSV

```powershell
# Analyser un répertoire de CSV
python scripts/legacy-import/analyze-archive.py data/csv-exports/

# Le reste est identique
```

### Import d'une base SQLite

```powershell
# Analyser directement une DB SQLite
python scripts/legacy-import/analyze-archive.py data/ancien_systeme.sqlite

# Continuer normalement
```

### Import incrémental (ajouts uniquement)

Modifier `import-to-postgres.py` ligne ~150 :
```python
# Changer ON CONFLICT DO UPDATE en ON CONFLICT DO NOTHING
ON CONFLICT (id) DO NOTHING
```

---

## 🆘 Support et Troubleshooting

### Activer les logs détaillés

Modifier les scripts pour ajouter plus de debug :
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Sauvegarder avant import

```powershell
# Backup de la base avant import
pg_dump -U akig_user akig_db > backup_avant_import.sql
```

### Restaurer en cas de problème

```powershell
# Restaurer le backup
psql -U akig_user akig_db < backup_avant_import.sql
```

---

## ✅ Checklist Complète

- [ ] Archive legacy placée dans `c:\AKIG\data/`
- [ ] Dépendances Python installées (`pip install psycopg2-binary`)
- [ ] PostgreSQL lancé et accessible
- [ ] Migrations exécutées (tables créées)
- [ ] Étape 1 : Analyse terminée → `analysis-report.json` généré
- [ ] Étape 2 : Validation terminée → fichiers JSON catégorisés
- [ ] Rapport de validation vérifié (taux de succès > 95%)
- [ ] Étape 3a : Dry-run import réussi
- [ ] Backup de la base créé
- [ ] Étape 3b : Import réel terminé
- [ ] Vérification comptages SQL
- [ ] Vérification relations FK
- [ ] Tests application avec nouvelles données
- [ ] Archive import dans le système de backup

---

## 🎉 Félicitations !

Vos données legacy sont maintenant dans le nouveau système AKIG !

**Prochaines étapes** :
1. Tester toutes les fonctionnalités avec les données réelles
2. Former les utilisateurs sur la nouvelle interface
3. Archiver l'ancien système (garder en lecture seule pendant 6 mois)
4. Monitorer les performances avec les données de production

---

**Besoin d'aide ?** Consultez les rapports JSON générés ou contactez le support technique.
