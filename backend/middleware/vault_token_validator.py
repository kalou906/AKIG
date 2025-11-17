# backend/middleware/vault_token_validator.py
"""
Vault Token Validation Middleware
Ensures Vault token is valid and has sufficient TTL
Automatically renews token when needed
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from utils.vault_client import vault_client
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Minimum TTL threshold (in seconds)
MIN_TOKEN_TTL = 3600  # 1 hour
CRITICAL_TOKEN_TTL = 1800  # 30 minutes

async def validate_vault_token_middleware(request: Request, call_next):
    """
    Middleware to validate Vault token before processing requests
    
    - Checks if token is valid
    - Checks if token has sufficient TTL
    - Attempts renewal if TTL is low
    - Returns 503 if Vault is unavailable
    """
    
    # Skip validation for health check endpoints
    if request.url.path in ['/health', '/health/vault', '/health/detailed']:
        return await call_next(request)
    
    try:
        # Check token status
        token_info = vault_client.client.auth.token.lookup_self()
        ttl = token_info['data']['ttl']
        renewable = token_info['data']['renewable']
        
        # Log token status
        logger.debug(
            "Vault token status",
            extra={
                "ttl": ttl,
                "ttl_human": f"{ttl // 3600}h {(ttl % 3600) // 60}m",
                "renewable": renewable
            }
        )
        
        # If TTL is critically low, try to renew immediately
        if ttl < CRITICAL_TOKEN_TTL:
            if renewable:
                logger.warning(
                    f"Vault token TTL critically low ({ttl}s), renewing immediately"
                )
                try:
                    vault_client.client.auth.token.renew_self()
                    logger.info("Vault token renewed successfully")
                except Exception as renew_error:
                    logger.error(f"Failed to renew Vault token: {renew_error}")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Vault token renewal failed"
                    )
            else:
                logger.error("Vault token not renewable and TTL is critically low")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Vault token expired and not renewable"
                )
        
        # If TTL is low but not critical, log a warning
        elif ttl < MIN_TOKEN_TTL:
            logger.warning(
                f"Vault token TTL low ({ttl}s), renewal recommended",
                extra={"ttl": ttl}
            )
        
        # Add token info to request state for debugging
        request.state.vault_token_ttl = ttl
        request.state.vault_token_renewable = renewable
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(
            "Vault token validation failed",
            extra={"error": str(e)},
            exc_info=True
        )
        
        # Return 503 if Vault is unreachable
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Security service unavailable",
                "detail": "Unable to validate security credentials",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    # Continue with request
    response = await call_next(request)
    
    # Add Vault token TTL header for debugging (non-production only)
    if request.state.vault_token_ttl and not request.app.state.is_production:
        response.headers["X-Vault-Token-TTL"] = str(request.state.vault_token_ttl)
    
    return response


async def vault_health_dependency(request: Request):
    """
    FastAPI dependency to check Vault health
    Can be used on specific routes that require Vault
    
    Usage:
        @app.get("/secrets", dependencies=[Depends(vault_health_dependency)])
        async def get_secrets():
            ...
    """
    try:
        health = vault_client.health_check()
        
        if health.get('sealed', True):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vault is sealed"
            )
        
        if not health.get('authenticated', False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Vault authentication invalid"
            )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Vault health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vault is unreachable"
        )


def check_vault_secret_exists(path: str) -> bool:
    """
    Helper function to check if a secret exists in Vault
    
    Args:
        path: Secret path
        
    Returns:
        True if secret exists, False otherwise
    """
    try:
        vault_client.get_secret(path)
        return True
    except KeyError:
        return False
    except Exception as e:
        logger.error(f"Error checking secret {path}: {e}")
        return False
