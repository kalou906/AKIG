# Migration Workflows Documentation

## Overview

Two complementary GitHub Actions workflows manage database migrations:

1. **`migration-check.yml`** - Validates migrations before deployment
2. **`migration-deploy.yml`** - Deploys migrations to target environment

## Table of Contents

1. [Migration Check Workflow](#migration-check-workflow)
2. [Migration Deploy Workflow](#migration-deploy-workflow)
3. [Environment Setup](#environment-setup)
4. [Usage](#usage)
5. [Best Practices](#best-practices)

---

## Migration Check Workflow

### Purpose

Automatically validates all migration files and tests them on a PostgreSQL test database.

### Workflow: `migration-check.yml`

**Trigger:** Manual (`workflow_dispatch`)

**Environment Setup:**
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        options: [staging, production]
      dry_run:
        description: 'Perform dry run'
        type: boolean
        default: true
```

### Stages

#### Stage 1: Validate Migration Files
- Counts migration files in `ops/migrations/sql/`
- Lists all migrations
- Validates SQL syntax (BEGIN/COMMIT wrapper)
- Checks naming convention (NNN_description.sql)

**Output:**
```
Found 3 migration files
✓ Checking: 001_create_users_table.sql
  ✓ Contains BEGIN/COMMIT
✓ All migrations follow naming convention
```

#### Stage 2: Check Database Connection
- Spins up test PostgreSQL 15 container
- Tests connection with test credentials
- Creates migrations tracking table

**Output:**
```
✓ Database connection successful
✓ Query executed: 2024-10-25T12:00:00.000Z
✓ Migrations table created
```

#### Stage 3: Test Migrations
- Runs all pending migrations on test database
- Verifies migration completion
- Checks data integrity (constraints, tables)

**Output:**
```
→ Running migration: 001_create_users_table.sql
✓ Migration completed: 001_create_users_table.sql
✓ 1 migrations applied
✓ Tables created: users, contracts
✓ Constraints validated: 5 constraints found
```

#### Stage 4: Performance Check
- Validates all indexes were created
- Checks table statistics

**Output:**
```
✓ Indexes created:
  - users.idx_users_email
  - users.idx_users_role
  - contracts.idx_contracts_user_id
✓ Table statistics:
  - users: 0 rows
  - contracts: 0 rows
```

#### Stage 5: Reporting
- Generates migration report
- Uploads artifact
- Posts to Slack on failure

### Running Migration Check

```bash
# Via GitHub UI
# 1. Go to Actions → Migration Check
# 2. Click "Run workflow"
# 3. Select inputs (optional)
# 4. Click "Run workflow"

# Via GitHub CLI
gh workflow run migration-check.yml -f environment=staging -f dry_run=true
```

### Outputs

- **Artifact**: `migration-report` - Markdown report of validation results
- **Slack Alert**: Posted if any stage fails
- **Exit Code**: 0 = success, 1 = failure

---

## Migration Deploy Workflow

### Purpose

Safely deploys validated migrations to staging or production environments.

### Workflow: `migration-deploy.yml`

**Trigger:** Manual (`workflow_dispatch`)

**Required Inputs:**
```yaml
environment:           # staging or production (required)
migrations:           # Specific migration or leave empty for all pending
dry_run:             # true = no changes, false = apply changes
```

### Stages

#### Stage 1: Approval (Production Only)
- Requires manual approval for production deployments
- Uses GitHub Environments for RBAC

#### Stage 2: Pre-Deployment
- Creates database backup
- Checks database health
- Verifies connectivity

**Output:**
```
Creating database backup...
Backup file would be: backup_20251025_120000.sql
✓ Database is healthy
✓ Backup completed
```

#### Stage 3: Deployment
- Shows migration plan
- Performs dry run (if enabled)
- Applies migrations (if dry_run=false)

**Dry Run Output:**
```
Migration Plan for: production

Available migrations:
  - 001_create_users_table.sql
  - 002_create_contracts_table.sql
  - 003_create_audit_log_table.sql
```

**Actual Deployment Output:**
```
Applying migrations to production...

→ Running migration: 001_create_users_table.sql
✓ Migration completed: 001_create_users_table.sql

→ Running migration: 002_create_contracts_table.sql
✓ Migration completed: 002_create_contracts_table.sql

✓ Completed: 2 applied, 0 failed
```

#### Stage 4: Post-Deployment Validation
- Validates database integrity
- Checks application health
- Retries health check with backoff

**Output:**
```
Validating database integrity...
✓ Database connection successful
✓ 3 migrations applied
✓ 12 constraints validated
✓ API health check passed
```

#### Stage 5: Notifications
- Posts success/failure to Slack
- Creates GitHub Issue on production failure

### Running Migration Deploy

```bash
# Via GitHub UI
# 1. Go to Actions → Deploy Migrations
# 2. Click "Run workflow"
# 3. Select environment (required)
# 4. Set dry_run (default: true)
# 5. Click "Run workflow"

# Via GitHub CLI
gh workflow run migration-deploy.yml \
  -f environment=production \
  -f dry_run=false

# Run specific migration
gh workflow run migration-deploy.yml \
  -f environment=staging \
  -f migrations="001_create_users_table.sql" \
  -f dry_run=false
```

### Approval Process (Production)

Production deployments require manual approval:

1. Workflow runs pre-deployment stage
2. Waits for approval (GitHub Environments)
3. Approver receives notification
4. On approval, deployment proceeds
5. Validation and notification follow

**To approve:**
```
GitHub → Actions → Migration Deploy run → Review deployments
```

---

## Environment Setup

### GitHub Secrets Required

```bash
# Database URLs (required for both environments)
DATABASE_URL_staging      # PostgreSQL connection string for staging
DATABASE_URL_production   # PostgreSQL connection string for production

# API URLs (optional, for health checks)
API_URL_staging          # http://staging-api.example.com
API_URL_production       # https://api.example.com

# Notifications (optional)
SLACK_WEBHOOK_URL        # Slack webhook for notifications
```

### Setting Secrets

```bash
# Via GitHub CLI
gh secret set DATABASE_URL_staging --body "postgresql://user:pass@host/db"
gh secret set DATABASE_URL_production --body "postgresql://user:pass@host/db"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."

# Or via GitHub UI
# Settings → Secrets and variables → Actions → New repository secret
```

### GitHub Environments (Optional)

For additional production safety:

```bash
# Create production environment in GitHub
# Settings → Environments → New environment
# Name: production
# Required reviewers: [list of teams/users]
# Deployment branches: main
```

---

## Usage

### Typical Workflow

1. **Create Migration File**
   ```bash
   # Create in ops/migrations/sql/
   cat > ops/migrations/sql/004_add_status_column.sql << 'EOF'
   BEGIN;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
   CREATE INDEX idx_users_status ON users(status);
   COMMIT;
   EOF
   ```

2. **Push to Repository**
   ```bash
   git add ops/migrations/sql/004_add_status_column.sql
   git commit -m "Migration: add status column to users"
   git push
   ```

3. **Run Migration Check**
   - Go to Actions → Migration Check
   - Click "Run workflow"
   - Wait for validation

4. **Review Results**
   - Check logs for any issues
   - Download report artifact

5. **Deploy to Staging** (Dry Run First)
   ```bash
   # Step 1: Dry run
   gh workflow run migration-deploy.yml \
     -f environment=staging \
     -f dry_run=true
   
   # Step 2: Review dry run output
   # Step 3: Deploy
   gh workflow run migration-deploy.yml \
     -f environment=staging \
     -f dry_run=false
   ```

6. **Deploy to Production**
   ```bash
   # Step 1: Dry run
   gh workflow run migration-deploy.yml \
     -f environment=production \
     -f dry_run=true
   
   # Wait for approval
   # Step 2: Deploy (after approval)
   gh workflow run migration-deploy.yml \
     -f environment=production \
     -f dry_run=false
   ```

### Emergency Rollback

If a migration fails in production:

```bash
# 1. Check status
gh workflow run migration-check.yml

# 2. Delete from migrations table
# (requires direct database access)
psql $DATABASE_URL_production \
  -c "DELETE FROM migrations WHERE name = 'problematic_migration.sql';"

# 3. Fix migration file or investigate
# 4. Re-run deployment
gh workflow run migration-deploy.yml \
  -f environment=production \
  -f dry_run=false
```

---

## Best Practices

### 1. Always Test First

```bash
# Never go directly to production
# 1. Check validation passes
# 2. Test on staging first
# 3. Then deploy to production
```

### 2. Use Dry Run

```bash
# Always use dry_run=true before deploying
gh workflow run migration-deploy.yml \
  -f environment=production \
  -f dry_run=true

# Review output
# Then deploy with dry_run=false
```

### 3. Monitor Deployments

```bash
# Watch deployment in real-time
gh run watch $(gh run list --limit 1 --jq '.[0].databaseId')
```

### 4. Keep Backups

- Automatic backups are created pre-deployment
- Verify backup succeeded before continuing
- Restore if migration fails: `psql $DB < backup_*.sql`

### 5. Communicate Changes

- Post in Slack/Teams when deploying to production
- Wait for acknowledgment from ops team
- Have rollback plan ready

### 6. Document Migrations

```sql
-- Migration: Add email_verified column
-- Created: 2025-10-25
-- Reason: Track email verification status
-- Impact: New boolean column, defaults to false
-- Rollback: ALTER TABLE users DROP COLUMN email_verified;
```

### 7. Review Logs

Always check:
- ✅ All migrations applied successfully
- ✅ No constraint violations
- ✅ All indexes created
- ✅ Application health check passed
- ✅ Slack notification received

---

## Monitoring & Alerts

### Slack Notifications

Automatic notifications are sent for:
- ✅ Successful deployments
- ❌ Failed validations
- ❌ Failed deployments
- ⚠️ Production issues

### GitHub Issues

On production migration failure:
- GitHub Issue is automatically created
- Title: "🚨 Production Migration Deployment Failed"
- Labeled: critical, migration, production
- Requires immediate investigation

### Logs

View detailed logs:
```bash
# Via GitHub CLI
gh run view <run-id> --log

# Via GitHub UI
# Actions → [workflow] → [run] → [job] → View logs
```

---

## Troubleshooting

### Migration validation fails

**Problem:** "Migration a modifié le volume de données"

**Solution:**
1. Review migration SQL
2. Check for unintended row deletions
3. Add `ROLLBACK;` to test and verify changes
4. Fix migration and re-run check

### Database connection timeout

**Problem:** "Connection timeout"

**Solution:**
1. Verify DATABASE_URL is correct
2. Check database is running and accessible
3. Verify network connectivity
4. Check firewall rules

### Migration already applied

**Problem:** "⊘ Migration already applied"

**Solution:**
1. This is normal - migration won't re-run
2. Check migrations table: `SELECT * FROM migrations;`
3. Only delete if you want to re-apply

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [PostgreSQL Migration Best Practices](https://wiki.postgresql.org/wiki/Replication,_Clustering,_and_Connection_Pooling)

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0
