# backend/routes/health.py
"""
Health Check Endpoints with Vault Status
Provides comprehensive health information including Vault connectivity
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime
from utils.vault_client import vault_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check():
    """
    Basic health check
    Returns HTTP 200 if service is alive
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "solvency-api"
    }

@router.get("/detailed")
async def detailed_health():
    """
    Detailed health check with all dependencies
    """
    checks = {
        "api": {"status": "healthy"},
        "database": await check_database(),
        "redis": await check_redis(),
        "vault": await check_vault(),
    }
    
    # Overall status
    all_healthy = all(check["status"] == "healthy" for check in checks.values())
    overall_status = "healthy" if all_healthy else "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }

@router.get("/vault")
async def vault_health():
    """
    Vault-specific health check
    Returns detailed Vault status
    """
    try:
        health_info = vault_client.health_check()
        
        # Determine HTTP status code based on Vault state
        if health_info.get('sealed', True):
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            health_status = "unhealthy"
        elif not health_info.get('initialized', False):
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            health_status = "unhealthy"
        elif not health_info.get('authenticated', False):
            status_code = status.HTTP_401_UNAUTHORIZED
            health_status = "unauthenticated"
        else:
            status_code = status.HTTP_200_OK
            health_status = "healthy"
        
        return JSONResponse(
            status_code=status_code,
            content={
                "status": health_status,
                "vault": health_info,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    except Exception as e:
        logger.error(f"Vault health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "message": "Vault is unreachable"
            }
        )

@router.get("/vault/token")
async def vault_token_info():
    """
    Get Vault token information
    Useful for debugging token expiration issues
    """
    try:
        token_info = vault_client.client.auth.token.lookup_self()
        
        return {
            "status": "healthy",
            "token": {
                "ttl": token_info['data']['ttl'],
                "ttl_human": f"{token_info['data']['ttl'] // 3600}h {(token_info['data']['ttl'] % 3600) // 60}m",
                "renewable": token_info['data']['renewable'],
                "policies": token_info['data']['policies'],
                "creation_time": token_info['data']['creation_time'],
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Failed to lookup token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token lookup failed: {str(e)}"
        )

async def check_database() -> dict:
    """Check database connectivity"""
    try:
        # Mock - À remplacer par vraie vérification
        # from db import pool
        # await pool.execute("SELECT 1")
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Database check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}

async def check_redis() -> dict:
    """Check Redis connectivity"""
    try:
        # Mock - À remplacer par vraie vérification
        # import redis
        # r = redis.from_url(REDIS_URL)
        # r.ping()
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Redis check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}

async def check_vault() -> dict:
    """Check Vault connectivity"""
    try:
        health_info = vault_client.health_check()
        
        if health_info.get('sealed', True) or not health_info.get('initialized', False):
            return {"status": "unhealthy", "details": health_info}
        
        return {"status": "healthy", "details": health_info}
    
    except Exception as e:
        logger.error(f"Vault check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}
