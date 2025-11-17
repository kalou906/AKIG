# Database Migrations Guide

## Overview

This guide covers database migrations for AKIG backend, including migration creation, validation, and safe execution.

## Table of Contents

1. [Setup](#setup)
2. [Migration Files](#migration-files)
3. [Running Migrations](#running-migrations)
4. [Validation](#validation)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Examples](#examples)

---

## Setup

### Directory Structure

```
ops/
└── migrations/
    ├── check_migrations.js          # Migration validator
    ├── migration_runner.js          # Migration executor
    ├── sql/                         # SQL migration files
    │   ├── 001_create_users_table.sql
    │   ├── 002_create_contracts_table.sql
    │   └── 003_create_audit_log_table.sql
    └── README.md                    # This file
```

### Initial Setup

```bash
# Ensure migrations directory exists
mkdir -p ops/migrations/sql

# The migrations table is created automatically on first run
# It tracks which migrations have been applied
```

---

## Migration Files

### Naming Convention

Migrations are named numerically to ensure execution order:

```
NNN_description.sql
 ↑
 Sequential number (001, 002, 003, etc.)
```

Examples:
- `001_create_users_table.sql`
- `002_create_contracts_table.sql`
- `003_add_user_email_index.sql`

### SQL Migration Template

```sql
-- Migration: <Description>
-- Created: YYYY-MM-DD
-- Description: <Detailed description>

BEGIN;

-- Your migration SQL here
CREATE TABLE IF NOT EXISTS example_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_example_table_name ON example_table(name);

COMMIT;
```

### Key Principles

1. **Wrap in transactions**: Use `BEGIN;` and `COMMIT;` to ensure atomic operations
2. **Use `IF NOT EXISTS`**: Prevent errors if migration runs twice
3. **Add indexes**: Create indexes for frequently queried columns
4. **Document changes**: Include clear comments
5. **Use `DELETE CASCADE`**: For foreign keys to maintain referential integrity

### Example: Adding a Column

```sql
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add index if it's frequently searched
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update NOT NULL constraint if needed
-- ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

COMMIT;
```

### Example: Creating a Table with Relationships

```sql
BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Create automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_updated_at();

COMMIT;
```

---

## Running Migrations

### Check Status

```bash
# See which migrations have been applied
node ops/migrations/migration_runner.js status
```

Output:
```
Migration Status
================

Applied:
  ✓ 001_create_users_table.sql
  ✓ 002_create_contracts_table.sql

Pending:
  ○ 003_create_audit_log_table.sql

Total: 2 applied, 1 pending
```

### List Available Migrations

```bash
node ops/migrations/migration_runner.js list
```

### Run Pending Migrations

```bash
# Automatically runs all pending migrations in order
node ops/migrations/migration_runner.js pending
```

Output:
```
Found 1 pending migrations

→ Running migration: 003_create_audit_log_table.sql
✓ Migration completed: 003_create_audit_log_table.sql

✓ Completed: 1 applied, 0 failed
```

### Run a Specific Migration

```bash
node ops/migrations/migration_runner.js run 001_create_users_table.sql
```

### npm Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "migrate:status": "node ../ops/migrations/migration_runner.js status",
    "migrate:list": "node ../ops/migrations/migration_runner.js list",
    "migrate:pending": "node ../ops/migrations/migration_runner.js pending",
    "migrate:run": "node ../ops/migrations/migration_runner.js run",
    "migrate": "npm run migrate:pending"
  }
}
```

Usage:
```bash
npm run migrate:status
npm run migrate:pending
npm run migrate
```

---

## Validation

### Pre-Migration Validation

The migration system automatically validates:

1. **Data Integrity** - Row counts don't unexpectedly change
2. **Constraints** - All foreign keys remain valid
3. **Indexes** - All indexes created successfully
4. **Structure** - Table schemas match expectations

### Using the Validator

```javascript
const MigrationValidator = require('./ops/migrations/check_migrations');

const validator = new MigrationValidator();

// Take snapshot before migration
const before = await validator.snapshotBefore(['users', 'contracts']);

// Run your migration
await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');

// Take snapshot after migration
const after = await validator.snapshotAfter(['users', 'contracts']);

// Validate changes
const result = validator.validate(before, after, {
  allowRowChanges: false,
  allowTableCreation: false,
  allowConstraintModification: false,
});

if (result.valid) {
  console.log('✓ Migration passed validation');
} else {
  console.error('✗ Validation failed:', result.issues);
}
```

### Validation Options

```javascript
{
  allowTableCreation: true,          // Allow new tables to be created
  allowColumnAddition: true,         // Allow new columns
  allowRowChanges: false,            // Disallow row count changes (default)
  allowConstraintModification: false // Disallow constraint changes (default)
}
```

---

## Best Practices

### 1. Test Migrations Locally First

```bash
# Test on local database before production
export DATABASE_URL=postgresql://localhost/akig_test
npm run migrate:pending

# Verify data integrity
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM contracts;
```

### 2. Use Transactions

Every migration should be wrapped in `BEGIN;` and `COMMIT;`:

```sql
BEGIN;
  -- Migration code
COMMIT;
```

If an error occurs, the entire migration is rolled back.

### 3. Backward Compatibility

Design migrations to work with existing data:

```sql
-- ✅ Good - Uses IF NOT EXISTS
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- ❌ Bad - Will fail if column already exists
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

### 4. Add Indexes

Always add indexes for columns used in WHERE clauses:

```sql
CREATE INDEX idx_table_column ON table_name(column_name);

-- Partial index for soft deletes
CREATE INDEX idx_active_records ON table_name(id) WHERE deleted_at IS NULL;

-- Composite index for common queries
CREATE INDEX idx_user_status ON table_name(user_id, status);
```

### 5. Document Changes

Include comments explaining what changed:

```sql
-- Migration: Add email_verified column
-- Reason: Track email verification status for security
-- Impact: New column with default false
-- Rollback: ALTER TABLE users DROP COLUMN email_verified;

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

COMMIT;
```

### 6. Validate Foreign Keys

Test foreign key relationships:

```bash
# Check for orphaned records
SELECT * FROM contracts WHERE user_id NOT IN (SELECT id FROM users);

# Validate constraint integrity
ALTER TABLE contracts VALIDATE CONSTRAINT "contracts_user_id_fkey";
```

### 7. Handle Large Tables Carefully

For large tables, use non-blocking operations:

```sql
-- ❌ Avoid - Locks table during operation
ALTER TABLE large_table ADD COLUMN new_column INTEGER;

-- ✅ Better - Add column separately, populate in batches
ALTER TABLE large_table ADD COLUMN IF NOT EXISTS new_column INTEGER;

-- Populate in batches to avoid locking
-- Can use application code to update in chunks
```

---

## Troubleshooting

### Migration Already Applied

```
⊘ Migration already applied: 001_create_users_table.sql
```

**Solution:** The migration is already in the migrations table. To re-run it:

```bash
# Check migration history
psql $DATABASE_URL

# Delete from migrations table
DELETE FROM migrations WHERE name = '001_create_users_table.sql';

# Re-run migration
npm run migrate:run 001_create_users_table.sql
```

### Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Verify database connection:

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Verify PostgreSQL is running
pg_isready -h localhost -p 5432
```

### Foreign Key Constraint Violation

```
Error: insert or update on table "contracts" violates foreign key constraint
```

**Solution:** Ensure referenced records exist:

```sql
-- Find orphaned records
SELECT * FROM contracts WHERE user_id NOT IN (SELECT id FROM users);

-- Delete orphaned records before migration
DELETE FROM contracts WHERE user_id NOT IN (SELECT id FROM users);
```

### Validation Failed

```
✗ Migration validation failed:
  - Table users: row count changed from 100 to 95
```

**Solution:** Review migration changes for unexpected data loss:

```bash
# Compare before/after states
npm run migrate:status

# Rollback migration if needed
psql $DATABASE_URL -c "DELETE FROM migrations WHERE name = '003_create_audit_log_table.sql';"
```

---

## Examples

### Example 1: Create a Simple Table

```sql
-- Migration: Create products table
-- Created: 2025-10-25

BEGIN;

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_name ON products(name);

COMMIT;
```

### Example 2: Add a Column with Default

```sql
-- Migration: Add status column to products
-- Created: 2025-10-25

BEGIN;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Make not null after populating
-- ALTER TABLE products ALTER COLUMN status SET NOT NULL;

CREATE INDEX idx_products_status ON products(status);

COMMIT;
```

### Example 3: Create Junction Table (Many-to-Many)

```sql
-- Migration: Create user_roles junction table
-- Created: 2025-10-25

BEGIN;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

COMMIT;
```

### Example 4: Add Enum Type and Column

```sql
-- Migration: Add notification_preference column with enum type
-- Created: 2025-10-25

BEGIN;

-- Create enum type
CREATE TYPE notification_preference AS ENUM ('email', 'sms', 'push', 'none');

-- Add column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notification_preference notification_preference DEFAULT 'email';

CREATE INDEX idx_users_notification_preference ON users(notification_preference);

COMMIT;
```

---

## Database Rollback

If a migration fails in production:

```bash
# Check what happened
npm run migrate:status

# Delete failed migration from history
psql $DATABASE_URL -c "DELETE FROM migrations WHERE name = 'failed_migration.sql';"

# Fix the migration file
# Then re-run
npm run migrate:pending
```

---

## Performance Considerations

### For Large Tables

1. **Use `CONCURRENTLY`** for index creation:
   ```sql
   CREATE INDEX CONCURRENTLY idx_large_table ON large_table(column);
   ```

2. **Batch updates**:
   ```sql
   -- Update in chunks instead of all at once
   UPDATE large_table SET column = value WHERE id < 1000;
   UPDATE large_table SET column = value WHERE id >= 1000 AND id < 2000;
   ```

3. **Schedule during low traffic**:
   - Run migrations during maintenance windows
   - Consider table size (>1GB tables need special handling)

---

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Creating Indexes](https://www.postgresql.org/docs/current/sql-createindex.html)
- [Foreign Key Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0
