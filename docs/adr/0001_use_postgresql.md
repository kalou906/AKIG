# ADR-001: Use PostgreSQL for Primary Database

**Date**: 2025-10-26  
**Status**: Accepted  
**Context**: Need to choose a primary database for the AKIG property management platform

## Decision

We will use PostgreSQL 14+ as the primary database for AKIG.

## Rationale

1. **Strong ACID Compliance**: Critical for financial transactions and audit trails
2. **Advanced Features**: JSON support, full-text search, window functions, stored procedures
3. **Scalability**: Connection pooling (pgBouncer), partitioning, replication
4. **Security**: Row-level security (RLS), encrypted columns, audit logging
5. **Open Source**: No licensing costs, strong community support
6. **Performance**: Excellent for complex queries common in property management
7. **Data Integrity**: Foreign key constraints, check constraints, unique constraints

## Technical Details

- **Version**: PostgreSQL 14+ (with upgrade path to 15+)
- **Connection Pooling**: PgBouncer or pg connection pool (Node.js)
- **Replication**: Streaming replication for disaster recovery
- **Backups**: Daily automated backups with WAL archiving
- **Monitoring**: pg_stat_statements, custom queries, Prometheus exporter

## Consequences

### Positive
- ✅ Proven in production for millions of transactions
- ✅ ACID compliance satisfies regulatory requirements
- ✅ Can handle complex relational data for multi-property scenarios
- ✅ Built-in audit capabilities (triggers)
- ✅ Full-text search eliminates need for Elasticsearch
- ✅ Can enforce data consistency at database level

### Negative
- ❌ Requires SQL expertise for optimization
- ❌ Need to manage migrations carefully
- ❌ Query performance depends on proper indexing
- ❌ Requires backup/recovery infrastructure

## Alternatives Considered

1. **MongoDB**: Rejected - not suitable for financial data requiring ACID compliance
2. **MySQL**: Considered - less advanced features, fewer JSON capabilities
3. **SQLite**: Rejected - not suitable for production multi-user applications
4. **Cloud Databases (Aurora/BigQuery)**: Considered - would increase vendor lock-in

## References

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Connection Pooling Guide](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections)
