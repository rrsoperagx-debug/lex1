# =============================================================================
# LexPortal API - Moduł Bezpieczeństwa i Uwierzytelniania
# =============================================================================
#
# Ten plik zawiera kluczowe funkcje związane z bezpieczeństwem, takie jak
# hashowanie haseł i generowanie tokenów JWT.
#
# Kluczowe Komponenty:
#   - pwd_context: Konfiguracja `passlib` do bezpiecznego hashowania haseł
#                  przy użyciu algorytmu Argon2id.
#   - create_access_token: Generuje tokeny dostępowe JWT dla użytkowników.
#   - verify_password: Weryfikuje, czy podane hasło pasuje do hasha.
#   - get_password_hash: Haszuje hasło przed zapisaniem go do bazy danych.
#
# =============================================================================
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional, Union

from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings


# Argon2id configuration with production-grade security parameters
# Memory cost: 64 MB (65536 KiB) - resistant to GPU/ASIC attacks
# Time cost: 3 iterations - balance between security and performance
# Parallelism: 4 threads - utilizes modern multi-core CPUs
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,  # 64 MB
    argon2__time_cost=3,        # 3 iterations
    argon2__parallelism=4,      # 4 threads
    argon2__type="id"           # Argon2id (hybrid mode - best for password hashing)
)


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.algorithm)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# 2FA / TOTP Functions
def generate_totp_secret() -> str:
    import pyotp
    return pyotp.random_base32()


def get_totp_uri(email: str, secret: str) -> str:
    import pyotp
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email, 
        issuer_name="LexPortal"
    )


def verify_totp(secret: str, code: str) -> bool:
    import pyotp
    totp = pyotp.TOTP(secret)
    return totp.verify(code)