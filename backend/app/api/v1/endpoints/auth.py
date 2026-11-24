# No __future__ annotations - let Pydantic resolve types normally

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.db.models import User
from app.schemas.user import Token, UserCreate, UserResponse as UserSchema, ForgotPassword
from app.services.audit import create_audit_log

router = APIRouter()

# Rate limiter instance
limiter = Limiter(key_func=get_remote_address, enabled=settings.environment != "TESTING")


@router.post("/register", response_model=UserSchema)
@limiter.limit("3/minute")
async def register(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create new user.
    """
    print(f"DEBUG REGISTER: {user_in}")
    email = user_in.email.lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    try:
        password_hash = security.get_password_hash(user_in.password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    user = User(
        email=email,
        password_hash=password_hash,
    )
    db.add(user)
    await db.commit()
    
    # Create empty profile
    from app.db.models import UserProfile
    profile = UserProfile(user_id=user.id)
    db.add(profile)
    await db.commit()
    
    # Re-fetch with profile eagerly loaded
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == user.id)
    )
    user = result.scalar_one()
    
    # Audit log
    await create_audit_log(
        db=db,
        action="user_registered",
        actor_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    
    return user


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, sets an HttpOnly cookie and returns user info
    """
    email = form_data.username.lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Check if 2FA is enabled 
    if user.is_2fa_enabled:
        return {
            "access_token": "", 
            "token_type": "bearer",
            "require_2fa": True,
            "user_role": user.role,
            "user_name": user.full_name or user.email.split("@")[0]
        }

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # Audit log
    await create_audit_log(
        db=db,
        action="user_login",
        actor_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    
    # Set HttpOnly Cookie for security
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        expires=settings.access_token_expire_minutes * 60,
        samesite="lax", # SameSite protection
        secure=True if settings.environment != "DEVELOPMENT" else False, # Should be True in prod
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": user.role,
        "user_name": user.full_name or user.email.split("@")[0]
    }


@router.post("/login/2fa", response_model=Token)
async def login_2fa(
    response: Response,
    request: Request,
    email: str,
    code: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Second step of login with 2FA, sets HttpOnly cookie
    """
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="Invalid request")
    
    if not security.verify_totp(user.totp_secret, code):
        await create_audit_log(
            db=db,
            action="2fa_login_failed",
            actor_id=user.id,
            ip_address=request.client.host if request.client else None,
            status="failed"
        )
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # Audit log
    await create_audit_log(
        db=db,
        action="user_login_2fa_success",
        actor_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        samesite="lax",
        secure=True if settings.environment != "DEVELOPMENT" else False,
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": user.role,
        "user_name": user.full_name or user.email.split("@")[0]
    }


@router.post("/logout")
async def logout(response: Response):
    """
    Clear HttpOnly cookies
    """
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}
@router.post("/forgot-password")
async def forgot_password(
    forgot_in: ForgotPassword,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Simulate forgot password email recovery flow.
    In a real app, this would generate a reset token and send an email.
    """
    result = await db.execute(select(User).where(User.email == forgot_in.email))
    user = result.scalar_one_or_none()
    
    if user:
        # In a real app, send email with token here
        pass
    
    # Always return 200 to prevent email enumeration
    return {"message": "If this email is registered, a recovery link has been sent."}
