import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

class EncryptionService:
    """
    AES-256-GCM Encryption Service
    Provides authenticated encryption for sensitive legal data.
    """
    def __init__(self, key: str = None):
        if not key:
            # Derive 32-byte key for AES-256 from secret_key
            secret = settings.secret_key or "default-lexportal-secret-key-32-chars"
            self.raw_key = hashlib.sha256(secret.encode()).digest()
        else:
            self.raw_key = base64.b64decode(key) if isinstance(key, str) and "=" in key else key.encode()
            if len(self.raw_key) != 32:
                self.raw_key = hashlib.sha256(self.raw_key).digest()
        
        self.aes_gcm = AESGCM(self.raw_key)

    def encrypt(self, data: str) -> str:
        if not data:
            return ""
        
        nonce = os.urandom(12)
        ciphertext = self.aes_gcm.encrypt(nonce, data.encode(), None)
        # Store as base64(nonce + ciphertext)
        return base64.b64encode(nonce + ciphertext).decode('utf-8')

    def decrypt(self, encrypted_data: str) -> str:
        if not encrypted_data:
            return ""
        
        try:
            combined = base64.b64decode(encrypted_data)
            nonce = combined[:12]
            ciphertext = combined[12:]
            
            decrypted = self.aes_gcm.decrypt(nonce, ciphertext, None)
            return decrypted.decode('utf-8')
        except Exception as e:
            # Fallback for old Fernet tokens if we were in transition (optional)
            # For this fresh implementation, we just return empty/error message
            return "[Błąd odszyfrowania: AES-GCM Integrity Failure]"

# Singleton instance
encryption_service = EncryptionService()
