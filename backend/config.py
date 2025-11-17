# backend/config.py
"""
Configuration Management with HashiCorp Vault Integration
Loads secrets dynamically from Vault instead of environment variables

Usage:
    from config import Config
    
    database_url = Config.get_database_url()
    jwt_secret = Config.get_jwt_secret()
"""
import os
from typing import Optional
from utils.vault_client import vault_client
import logging

logger = logging.getLogger(__name__)

class Config:
    """
    Centralized configuration class with Vault integration
    Falls back to environment variables if Vault is unavailable
    """
    
    # Feature flag for Vault usage
    USE_VAULT = os.getenv('USE_VAULT', 'true').lower() == 'true'
    
    @classmethod
    def _get_from_vault_or_env(
        cls,
        vault_path: str,
        vault_key: str,
        env_key: str,
        default: Optional[str] = None
    ) -> Optional[str]:
        """
        Get value from Vault, fallback to env var
        
        Args:
            vault_path: Vault secret path
            vault_key: Key within the secret
            env_key: Environment variable name (fallback)
            default: Default value if not found
            
        Returns:
            Secret value or None
        """
        if cls.USE_VAULT:
            try:
                value = vault_client.get_secret(vault_path, vault_key)
                if value:
                    logger.debug(f"Loaded {vault_key} from Vault")
                    return value
            except Exception as e:
                logger.warning(f"Failed to get {vault_key} from Vault, using env: {e}")
        
        # Fallback to environment variable
        return os.getenv(env_key, default)
    
    # ========================================
    # DATABASE
    # ========================================
    
    @classmethod
    def get_database_url(cls) -> str:
        """
        Get database connection URL with dynamic credentials
        
        Returns:
            PostgreSQL connection string
        """
        # Option 1: Use dynamic DB credentials (recommended for production)
        if cls.USE_VAULT and os.getenv('USE_VAULT_DB_CREDS', 'false').lower() == 'true':
            try:
                creds = vault_client.get_database_credentials(role='solvency-app')
                
                db_host = os.getenv('DB_HOST', 'postgres')
                db_port = os.getenv('DB_PORT', '5432')
                db_name = os.getenv('DB_NAME', 'solvency_dev')
                
                url = f"postgresql://{creds['username']}:{creds['password']}@{db_host}:{db_port}/{db_name}"
                logger.info("Using dynamic database credentials from Vault")
                return url
            
            except Exception as e:
                logger.error(f"Failed to get dynamic DB creds: {e}")
                # Fall through to static credentials
        
        # Option 2: Use static password from Vault
        db_password = cls._get_from_vault_or_env(
            'secret/data/solvency/database',
            'POSTGRES_PASSWORD',
            'POSTGRES_PASSWORD'
        )
        
        if db_password:
            db_user = os.getenv('POSTGRES_USER', 'user')
            db_host = os.getenv('DB_HOST', 'postgres')
            db_port = os.getenv('DB_PORT', '5432')
            db_name = os.getenv('DB_NAME', 'solvency_dev')
            
            return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        # Option 3: Fallback to DATABASE_URL env var
        return os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/solvency_dev')
    
    @classmethod
    def get_redis_url(cls) -> str:
        """Get Redis connection string with password"""
        redis_password = cls._get_from_vault_or_env(
            'secret/data/solvency/database',
            'REDIS_PASSWORD',
            'REDIS_PASSWORD'
        )
        
        redis_host = os.getenv('REDIS_HOST', 'redis')
        redis_port = os.getenv('REDIS_PORT', '6379')
        
        if redis_password:
            return f"redis://:{redis_password}@{redis_host}:{redis_port}/0"
        else:
            return f"redis://{redis_host}:{redis_port}/0"
    
    # ========================================
    # AUTHENTICATION & SECURITY
    # ========================================
    
    @classmethod
    def get_jwt_secret(cls) -> str:
        """Get JWT secret key"""
        return cls._get_from_vault_or_env(
            'secret/data/solvency/api',
            'JWT_SECRET',
            'JWT_SECRET',
            'dev-secret-key-change-in-production'
        )
    
    @classmethod
    def get_jwt_expires_in(cls) -> str:
        """Get JWT expiration time"""
        return cls._get_from_vault_or_env(
            'secret/data/solvency/api',
            'JWT_EXPIRES_IN',
            'JWT_EXPIRES_IN',
            '24h'
        )
    
    # ========================================
    # EXTERNAL SERVICES
    # ========================================
    
    @classmethod
    def get_sendgrid_api_key(cls) -> Optional[str]:
        """Get SendGrid API key for emails"""
        return cls._get_from_vault_or_env(
            'secret/data/solvency/api',
            'SENDGRID_API_KEY',
            'SENDGRID_API_KEY'
        )
    
    @classmethod
    def get_vapid_keys(cls) -> dict:
        """Get VAPID keys for push notifications"""
        return {
            'public_key': cls._get_from_vault_or_env(
                'secret/data/solvency/api',
                'VAPID_PUBLIC_KEY',
                'VAPID_PUBLIC_KEY'
            ),
            'private_key': cls._get_from_vault_or_env(
                'secret/data/solvency/api',
                'VAPID_PRIVATE_KEY',
                'VAPID_PRIVATE_KEY'
            )
        }
    
    @classmethod
    def get_sentry_dsn(cls) -> Optional[str]:
        """Get Sentry DSN for error tracking"""
        return cls._get_from_vault_or_env(
            'secret/data/solvency/api',
            'SENTRY_DSN',
            'SENTRY_DSN'
        )
    
    # ========================================
    # AWS CREDENTIALS
    # ========================================
    
    @classmethod
    def get_aws_credentials(cls) -> dict:
        """Get AWS credentials"""
        if cls.USE_VAULT:
            try:
                return vault_client.get_secret('secret/data/solvency/aws')
            except:
                pass
        
        return {
            'AWS_ACCESS_KEY_ID': os.getenv('AWS_ACCESS_KEY_ID'),
            'AWS_SECRET_ACCESS_KEY': os.getenv('AWS_SECRET_ACCESS_KEY'),
            'AWS_REGION': os.getenv('AWS_REGION', 'eu-west-1')
        }
    
    # ========================================
    # SMTP / EMAIL
    # ========================================
    
    @classmethod
    def get_smtp_config(cls) -> dict:
        """Get SMTP configuration"""
        return {
            'host': cls._get_from_vault_or_env(
                'secret/data/solvency/smtp',
                'SMTP_HOST',
                'SMTP_HOST',
                'localhost'
            ),
            'port': int(cls._get_from_vault_or_env(
                'secret/data/solvency/smtp',
                'SMTP_PORT',
                'SMTP_PORT',
                '587'
            )),
            'user': cls._get_from_vault_or_env(
                'secret/data/solvency/smtp',
                'SMTP_USER',
                'SMTP_USER'
            ),
            'password': cls._get_from_vault_or_env(
                'secret/data/solvency/smtp',
                'SMTP_PASS',
                'SMTP_PASS'
            ),
            'use_tls': True
        }
    
    # ========================================
    # BANKING INTEGRATIONS
    # ========================================
    
    @classmethod
    def get_bank_api_key(cls) -> Optional[str]:
        """Get bank API key"""
        return cls._get_from_vault_or_env(
            'secret/data/solvency/banking',
            'BANK_API_KEY',
            'BANK_API_KEY'
        )
    
    @classmethod
    def get_orange_money_credentials(cls) -> dict:
        """Get Orange Money API credentials"""
        return {
            'api_key': cls._get_from_vault_or_env(
                'secret/data/solvency/banking',
                'ORANGE_MONEY_API_KEY',
                'ORANGE_MONEY_API_KEY'
            ),
            'secret': cls._get_from_vault_or_env(
                'secret/data/solvency/banking',
                'ORANGE_MONEY_SECRET',
                'ORANGE_MONEY_SECRET'
            )
        }
    
    # ========================================
    # MONITORING
    # ========================================
    
    @classmethod
    def get_grafana_password(cls) -> str:
        """Get Grafana admin password"""
        return cls._get_from_vault_or_env(
            'secret/data/solvency/monitoring',
            'GRAFANA_PASSWORD',
            'GRAFANA_PASSWORD',
            'admin'
        )
    
    # ========================================
    # GENERAL SETTINGS
    # ========================================
    
    @classmethod
    def get_environment(cls) -> str:
        """Get environment name"""
        return os.getenv('NODE_ENV', 'development')
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production"""
        return cls.get_environment() == 'production'
    
    @classmethod
    def get_log_level(cls) -> str:
        """Get log level"""
        return os.getenv('LOG_LEVEL', 'info')
    
    @classmethod
    def get_port(cls) -> int:
        """Get API port"""
        return int(os.getenv('PORT', '8000'))


# ========================================
# CONVENIENCE EXPORTS
# ========================================

# Database
DATABASE_URL = Config.get_database_url()
REDIS_URL = Config.get_redis_url()

# Security
JWT_SECRET = Config.get_jwt_secret()
JWT_EXPIRES_IN = Config.get_jwt_expires_in()

# Environment
ENVIRONMENT = Config.get_environment()
IS_PRODUCTION = Config.is_production()
LOG_LEVEL = Config.get_log_level()
PORT = Config.get_port()
