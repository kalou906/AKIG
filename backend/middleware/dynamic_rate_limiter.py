# backend/middleware/dynamic_rate_limiter.py
"""
Rate Limiting Dynamique par Tenant
Limites basées sur le plan d'abonnement:
- FREE: 100 req/h
- PRO: 1000 req/h
- ENTERPRISE: 10000 req/h
"""
import redis
import json
from fastapi import Request, HTTPException, status
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DynamicRateLimiter:
    """
    Rate limiter avec limites personnalisées par tenant
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379/3"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        
        # Configuration des plans
        self.plan_limits = {
            "free": {
                "requests": 100,
                "window": 3600,  # 1 heure
                "burst": 10,     # Burst autorisé
            },
            "pro": {
                "requests": 1000,
                "window": 3600,
                "burst": 50,
            },
            "enterprise": {
                "requests": 10000,
                "window": 3600,
                "burst": 200,
            },
            "admin": {
                "requests": 1000000,
                "window": 3600,
                "burst": 10000,
            }
        }
    
    async def get_tenant_plan(self, tenant_id: str) -> str:
        """
        Récupérer le plan d'abonnement du tenant
        
        Args:
            tenant_id: ID du tenant
            
        Returns:
            Plan name (free, pro, enterprise)
        """
        # Mock - À remplacer par vraie requête DB
        # async with get_db_session() as db:
        #     result = await db.execute(
        #         text("SELECT plan FROM tenants WHERE id = :tenant_id"),
        #         {"tenant_id": tenant_id}
        #     )
        #     plan = result.scalar()
        
        # Cache Redis pour éviter les requêtes DB répétées
        cache_key = f"tenant_plan:{tenant_id}"
        cached_plan = self.redis.get(cache_key)
        
        if cached_plan:
            return cached_plan
        
        # Mock fallback
        plan = "free"  # Default plan
        
        # Cache pour 1 heure
        self.redis.setex(cache_key, 3600, plan)
        
        return plan
    
    async def check_limit(self, tenant_id: str, request: Request) -> dict:
        """
        Vérifier et incrémenter le compteur de rate limit
        
        Args:
            tenant_id: ID du tenant
            request: FastAPI Request object
            
        Returns:
            Rate limit info (remaining, reset_time)
            
        Raises:
            HTTPException: Si la limite est dépassée (429)
        """
        # Récupérer le plan
        plan = await self.get_tenant_plan(tenant_id)
        limit_config = self.plan_limits.get(plan, self.plan_limits["free"])
        
        # Clés Redis
        window = limit_config["window"]
        key = f"rate_limit:{tenant_id}:{int(datetime.now().timestamp() // window)}"
        burst_key = f"rate_limit_burst:{tenant_id}"
        
        # Pipeline Redis pour atomicité
        pipe = self.redis.pipeline()
        
        # Vérifier le compteur principal
        current = self.redis.get(key)
        current_count = int(current) if current else 0
        
        # Vérifier le burst
        burst_count = int(self.redis.get(burst_key) or 0)
        
        # Calculs
        max_requests = limit_config["requests"]
        max_burst = limit_config["burst"]
        remaining = max(0, max_requests - current_count)
        
        # Détection dépassement
        if current_count >= max_requests:
            # Vérifier si burst disponible
            if burst_count >= max_burst:
                logger.warning(
                    f"Rate limit exceeded for tenant {tenant_id} (plan: {plan})",
                    extra={
                        "tenant_id": tenant_id,
                        "plan": plan,
                        "current": current_count,
                        "limit": max_requests,
                    }
                )
                
                # Calculer temps avant reset
                reset_time = (int(datetime.now().timestamp() // window) + 1) * window
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "plan": plan,
                        "limit": max_requests,
                        "window": window,
                        "reset_at": reset_time,
                        "message": f"Vous avez atteint la limite de {max_requests} requêtes/heure pour le plan {plan.upper()}",
                    },
                    headers={
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(reset_time),
                        "Retry-After": str(window),
                    }
                )
            else:
                # Utiliser burst
                pipe.incr(burst_key)
                pipe.expire(burst_key, window)
                logger.info(f"Using burst capacity for {tenant_id}: {burst_count+1}/{max_burst}")
        
        # Incrémenter compteur
        pipe.incr(key)
        pipe.expire(key, window)
        pipe.execute()
        
        # Info pour les headers
        reset_time = (int(datetime.now().timestamp() // window) + 1) * window
        
        # Ajouter headers de rate limit
        request.state.rate_limit_headers = {
            "X-RateLimit-Limit": str(max_requests),
            "X-RateLimit-Remaining": str(remaining - 1),
            "X-RateLimit-Reset": str(reset_time),
            "X-RateLimit-Plan": plan.upper(),
        }
        
        return {
            "allowed": True,
            "limit": max_requests,
            "remaining": remaining - 1,
            "reset_at": reset_time,
            "plan": plan,
        }
    
    async def get_stats(self, tenant_id: str) -> dict:
        """
        Récupérer les statistiques de rate limiting pour un tenant
        """
        plan = await self.get_tenant_plan(tenant_id)
        limit_config = self.plan_limits.get(plan, self.plan_limits["free"])
        
        window = limit_config["window"]
        key = f"rate_limit:{tenant_id}:{int(datetime.now().timestamp() // window)}"
        
        current = int(self.redis.get(key) or 0)
        burst_used = int(self.redis.get(f"rate_limit_burst:{tenant_id}") or 0)
        
        return {
            "tenant_id": tenant_id,
            "plan": plan,
            "limit": limit_config["requests"],
            "window": limit_config["window"],
            "current_usage": current,
            "remaining": max(0, limit_config["requests"] - current),
            "burst_used": burst_used,
            "burst_available": limit_config["burst"] - burst_used,
        }

# Middleware FastAPI
async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware FastAPI pour appliquer le rate limiting
    """
    # Extraire tenant_id (depuis header, JWT, ou path param)
    tenant_id = request.headers.get("X-Tenant-ID") or request.path_params.get("tenant_id")
    
    if not tenant_id:
        # Skip rate limiting si pas de tenant_id
        return await call_next(request)
    
    # Vérifier rate limit
    limiter = DynamicRateLimiter()
    await limiter.check_limit(tenant_id, request)
    
    # Continuer la requête
    response = await call_next(request)
    
    # Ajouter headers de rate limit
    if hasattr(request.state, "rate_limit_headers"):
        for header, value in request.state.rate_limit_headers.items():
            response.headers[header] = value
    
    return response
