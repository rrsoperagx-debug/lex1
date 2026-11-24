# =============================================================================
# LexPortal API - Zależności (Dependencies) dla Endpointów
# =============================================================================
#
# Ten plik definiuje współdzielone zależności (dependencies) używane w całej
# aplikacji FastAPI. Zależności te upraszczają kod, hermetyzują logikę
# i są wielokrotnego użytku w różnych endpointach.
#
# Kluczowe Zależności:
#   - get_db: (Importowana z session.py) Dostarcza sesję bazy danych.
#   - get_current_user: Weryfikuje token JWT, pobiera i zwraca aktywnego
#                       użytkownika z bazy danych. Kluczowy element
#                       systemu autentykacji.
#   - get_current_active_superuser: Zależność-wrapper, która upewnia się,
#                                   że zalogowany użytkownik ma uprawnienia
#                                   superużytkownika.
#
# =============================================================================
from __future__ import annotations

import uuid
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import TokenData


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/auth/login",
    auto_error=False,
)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    # Optional fallback for legacy/testing
    auth_header_token: Optional[str] = Depends(reusable_oauth2)
) -> User:
    # 1. Try to get token from HttpOnly cookie (Preferred secure method)
    token = request.cookies.get("access_token")
    
    # 2. Fallback to Authorization header if cookie is missing
    if not token:
        token = auth_header_token
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.algorithm]
        )
        token_id = payload.get("sub")
        if not token_id:
            raise ValueError("Token missing sub claim")
        token_data = TokenData(id=token_id)
    except (jwt.JWTError, ValidationError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == uuid.UUID(token_data.id))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Store user in request state for audit logging
    request.state.user = user
    return user


# Alias: get_current_user już sprawdza is_active → możemy używać obu nazw
get_current_active_user = get_current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user
