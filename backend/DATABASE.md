# Database Setup and Configuration Guide

## Overview

The AKIG backend uses PostgreSQL for data persistence with connection pooling via the `pg` library.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Database Utils API](#database-utils-api)
4. [Usage Examples](#usage-examples)
5. [Connection Pooling](#connection-pooling)
6. [Health Checks](#health-checks)
7. [Transactions](#transactions)
8. [Performance Tips](#performance-tips)
9. [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites

- PostgreSQL 12+ installed locally or accessible via network
- Node.js 14+
- npm or yarn

### Setup PostgreSQL

#### On Windows (Local)

```bash
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# During installation, set:
# - Port: 5432 (default)
# - Username: postgres
# - Password: (set your password)

# Create database and user
psql -U postgres

postgres=# CREATE USER akig_user WITH PASSWORD 'akig_password';
postgres=# CREATE DATABASE akig OWNER akig_user;
postgres=# GRANT ALL PRIVILEGES ON DATABASE akig TO akig_user;
postgres=# \q
```

#### On macOS (Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15

# Create database and user
psql postgres

postgres=# CREATE USER akig_user WITH PASSWORD 'akig_password';
postgres=# CREATE DATABASE akig OWNER akig_user;
postgres=# GRANT ALL PRIVILEGES ON DATABASE akig TO akig_user;
postgres=# \q
```

#### On Linux (Ubuntu/Debian)

```bash
sudo apt-get install postgresql postgresql-contrib

sudo -u postgres psql

postgres=# CREATE USER akig_user WITH PASSWORD 'akig_password';
postgres=# CREATE DATABASE akig OWNER akig_user;
postgres=# GRANT ALL PRIVILEGES ON DATABASE akig TO akig_user;
postgres=# \q
```

### Install Node Package

```bash
cd backend
npm install pg
```

---

## Configuration

### Environment Variables

Create or update `.env` in the project root:

```bash
# Database Connection
DATABASE_URL=postgresql://akig_user:akig_password@localhost:5432/akig

# Connection Pool Settings
DB_POOL_MAX=20              # Maximum connections in pool
DB_IDLE_TIMEOUT=30000       # Idle timeout in milliseconds (30 seconds)
DB_CONNECTION_TIMEOUT=2000  # Connection timeout in milliseconds (2 seconds)

# Debug Mode
DEBUG_SQL=false             # Set to 'true' to log all SQL queries
```

### Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

Example:
```
postgresql://akig_user:akig_password@localhost:5432/akig
```

### Production Configuration

For production, use environment-specific settings:

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_password@prod-host:5432/akig_prod

DB_POOL_MAX=50              # Higher for production
DB_IDLE_TIMEOUT=60000       # 1 minute
DB_CONNECTION_TIMEOUT=5000  # 5 seconds
DEBUG_SQL=false             # Never enable in production
```

---

## Database Utils API

### Import

```javascript
const db = require('../db-utils');
```

### Available Methods

#### `query(text, params)`

Execute a raw SQL query.

```javascript
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
// Returns: { rows: [...], rowCount: 1 }
```

#### `queryOne(text, params)`

Execute a query and return the first row.

```javascript
const user = await db.queryOne(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
// Returns: { id: 1, email: '...', ... } or null
```

#### `queryMany(text, params)`

Execute a query and return all rows.

```javascript
const users = await db.queryMany(
  'SELECT * FROM users WHERE role = $1',
  ['admin']
);
// Returns: [{ id: 1, ... }, { id: 2, ... }]
```

#### `insert(table, data)`

Insert a record and return the inserted row.

```javascript
const newUser = await db.insert('users', {
  email: 'user@example.com',
  name: 'John Doe',
  created_at: new Date(),
});
// Returns: { id: 1, email: '...', name: '...', created_at: ... }
```

#### `update(table, data, where)`

Update records and return the updated row.

```javascript
const updated = await db.update(
  'users',
  { name: 'Jane Doe', updated_at: new Date() },
  { id: userId }
);
// Returns: { id: userId, email: '...', name: 'Jane Doe', ... }
```

#### `deleteRecord(table, where)`

Delete records.

```javascript
const deletedCount = await db.deleteRecord('users', { id: userId });
// Returns: number of rows deleted
```

#### `transaction(callback)`

Execute multiple queries in a transaction.

```javascript
const result = await db.transaction(async (client) => {
  const user = await client.query(
    'INSERT INTO users (email) VALUES ($1) RETURNING *',
    ['user@example.com']
  );
  
  await client.query(
    'INSERT INTO audit_log (user_id, action) VALUES ($1, $2)',
    [user.rows[0].id, 'user_created']
  );
  
  return user.rows[0];
});
```

#### `healthCheck()`

Check database connection health.

```javascript
const health = await db.healthCheck();
// Returns: { healthy: true, timestamp: Date } or { healthy: false, error: string }
```

#### `getPoolStats()`

Get connection pool statistics.

```javascript
const stats = db.getPoolStats();
// Returns: { size: 5, idle: 3, waiting: 0 }
```

---

## Usage Examples

### Basic Query

```javascript
const router = require('express').Router();
const db = require('../db-utils');

router.get('/users/:id', async (req, res) => {
  try {
    const user = await db.queryOne(
      'SELECT id, email, name FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### Insert with Validation

```javascript
router.post('/users', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Check if user exists
    const existing = await db.queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    // Insert new user
    const user = await db.insert('users', {
      email,
      name,
      created_at: new Date(),
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### Transaction Example

```javascript
router.post('/orders', async (req, res) => {
  try {
    const result = await db.transaction(async (client) => {
      // Create order
      const order = await client.query(
        'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
        [req.body.userId, req.body.total]
      );
      
      // Update inventory
      await client.query(
        'UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2',
        [req.body.quantity, req.body.productId]
      );
      
      // Create audit log
      await client.query(
        'INSERT INTO audit_log (action, user_id) VALUES ($1, $2)',
        ['order_created', req.body.userId]
      );
      
      return order.rows[0];
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ message: 'Order creation failed' });
  }
});
```

---

## Connection Pooling

### How It Works

The `pg` library maintains a pool of reusable database connections:

1. When a query is executed, a connection is taken from the pool
2. The query is executed
3. The connection is returned to the pool for reuse

This avoids the overhead of creating new connections for each query.

### Configuration

```javascript
// src/db.js
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,  // 30 seconds
  connectionTimeoutMillis: 2000, // 2 seconds
});
```

### Monitoring

```javascript
const stats = db.getPoolStats();
console.log('Pool stats:', stats);
// Output: { size: 5, idle: 3, waiting: 0 }

// size: Total connections in pool
// idle: Available connections
// waiting: Queries waiting for a connection
```

### Best Practices

1. **Reuse connections** - Use the pool, don't create new connections
2. **Monitor pool** - Check idle connection count, adjust max if needed
3. **Set timeouts** - Configure idleTimeoutMillis and connectionTimeoutMillis
4. **Handle errors** - Implement error handlers for pool errors

---

## Health Checks

### Database Health Endpoint

```javascript
const { dbHealthCheck } = require('../middleware/database');

app.get('/api/health/db', dbHealthCheck);
```

Response when healthy:
```json
{
  "status": "healthy",
  "database": {
    "healthy": true,
    "timestamp": "2024-10-25T12:34:56.789Z"
  },
  "poolStats": {
    "size": 5,
    "idle": 4,
    "waiting": 0
  },
  "timestamp": "2024-10-25T12:34:56.789Z"
}
```

Response when unhealthy:
```json
{
  "status": "unhealthy",
  "database": {
    "healthy": false,
    "error": "Connection timeout"
  },
  "timestamp": "2024-10-25T12:34:56.789Z"
}
```

### Require Database Middleware

Use for routes that need database connectivity:

```javascript
const { requireDatabase } = require('../middleware/database');

router.get('/data', requireDatabase, async (req, res) => {
  // Route handler - database is guaranteed to be connected
});
```

---

## Transactions

### Basic Transaction

```javascript
const result = await db.transaction(async (client) => {
  // All queries use the same connection
  const result1 = await client.query('INSERT INTO ...', params);
  const result2 = await client.query('UPDATE ...', params);
  
  // If an error occurs, all changes are rolled back
  // If no error, all changes are committed
  
  return result1;
});
```

### Transaction with Error Handling

```javascript
try {
  const result = await db.transaction(async (client) => {
    // Queries...
  });
} catch (error) {
  // Transaction was rolled back
  console.error('Transaction failed:', error);
}
```

### Nested Operations

```javascript
const result = await db.transaction(async (client) => {
  // Query 1
  const user = await client.query(
    'SELECT * FROM users WHERE id = $1 FOR UPDATE',
    [userId]
  );
  
  // Query 2 - depends on Query 1
  if (user.rows[0].balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Query 3
  await client.query(
    'UPDATE users SET balance = balance - $1 WHERE id = $2',
    [amount, userId]
  );
  
  return { success: true };
});
```

---

## Performance Tips

### 1. Use Prepared Statements

```javascript
// ✅ Good - Parameterized query
await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Bad - String concatenation
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### 2. Index Frequently Queried Columns

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
```

### 3. Limit Query Results

```javascript
// ✅ Efficient
await db.queryMany(
  'SELECT id, email FROM users LIMIT 100',
  []
);

// ❌ Inefficient
await db.queryMany(
  'SELECT * FROM users',  // No limit, large result set
  []
);
```

### 4. Use Batch Operations

```javascript
// ✅ Batch insert
const values = users.map((u, i) => 
  `($${i*2+1}, $${i*2+2})`
).join(',');
const params = users.flatMap(u => [u.email, u.name]);

await db.query(
  `INSERT INTO users (email, name) VALUES ${values}`,
  params
);

// ❌ Multiple inserts (slow)
for (const user of users) {
  await db.insert('users', user);
}
```

### 5. Enable Query Logging During Development

```bash
# .env
DEBUG_SQL=true
```

This logs query execution time and helps identify slow queries.

---

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in .env
3. Verify credentials are correct
4. Check firewall/network settings

```bash
# Check if PostgreSQL is running
psql -U akig_user -d akig -c "SELECT NOW();"
```

### Too Many Connections

```
Error: remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**
1. Reduce DB_POOL_MAX in .env
2. Ensure connections are properly released
3. Monitor pool stats: `db.getPoolStats()`

### Connection Timeout

```
Error: Query timeout
```

**Solutions:**
1. Increase DB_CONNECTION_TIMEOUT
2. Optimize slow queries (add indexes)
3. Check database load

### SSL Certificate Error (Production)

```
Error: self signed certificate
```

**Solution in .env:**
```bash
# For self-signed certificates
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

---

## Database Migrations

### Manual Migration Example

```javascript
// scripts/migrate-001-create-users.js
const db = require('../src/db-utils');

async function migrate() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_users_email ON users(email);
    `);
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

Run migration:
```bash
node scripts/migrate-001-create-users.js
```

---

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg Library Documentation](https://node-postgres.com/)
- [Connection Pooling Guide](https://node-postgres.com/features/pooling)
- [SQL Best Practices](https://www.postgresql.org/docs/current/sql.html)

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0
