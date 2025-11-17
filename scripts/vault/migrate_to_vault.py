#!/usr/bin/env python3
"""
Migration Script: .env → HashiCorp Vault
Migrates all secrets from environment files to Vault KV v2

Usage:
    python migrate_to_vault.py --env-file .env.prod --vault-addr http://vault:8200
    python migrate_to_vault.py --dry-run  # Test without writing
"""
import os
import sys
import argparse
import hvac
from dotenv import load_dotenv
from typing import Dict, List
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Secret categories and their Vault paths
SECRET_CATEGORIES = {
    'api': {
        'path': 'secret/data/solvency/api',
        'keys': [
            'JWT_SECRET',
            'JWT_EXPIRES_IN',
            'SENDGRID_API_KEY',
            'VAPID_PUBLIC_KEY',
            'VAPID_PRIVATE_KEY',
            'SENTRY_DSN',
        ]
    },
    'database': {
        'path': 'secret/data/solvency/database',
        'keys': [
            'POSTGRES_PASSWORD',
            'DB_PASSWORD',
            'REDIS_PASSWORD',
        ]
    },
    'aws': {
        'path': 'secret/data/solvency/aws',
        'keys': [
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'AWS_REGION',
        ]
    },
    'smtp': {
        'path': 'secret/data/solvency/smtp',
        'keys': [
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASS',
            'SMS_API_KEY',
            'SMS_API_SECRET',
        ]
    },
    'banking': {
        'path': 'secret/data/solvency/banking',
        'keys': [
            'BANK_API_KEY',
            'ORANGE_MONEY_API_KEY',
            'ORANGE_MONEY_SECRET',
        ]
    },
    'monitoring': {
        'path': 'secret/data/solvency/monitoring',
        'keys': [
            'GRAFANA_PASSWORD',
            'PGADMIN_PASSWORD',
        ]
    }
}

def connect_vault(vault_addr: str, token: str = None) -> hvac.Client:
    """Connect to Vault server"""
    client = hvac.Client(url=vault_addr)
    
    # Authenticate
    if token:
        client.token = token
    elif os.getenv('VAULT_TOKEN'):
        client.token = os.getenv('VAULT_TOKEN')
    else:
        logger.error("No Vault token provided. Set VAULT_TOKEN env var or use --token")
        sys.exit(1)
    
    # Verify authentication
    if not client.is_authenticated():
        logger.error("Failed to authenticate with Vault")
        sys.exit(1)
    
    logger.info(f"✅ Connected to Vault at {vault_addr}")
    return client

def setup_kv_engine(client: hvac.Client):
    """Enable KV v2 secrets engine if not already enabled"""
    try:
        mounts = client.sys.list_mounted_secrets_engines()
        
        if 'secret/' not in mounts:
            logger.info("Enabling KV v2 secrets engine at 'secret/'")
            client.sys.enable_secrets_engine(
                backend_type='kv',
                path='secret',
                options={'version': '2'}
            )
        else:
            logger.info("KV v2 secrets engine already enabled")
    
    except hvac.exceptions.InvalidRequest as e:
        logger.warning(f"Secrets engine setup: {e}")

def load_secrets_from_env(env_file: str) -> Dict[str, str]:
    """Load all secrets from .env file"""
    if not os.path.exists(env_file):
        logger.error(f"Environment file not found: {env_file}")
        sys.exit(1)
    
    load_dotenv(env_file)
    
    # Get all environment variables
    all_secrets = {}
    for category, config in SECRET_CATEGORIES.items():
        for key in config['keys']:
            value = os.getenv(key)
            if value:
                all_secrets[key] = value
    
    logger.info(f"✅ Loaded {len(all_secrets)} secrets from {env_file}")
    return all_secrets

def migrate_secrets(
    client: hvac.Client,
    secrets: Dict[str, str],
    dry_run: bool = False
) -> int:
    """
    Migrate secrets to Vault
    
    Returns:
        Number of secrets migrated
    """
    migrated_count = 0
    
    for category, config in SECRET_CATEGORIES.items():
        path = config['path']
        category_secrets = {}
        
        # Collect secrets for this category
        for key in config['keys']:
            if key in secrets:
                category_secrets[key] = secrets[key]
        
        if not category_secrets:
            logger.info(f"⏭️  No secrets to migrate for category: {category}")
            continue
        
        # Write to Vault
        if dry_run:
            logger.info(f"[DRY RUN] Would write {len(category_secrets)} secrets to {path}")
            for key in category_secrets.keys():
                logger.info(f"  - {key}")
        else:
            try:
                client.secrets.kv.v2.create_or_update_secret(
                    path=path.replace('secret/data/', ''),  # Remove /data/ prefix for write
                    secret=category_secrets
                )
                
                logger.info(f"✅ Migrated {len(category_secrets)} secrets to {path}")
                for key in category_secrets.keys():
                    logger.info(f"  ✓ {key}")
                
                migrated_count += len(category_secrets)
            
            except Exception as e:
                logger.error(f"❌ Failed to write to {path}: {e}")
    
    return migrated_count

def verify_migration(client: hvac.Client, original_secrets: Dict[str, str]) -> bool:
    """Verify all secrets were migrated correctly"""
    logger.info("\n🔍 Verifying migration...")
    
    all_ok = True
    
    for category, config in SECRET_CATEGORIES.items():
        path = config['path']
        
        try:
            response = client.secrets.kv.v2.read_secret_version(
                path=path.replace('secret/data/', '')
            )
            vault_secrets = response['data']['data']
            
            # Check each key
            for key in config['keys']:
                if key in original_secrets:
                    if key not in vault_secrets:
                        logger.error(f"❌ Missing in Vault: {key}")
                        all_ok = False
                    elif vault_secrets[key] != original_secrets[key]:
                        logger.error(f"❌ Mismatch for {key}")
                        all_ok = False
                    else:
                        logger.debug(f"✓ {key}")
        
        except hvac.exceptions.InvalidPath:
            # No secrets in this category
            pass
        except Exception as e:
            logger.error(f"❌ Verification failed for {category}: {e}")
            all_ok = False
    
    if all_ok:
        logger.info("✅ All secrets verified successfully")
    else:
        logger.error("❌ Verification failed - some secrets missing or incorrect")
    
    return all_ok

def generate_migration_report(migrated_count: int, total_found: int):
    """Generate migration summary report"""
    logger.info("\n" + "=" * 60)
    logger.info("MIGRATION REPORT")
    logger.info("=" * 60)
    logger.info(f"Total secrets found:     {total_found}")
    logger.info(f"Secrets migrated:        {migrated_count}")
    logger.info(f"Success rate:            {(migrated_count/total_found*100) if total_found > 0 else 0:.1f}%")
    logger.info("=" * 60)

def main():
    parser = argparse.ArgumentParser(
        description='Migrate secrets from .env to HashiCorp Vault'
    )
    parser.add_argument(
        '--env-file',
        required=True,
        help='Path to .env file (e.g., .env.prod)'
    )
    parser.add_argument(
        '--vault-addr',
        default=os.getenv('VAULT_ADDR', 'http://vault:8200'),
        help='Vault server address'
    )
    parser.add_argument(
        '--token',
        help='Vault token (or set VAULT_TOKEN env var)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Test without actually writing to Vault'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Verify migration after completion'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Banner
    logger.info("=" * 60)
    logger.info("AKIG Secret Migration: .env → Vault")
    logger.info("=" * 60)
    
    # Connect to Vault
    client = connect_vault(args.vault_addr, args.token)
    
    # Setup KV engine
    if not args.dry_run:
        setup_kv_engine(client)
    
    # Load secrets from .env
    secrets = load_secrets_from_env(args.env_file)
    
    # Migrate secrets
    migrated_count = migrate_secrets(client, secrets, args.dry_run)
    
    # Verify if requested
    if args.verify and not args.dry_run:
        verify_migration(client, secrets)
    
    # Generate report
    generate_migration_report(migrated_count, len(secrets))
    
    # Final message
    if args.dry_run:
        logger.info("\n✅ Dry run completed. Run without --dry-run to migrate.")
    else:
        logger.info("\n✅ Migration completed successfully!")
        logger.info("\n⚠️  NEXT STEPS:")
        logger.info("1. Update backend config to use Vault client")
        logger.info("2. Test application with Vault secrets")
        logger.info("3. Backup and remove .env files")
        logger.info("4. Update deployment configs (docker-compose, K8s)")

if __name__ == '__main__':
    main()
