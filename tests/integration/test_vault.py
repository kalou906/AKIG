# tests/integration/test_vault.py
"""
Integration Tests for HashiCorp Vault
Tests Vault client functionality, authentication, and secret operations
"""
import pytest
import os
from utils.vault_client import VaultClient, vault_client
from config import Config

# Skip tests if Vault not available
pytestmark = pytest.mark.skipif(
    not os.getenv('VAULT_ADDR'),
    reason="Vault not configured (VAULT_ADDR not set)"
)

class TestVaultConnection:
    """Test Vault connectivity and authentication"""
    
    def test_vault_client_initialization(self):
        """Test that Vault client initializes correctly"""
        assert vault_client is not None
        assert vault_client.vault_url == os.getenv('VAULT_ADDR', 'http://vault:8200')
    
    def test_vault_authentication(self):
        """Test Vault authentication"""
        assert vault_client.client.is_authenticated()
    
    def test_vault_health_check(self):
        """Test Vault health check"""
        health = vault_client.health_check()
        
        assert 'initialized' in health
        assert 'sealed' in health
        assert 'authenticated' in health
        
        # Vault should be initialized and unsealed
        assert health['initialized'] is True
        assert health['sealed'] is False
        assert health['authenticated'] is True

class TestVaultSecrets:
    """Test secret operations"""
    
    def test_create_and_read_secret(self):
        """Test creating and reading a secret"""
        test_path = 'secret/test/integration'
        test_data = {
            'key1': 'value1',
            'key2': 'value2',
            'timestamp': '2025-11-16T10:00:00Z'
        }
        
        # Write secret
        vault_client.set_secret(test_path, test_data)
        
        # Read secret
        retrieved = vault_client.get_secret(f'secret/data/{test_path}')
        
        assert retrieved == test_data
        assert retrieved['key1'] == 'value1'
        assert retrieved['key2'] == 'value2'
    
    def test_read_secret_with_key(self):
        """Test reading a specific key from secret"""
        test_path = 'secret/test/integration'
        test_data = {'specific_key': 'specific_value'}
        
        vault_client.set_secret(test_path, test_data)
        
        # Read specific key
        value = vault_client.get_secret(f'secret/data/{test_path}', 'specific_key')
        
        assert value == 'specific_value'
    
    def test_read_nonexistent_secret(self):
        """Test reading a secret that doesn't exist"""
        with pytest.raises(KeyError):
            vault_client.get_secret('secret/data/nonexistent/path')
    
    def test_delete_secret(self):
        """Test deleting a secret"""
        test_path = 'secret/test/to-delete'
        test_data = {'temp': 'data'}
        
        # Create
        vault_client.set_secret(test_path, test_data)
        
        # Verify exists
        retrieved = vault_client.get_secret(f'secret/data/{test_path}')
        assert retrieved == test_data
        
        # Delete
        vault_client.delete_secret(test_path)
        
        # Verify deleted
        with pytest.raises(KeyError):
            vault_client.get_secret(f'secret/data/{test_path}')

class TestDynamicDatabaseCredentials:
    """Test dynamic database credential generation"""
    
    @pytest.mark.skipif(
        not os.getenv('ENABLE_DYNAMIC_DB_CREDS'),
        reason="Dynamic DB credentials not configured"
    )
    def test_generate_database_credentials(self):
        """Test generating dynamic database credentials"""
        creds = vault_client.get_database_credentials(role='solvency-app')
        
        assert 'username' in creds
        assert 'password' in creds
        assert 'lease_id' in creds
        assert 'lease_duration' in creds
        
        # Username should start with role prefix
        assert creds['username'].startswith('v-')
        
        # Password should be secure (at least 20 chars)
        assert len(creds['password']) >= 20
        
        # Lease should be valid
        assert creds['lease_duration'] > 0
    
    @pytest.mark.skipif(
        not os.getenv('ENABLE_DYNAMIC_DB_CREDS'),
        reason="Dynamic DB credentials not configured"
    )
    def test_revoke_database_credentials(self):
        """Test revoking dynamic database credentials"""
        # Generate credentials
        creds = vault_client.get_database_credentials(role='solvency-app')
        lease_id = creds['lease_id']
        
        # Revoke
        vault_client.revoke_database_credentials(lease_id)
        
        # Note: Verifying revocation would require trying to use the creds,
        # which would need actual database connection

class TestTransitEncryption:
    """Test Transit encryption engine"""
    
    @pytest.mark.skipif(
        not os.getenv('ENABLE_TRANSIT_ENCRYPTION'),
        reason="Transit encryption not configured"
    )
    def test_encrypt_decrypt(self):
        """Test encrypting and decrypting data"""
        plaintext = "sensitive data to encrypt"
        
        # Encrypt
        ciphertext = vault_client.encrypt(plaintext, key_name='solvency-key')
        
        # Ciphertext should be different from plaintext
        assert ciphertext != plaintext
        assert ciphertext.startswith('vault:v')
        
        # Decrypt
        decrypted = vault_client.decrypt(ciphertext, key_name='solvency-key')
        
        # Decrypted should match original
        assert decrypted == plaintext
    
    @pytest.mark.skipif(
        not os.getenv('ENABLE_TRANSIT_ENCRYPTION'),
        reason="Transit encryption not configured"
    )
    def test_encrypt_multiple_values(self):
        """Test encrypting multiple different values"""
        values = [
            "secret1",
            "secret2",
            "secret3"
        ]
        
        ciphertexts = []
        
        for value in values:
            ciphertext = vault_client.encrypt(value)
            ciphertexts.append(ciphertext)
            
            # Decrypt and verify
            decrypted = vault_client.decrypt(ciphertext)
            assert decrypted == value
        
        # All ciphertexts should be unique
        assert len(set(ciphertexts)) == len(ciphertexts)

class TestTLSCertificates:
    """Test PKI certificate generation"""
    
    @pytest.mark.skipif(
        not os.getenv('ENABLE_PKI'),
        reason="PKI not configured"
    )
    def test_generate_tls_certificate(self):
        """Test generating TLS certificate"""
        cert_data = vault_client.get_tls_certificate(
            role='solvency-api',
            common_name='api.solvency.local',
            alt_names=['api.akig.local', 'localhost'],
            ttl='720h'
        )
        
        assert 'certificate' in cert_data
        assert 'private_key' in cert_data
        assert 'ca_chain' in cert_data
        assert 'serial_number' in cert_data
        
        # Certificate should be PEM format
        assert '-----BEGIN CERTIFICATE-----' in cert_data['certificate']
        assert '-----END CERTIFICATE-----' in cert_data['certificate']
        
        # Private key should be PEM format
        assert '-----BEGIN' in cert_data['private_key']
        assert '-----END' in cert_data['private_key']

class TestConfigIntegration:
    """Test Config class integration with Vault"""
    
    def test_get_jwt_secret_from_vault(self):
        """Test getting JWT secret from Vault"""
        # This will use Vault if available, or fallback to env
        jwt_secret = Config.get_jwt_secret()
        
        assert jwt_secret is not None
        assert len(jwt_secret) >= 32  # Should be strong secret
    
    def test_get_database_url_from_vault(self):
        """Test getting database URL from Vault"""
        database_url = Config.get_database_url()
        
        assert database_url is not None
        assert database_url.startswith('postgresql://')
    
    def test_get_redis_url_from_vault(self):
        """Test getting Redis URL from Vault"""
        redis_url = Config.get_redis_url()
        
        assert redis_url is not None
        assert redis_url.startswith('redis://')
    
    def test_get_aws_credentials_from_vault(self):
        """Test getting AWS credentials from Vault"""
        aws_creds = Config.get_aws_credentials()
        
        assert isinstance(aws_creds, dict)
        assert 'AWS_REGION' in aws_creds

class TestTokenRenewal:
    """Test automatic token renewal"""
    
    def test_token_has_sufficient_ttl(self):
        """Test that token has sufficient TTL"""
        token_info = vault_client.client.auth.token.lookup_self()
        ttl = token_info['data']['ttl']
        
        # Token should have at least 1 hour TTL
        assert ttl >= 3600, f"Token TTL too low: {ttl}s"
    
    def test_token_is_renewable(self):
        """Test that token is renewable"""
        token_info = vault_client.client.auth.token.lookup_self()
        
        assert token_info['data']['renewable'] is True

# Fixtures
@pytest.fixture(scope="module")
def vault_test_secrets():
    """Create test secrets for the test suite"""
    test_secrets = {
        'secret/test/integration': {
            'test_key': 'test_value',
            'created_at': '2025-11-16'
        }
    }
    
    # Create secrets
    for path, data in test_secrets.items():
        vault_client.set_secret(path, data)
    
    yield test_secrets
    
    # Cleanup
    for path in test_secrets.keys():
        try:
            vault_client.delete_secret(path)
        except:
            pass
