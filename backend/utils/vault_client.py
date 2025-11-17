# backend/utils/vault_client.py
"""
HashiCorp Vault Client with Auto-Renewal and Multi-Auth Support
- Kubernetes auth (production)
- Token auth (development)
- Automatic token renewal
- Dynamic database credentials
- TLS certificate generation
"""
import os
import hvac
import threading
import time
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class VaultClient:
    """
    Vault client with automatic authentication and token renewal
    """
    
    def __init__(
        self,
        vault_url: Optional[str] = None,
        namespace: Optional[str] = None
    ):
        """
        Initialize Vault client
        
        Args:
            vault_url: Vault server URL (defaults to VAULT_ADDR env var)
            namespace: Vault namespace (for Vault Enterprise)
        """
        self.vault_url = vault_url or os.getenv('VAULT_ADDR', 'http://vault:8200')
        self.namespace = namespace or os.getenv('VAULT_NAMESPACE')
        
        # Initialize client
        self.client = hvac.Client(
            url=self.vault_url,
            namespace=self.namespace
        )
        
        # Authenticate
        self._authenticate()
        
        # Start token renewal thread
        self._start_token_renewal()
        
        logger.info(
            "Vault client initialized",
            extra={
                "vault_url": self.vault_url,
                "authenticated": self.client.is_authenticated()
            }
        )
    
    def _authenticate(self):
        """
        Authenticate with Vault using the best available method
        Priority: Kubernetes > AppRole > Token
        """
        # 1. Try Kubernetes auth (in-cluster)
        if self._try_kubernetes_auth():
            logger.info("Authenticated to Vault via Kubernetes")
            return
        
        # 2. Try AppRole auth
        if self._try_approle_auth():
            logger.info("Authenticated to Vault via AppRole")
            return
        
        # 3. Fallback to token (dev mode)
        if self._try_token_auth():
            logger.info("Authenticated to Vault via token")
            return
        
        raise Exception("No Vault authentication method available")
    
    def _try_kubernetes_auth(self) -> bool:
        """Authenticate using Kubernetes service account"""
        jwt_path = '/var/run/secrets/kubernetes.io/serviceaccount/token'
        
        if not os.path.exists(jwt_path):
            return False
        
        try:
            with open(jwt_path) as f:
                jwt = f.read()
            
            role = os.getenv('VAULT_K8S_ROLE', 'solvency-api')
            
            response = self.client.auth.kubernetes.login(
                role=role,
                jwt=jwt
            )
            
            self.client.token = response['auth']['client_token']
            return True
        
        except Exception as e:
            logger.warning(f"Kubernetes auth failed: {e}")
            return False
    
    def _try_approle_auth(self) -> bool:
        """Authenticate using AppRole"""
        role_id = os.getenv('VAULT_ROLE_ID')
        secret_id = os.getenv('VAULT_SECRET_ID')
        
        if not role_id or not secret_id:
            return False
        
        try:
            response = self.client.auth.approle.login(
                role_id=role_id,
                secret_id=secret_id
            )
            
            self.client.token = response['auth']['client_token']
            return True
        
        except Exception as e:
            logger.warning(f"AppRole auth failed: {e}")
            return False
    
    def _try_token_auth(self) -> bool:
        """Authenticate using static token (dev only)"""
        token = os.getenv('VAULT_TOKEN')
        
        if not token:
            return False
        
        try:
            self.client.token = token
            
            # Verify token is valid
            self.client.auth.token.lookup_self()
            return True
        
        except Exception as e:
            logger.warning(f"Token auth failed: {e}")
            return False
    
    def _start_token_renewal(self):
        """Start background thread for token renewal"""
        def renew_loop():
            while True:
                try:
                    # Check token TTL
                    token_info = self.client.auth.token.lookup_self()
                    ttl = token_info['data']['ttl']
                    
                    # Renew if TTL < 1 hour
                    if ttl < 3600:
                        self.client.auth.token.renew_self()
                        logger.info("Vault token renewed")
                    
                    # Sleep for 30 minutes
                    time.sleep(1800)
                
                except Exception as e:
                    logger.error(f"Token renewal failed: {e}")
                    time.sleep(60)
        
        thread = threading.Thread(target=renew_loop, daemon=True, name="vault-token-renew")
        thread.start()
    
    # ========================================
    # SECRET OPERATIONS
    # ========================================
    
    def get_secret(self, path: str, key: Optional[str] = None) -> Any:
        """
        Get secret from Vault KV v2
        
        Args:
            path: Secret path (e.g., 'secret/data/solvency/api')
            key: Optional key to extract from secret
            
        Returns:
            Secret data (dict or specific value if key provided)
        """
        try:
            response = self.client.secrets.kv.v2.read_secret_version(path=path)
            data = response['data']['data']
            
            if key:
                return data.get(key)
            return data
        
        except hvac.exceptions.InvalidPath:
            logger.error(f"Secret not found: {path}")
            raise KeyError(f"Secret not found: {path}")
        
        except Exception as e:
            logger.error(f"Failed to read secret {path}: {e}")
            raise
    
    def set_secret(self, path: str, data: Dict[str, Any]):
        """
        Write secret to Vault KV v2
        
        Args:
            path: Secret path
            data: Secret data (dict)
        """
        try:
            self.client.secrets.kv.v2.create_or_update_secret(
                path=path,
                secret=data
            )
            logger.info(f"Secret written: {path}")
        
        except Exception as e:
            logger.error(f"Failed to write secret {path}: {e}")
            raise
    
    def delete_secret(self, path: str):
        """Delete secret from Vault"""
        try:
            self.client.secrets.kv.v2.delete_metadata_and_all_versions(path=path)
            logger.info(f"Secret deleted: {path}")
        except Exception as e:
            logger.error(f"Failed to delete secret {path}: {e}")
            raise
    
    # ========================================
    # DYNAMIC CREDENTIALS
    # ========================================
    
    def get_database_credentials(self, role: str = "solvency-app") -> Dict[str, str]:
        """
        Get dynamic database credentials (auto-rotating)
        
        Args:
            role: Vault database role name
            
        Returns:
            Dict with 'username' and 'password'
        """
        try:
            response = self.client.secrets.database.generate_credentials(name=role)
            
            creds = {
                'username': response['data']['username'],
                'password': response['data']['password'],
                'lease_id': response['lease_id'],
                'lease_duration': response['lease_duration']
            }
            
            logger.info(
                f"Generated DB credentials for role {role}",
                extra={"lease_duration": creds['lease_duration']}
            )
            
            return creds
        
        except Exception as e:
            logger.error(f"Failed to generate DB credentials: {e}")
            raise
    
    def revoke_database_credentials(self, lease_id: str):
        """Revoke dynamic database credentials"""
        try:
            self.client.sys.revoke_lease(lease_id)
            logger.info(f"Revoked DB credentials: {lease_id}")
        except Exception as e:
            logger.error(f"Failed to revoke lease {lease_id}: {e}")
            raise
    
    # ========================================
    # TLS CERTIFICATES
    # ========================================
    
    def get_tls_certificate(
        self,
        role: str,
        common_name: str,
        alt_names: Optional[list] = None,
        ttl: str = "720h"  # 30 days
    ) -> Dict[str, str]:
        """
        Generate TLS certificate from Vault PKI
        
        Args:
            role: PKI role name
            common_name: Certificate common name
            alt_names: Subject alternative names
            ttl: Certificate TTL
            
        Returns:
            Dict with 'certificate', 'private_key', 'ca_chain'
        """
        try:
            response = self.client.secrets.pki.generate_certificate(
                name=role,
                common_name=common_name,
                alt_names=alt_names or [],
                ttl=ttl
            )
            
            return {
                'certificate': response['data']['certificate'],
                'private_key': response['data']['private_key'],
                'ca_chain': response['data']['ca_chain'],
                'serial_number': response['data']['serial_number']
            }
        
        except Exception as e:
            logger.error(f"Failed to generate TLS certificate: {e}")
            raise
    
    # ========================================
    # TRANSIT ENCRYPTION
    # ========================================
    
    def encrypt(self, plaintext: str, key_name: str = "solvency-key") -> str:
        """
        Encrypt data using Vault Transit engine
        
        Args:
            plaintext: Data to encrypt
            key_name: Transit key name
            
        Returns:
            Encrypted ciphertext
        """
        try:
            import base64
            
            plaintext_b64 = base64.b64encode(plaintext.encode()).decode()
            
            response = self.client.secrets.transit.encrypt_data(
                name=key_name,
                plaintext=plaintext_b64
            )
            
            return response['data']['ciphertext']
        
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt(self, ciphertext: str, key_name: str = "solvency-key") -> str:
        """
        Decrypt data using Vault Transit engine
        
        Args:
            ciphertext: Data to decrypt
            key_name: Transit key name
            
        Returns:
            Decrypted plaintext
        """
        try:
            import base64
            
            response = self.client.secrets.transit.decrypt_data(
                name=key_name,
                ciphertext=ciphertext
            )
            
            plaintext_b64 = response['data']['plaintext']
            return base64.b64decode(plaintext_b64).decode()
        
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    # ========================================
    # HEALTH CHECK
    # ========================================
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check Vault health status
        
        Returns:
            Health status dict
        """
        try:
            health = self.client.sys.read_health_status(method='GET')
            
            return {
                'initialized': health.get('initialized', False),
                'sealed': health.get('sealed', True),
                'standby': health.get('standby', False),
                'version': health.get('version', 'unknown'),
                'cluster_name': health.get('cluster_name'),
                'authenticated': self.client.is_authenticated()
            }
        
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'error': str(e),
                'authenticated': False
            }


# ========================================
# SINGLETON INSTANCE
# ========================================
_vault_client: Optional[VaultClient] = None

def get_vault_client() -> VaultClient:
    """Get or create singleton Vault client"""
    global _vault_client
    
    if _vault_client is None:
        _vault_client = VaultClient()
    
    return _vault_client


# Convenience export
vault_client = get_vault_client()
