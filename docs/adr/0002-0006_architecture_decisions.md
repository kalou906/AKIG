# ADR-002: JWT Authentication with 24-Hour Expiration

**Date**: 2025-10-26  
**Status**: Accepted  
**Context**: Need secure authentication mechanism for AKIG API

## Decision

Use JWT (JSON Web Tokens) with 24-hour expiration combined with refresh tokens.

## Rationale

1. **Stateless**: No session storage required, scales horizontally
2. **Standard**: Industry-standard, supported by all languages/frameworks
3. **Secure**: Cryptographically signed tokens prevent tampering
4. **Mobile-Friendly**: Works perfectly with mobile apps
5. **Self-Contained**: Includes user data, reducing database lookups

## Technical Implementation

- **Algorithm**: HS256 (HMAC SHA256)
- **Expiration**: 24 hours for access token
- **Refresh Token**: 30-day expiration, stored in secure HttpOnly cookies
- **Signing Key**: 256-bit entropy from `/dev/urandom`

## Security Measures

✅ HttpOnly cookies prevent XSS access  
✅ Secure flag for HTTPS only  
✅ SameSite=Strict prevents CSRF  
✅ Token blacklisting on logout  
✅ Audit logging for authentication events  

## Consequences

### Positive
- Stateless, horizontal scaling possible
- Standard JWT libraries available
- Can validate tokens offline
- Reduced database queries for permission checks

### Negative
- Cannot instantly revoke tokens (until expiration)
- Token size increases payload
- Must protect JWT_SECRET carefully

## Alternatives

1. **Session Cookies**: More traditional, but requires session storage
2. **OAuth2**: Overkill for internal API, adds complexity
3. **mTLS**: More secure but operationally complex

---

# ADR-003: Redis for Distributed Caching

**Date**: 2025-10-26  
**Status**: Accepted  
**Context**: Need distributed cache for performance optimization

## Decision

Use Redis 7.0+ for caching permissions, contracts, payments, and search results.

## Rationale

1. **Performance**: Sub-millisecond access times
2. **Distributed**: Shared across multiple backend instances
3. **TTL Support**: Built-in key expiration
4. **Data Structures**: Supports lists, sets, hashes for complex caching
5. **Persistence**: Optional RDB/AOF for recovery

## Caching Strategy

| Data | TTL | Invalidation |
|------|-----|--------------|
| Permissions | 5 min | On role change |
| Contracts | 10 min | On create/update/delete |
| Payments | 1 hour | On status change |
| Search Results | 30 min | On contract change |
| Audit Logs | 1 hour | On new audit entry |

## Consequences

### Positive
- 3-5x performance improvement
- Reduced database load
- Better scalability

### Negative
- Additional infrastructure to manage
- Cache invalidation complexity
- Memory cost (fixed size)
- Monitoring required

---

# ADR-004: Kubernetes for Orchestration

**Date**: 2025-10-26  
**Status**: Accepted  
**Context**: Need production-grade deployment, scaling, and high availability

## Decision

Deploy AKIG on Kubernetes for container orchestration and service management.

## Rationale

1. **Auto-Scaling**: Horizontal pod autoscaling based on metrics
2. **Self-Healing**: Automatic restart of failed pods
3. **Zero-Downtime**: Rolling updates with health checks
4. **Multi-Region**: Easy multi-region deployment
5. **Monitoring**: Prometheus/Grafana integration

## Kubernetes Configuration

- **Replicas**: 3 (minimum for HA)
- **Resource Limits**: CPU 500m, Memory 512Mi per pod
- **Health Checks**: Liveness & readiness probes
- **Storage**: Persistent volumes for PostgreSQL
- **Ingress**: Nginx with SSL termination

## Consequences

### Positive
- True high availability (99.99% uptime)
- Auto-scaling based on demand
- Built-in monitoring
- Standard deployment process

### Negative
- Operational complexity
- Learning curve for team
- Requires monitoring infrastructure
- Higher base cost than simple VMs

---

# ADR-005: Event-Driven Architecture for Payments

**Date**: 2025-10-26  
**Status**: Accepted  
**Context**: Payment processing has complex workflows with third-party integrations

## Decision

Implement event-driven architecture using Kafka/RabbitMQ for payment processing.

## Events

1. `payment.created` → Send confirmation email
2. `payment.completed` → Update contract status
3. `payment.failed` → Alert user, retry
4. `payment.reconciled` → Update accounting

## Benefits

✅ Loose coupling between components  
✅ Easy to add new integrations  
✅ Natural support for retries  
✅ Full audit trail of events  

## Implementation

- Message broker: Apache Kafka or RabbitMQ
- Event sourcing for payment events
- Dead letter queues for failed events
- Event replay capability for disaster recovery

---

# ADR-006: OpenTelemetry for Observability

**Date**: 2025-10-26  
**Status**: Accepted  
**Context**: Need comprehensive observability across all layers

## Decision

Implement OpenTelemetry with tracing, metrics, and logs across the entire stack.

## Components

- **Tracing**: Distributed tracing with Jaeger
- **Metrics**: Prometheus for time-series metrics
- **Logs**: Structured JSON logging with ELK stack
- **Instrumentation**: Auto-instrumentation with OTel agents

## Benefits

✅ Unified observability platform  
✅ Vendor-neutral (not locked to one provider)  
✅ Can correlate traces, metrics, and logs  
✅ Great for debugging distributed issues  

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Distributed Tracing](https://opentelemetry.io/docs/concepts/signals/traces/)
