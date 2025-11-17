# 🔄 Workflows de Sauvegarde AKIG

Documentation complète des workflows GitHub Actions pour la gestion des sauvegardes et restaurations.

## 📅 Calendrier des Exécutions

| Workflow | Horaire | Jour | Description |
|----------|---------|------|-------------|
| **daily-backup.yml** | 02:00 UTC | Chaque jour | Sauvegarde quotidienne compressée |
| **restore-test.yml** | 03:00 UTC | Dimanche | Test de restauration hebdomadaire |
| **backup-integrity-check.yml** | 04:00 UTC | Chaque jour | Vérification d'intégrité des sauvegardes |

## 🔧 Configuration

### Variables d'Environnement

```yaml
PG_HOST: localhost
PG_PORT: 5432
PG_USER: postgres
PG_DATABASE: akig
```

### Secrets GitHub (Optionnels)

```
PG_PASSWORD          # Mot de passe PostgreSQL
AWS_ACCESS_KEY_ID    # Pour S3
AWS_SECRET_ACCESS_KEY
AWS_BUCKET           # Bucket S3 pour les backups
```

## 📤 Sauvegarde Quotidienne (`daily-backup.yml`)

### ✨ Fonctionnalités

- ✅ Sauvegarde automatique chaque jour à 02:00 UTC
- ✅ Compression gzip niveau 9
- ✅ Génération de métadonnées (checksum MD5)
- ✅ Upload optionnel vers S3
- ✅ Conservation des artefacts GitHub 90 jours
- ✅ Résumé automatique

### 🔄 Étapes

1. **Récupération du code** - Clone du repository
2. **Création de la sauvegarde** - `pg_dump` avec compression
3. **Génération du checksum** - MD5 pour validation
4. **Création des métadonnées** - JSON avec infos backup
5. **Upload S3** - Si configuré
6. **Artefact GitHub** - Pour la rétention
7. **Résumé** - Affichage dans les actions

### 📊 Exemple de Résumé

```
✅ Sauvegarde Quotidienne Réussie

| Propriété | Valeur |
|-----------|--------|
| Fichier | backups/2024-01-15.dump |
| Taille | 45.2M |
| Checksum MD5 | a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 |
| Horodatage | 2024-01-15T02:00:00Z |
| Statut | ✅ Succès |
```

### 🚀 Utilisation

```bash
# Déclencher manuellement
# Via l'interface GitHub Actions → restore-test → Run workflow

# Ou via CLI
gh workflow run daily-backup.yml
```

## 🧪 Test de Restauration Hebdomadaire (`restore-test.yml`)

### ✨ Fonctionnalités

- ✅ Test complet de restauration le dimanche
- ✅ 8 étapes de validation des données
- ✅ Tests de performance
- ✅ Vérification d'intégrité référentielle
- ✅ Rapport détaillé généré
- ✅ Nettoyage automatique après test

### 🧪 Tests Exécutés

1. **Sauvegarde** - Création d'une nouvelle sauvegarde
2. **Validation sauvegarde** - Vérification du fichier
3. **Restauration** - Importation dans base de test
4. **Comptage données** - Utilisateurs, contrats, paiements, factures
5. **Intégrité référentielle** - Vérification des clés étrangères
6. **Données spécifiques** - Vérification d'enregistrements
7. **Sommes** - Agrégations (totaux paiements, etc.)
8. **Index** - Vérification des index présents
9. **Performance** - Tests de vitesse de requête

### 📋 Structure des Données Testées

```sql
-- Schéma créé automatiquement
users (id, email, password_hash, name, role, created_at, last_login)
contracts (id, user_id, property_name, tenant_name, start_date, end_date, monthly_rent)
payments (id, contract_id, amount, paid_at, method)
invoices (id, contract_id, amount, due_date, status)
```

### 📊 Données de Test Insérées

```
3 utilisateurs
3 contrats
4 paiements
4 factures
```

### 🔍 Validation Effectuée

- Comptage des lignes
- Vérification des jointures
- Recherche par email
- Sommes agrégées
- Vérification des index

### 📈 Rapport Généré

```markdown
## ✅ Rapport de Test de Restauration

**Date:** ...
**Sauvegarde:** backups/test_20240115_020000.dump
**MD5:** a1b2c3d4e5f6...
**Base restaurée:** akig_restore_test

### Résultats des Tests

| Élément | Résultat |
|---------|----------|
| Sauvegarde créée | ✅ |
| Sauvegarde valide | ✅ |
| Restauration | ✅ |
| Données intactes | ✅ |
| Index présents | ✅ |
| Performance | ✅ |
```

### 🚀 Utilisation

```bash
# Exécution manuelle
gh workflow run restore-test.yml

# Avec fichier de sauvegarde spécifique
gh workflow run restore-test.yml -f backup_file=backups/2024-01-10.dump
```

## 🔍 Vérification d'Intégrité (`backup-integrity-check.yml`)

### ✨ Fonctionnalités

- ✅ Vérification quotidienne à 04:00 UTC
- ✅ Recherche des fichiers de sauvegarde
- ✅ Analyse des tailles
- ✅ Vérification des checksums
- ✅ Alerte si pas de sauvegarde récente
- ✅ Vérification de l'espace disque
- ✅ Rapport détaillé

### 🔍 Vérifications

1. **Présence des sauvegardes** - Fichiers .dump trouvés
2. **Métadonnées** - Fichiers .meta présents
3. **Taille** - Taille de chaque sauvegarde
4. **Espace disque** - Alerte si > 90%
5. **Récence** - Au moins une sauvegarde < 26h

### ⚠️ Alertes

- ❌ Aucune sauvegarde dans les 26 heures
- ❌ Utilisation disque > 90%
- ⚠️ Métadonnées manquantes

## 🔐 Configuration S3 (Optionnel)

Pour activer le backup vers Amazon S3:

1. Créer un bucket S3 `akig-backups`
2. Générer des credentials AWS
3. Ajouter les secrets GitHub:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_BUCKET`

```yaml
# Dans daily-backup.yml, décommentez:
- name: ☁️ Télécharger vers S3
  if: secrets.AWS_ACCESS_KEY_ID != ''
```

## 📊 Artefacts Générés

### Dans GitHub Actions

Tous les workflows génèrent des artefacts conservés:

- **daily-backup.yml**
  - `{date}.dump` (90 jours)
  - `{date}.dump.meta` (90 jours)

- **restore-test.yml**
  - `restore_report.md` (30 jours)
  - Fichiers de sauvegarde de test

- **backup-integrity-check.yml**
  - `integrity-report.md` (30 jours)

### Accès aux Artefacts

```bash
# Via CLI
gh run download <run-id> -n daily-backup-<id>

# Via Web: Actions → Workflow Run → Artifacts
```

## 📈 Monitoring

### Vérifier l'État

```bash
# Lister les workflows
gh workflow list

# Voir les runs récents
gh run list --workflow=daily-backup.yml

# Détails d'une exécution
gh run view <run-id>

# Voir les logs
gh run view <run-id> --log
```

### Historique d'Exécution

```bash
# 10 derniers runs de backup quotidien
gh run list --workflow=daily-backup.yml --limit 10

# Filtrer par statut
gh run list --workflow=daily-backup.yml --status success --limit 5
gh run list --workflow=daily-backup.yml --status failure --limit 5
```

## 🚨 Troubleshooting

### Le workflow n'a pas exécuté

**Cause:** Les workflows programmés ont besoin d'activité récente sur la branche `main`

**Solution:**
```bash
# Faire un commit ou pull
git commit --allow-empty -m "trigger backup"
git push origin main
```

### Erreur de connexion PostgreSQL

**Cause:** Service PostgreSQL non disponible

**Vérifier:** Que `services.postgres` est correctement configuré dans le workflow

### Erreur S3

**Cause:** Credentials AWS invalides

**Vérifier:** Les secrets `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY`

### Espace disque insuffisant

**Solution:** Augmenter la rétention des artefacts ou supprimer les anciens

## 🔄 Combinaison avec Local Scheduling

Pour un système robuste, combinez:

```bash
# Workflows GitHub (cloud)
✅ Sauvegarde quotidienne (02:00)
✅ Test hebdomadaire (dimanche 03:00)
✅ Vérification d'intégrité (04:00)

# Cron local (optionnel, comme secours)
0 2 * * * /opt/akig/ops/backup/restore_backup.sh backup
0 3 * * 0 /opt/akig/ops/backup/restore_test.sh
0 1 * * 1 /opt/akig/ops/backup/restore_backup.sh cleanup
```

## 📞 Support

Pour des questions ou issues:

1. Vérifier les logs du workflow
2. Consulter la documentation locale: `ops/backup/README.md`
3. Tester manuellement: `./restore_backup.sh verify`
