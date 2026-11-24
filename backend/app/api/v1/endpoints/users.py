from __future__ import annotations

from typing import Any, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.db.models import User, UserProfile
from app.schemas.user import (
    UserCreate,
    UserResponse as UserSchema, 
    UserProfileUpdate, 
    UserPasswordUpdate,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest
)
from app.core import security
from app.services.audit import create_audit_log

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
async def list_users(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Zwraca listę użytkowników dla panelu administratora/operatora.
    """
    if (current_user.role or "").upper() not in ["ADMIN", "OPERATOR", "LAWYER"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    user_in: UserCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Tworzy nowego użytkownika/klienta z poziomu panelu administracyjnego.
    """
    actor_role = (current_user.role or "").upper()
    if actor_role not in ["ADMIN", "OPERATOR", "LAWYER"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    target_role = (user_in.role or "client").lower()
    if target_role not in {"client", "lawyer", "operator", "admin"}:
        raise HTTPException(status_code=422, detail="Invalid role")
    if target_role == "admin" and actor_role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can create admin accounts")

    email = user_in.email.lower()
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Użytkownik z tym adresem email już istnieje.",
        )

    user = User(
        email=email,
        password_hash=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=target_role,
    )
    db.add(user)
    await db.commit()

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    await db.commit()

    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == user.id)
    )
    created_user = result.scalar_one()

    await create_audit_log(
        db=db,
        action="user_created_by_admin",
        actor_id=current_user.id,
        details={"created_user_id": str(created_user.id), "role": target_role},
    )

    return created_user


@router.get("/by-role")
async def get_users_by_role(
    role: str = Query(..., description="Rola użytkownika: operator, client, admin"),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Zwraca listę użytkowników o danej roli.
    Dostępne tylko dla Administratorów i Operatorów.
    """
    if (current_user.role or "").upper() not in ["ADMIN", "OPERATOR", "LAWYER"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    result = await db.execute(
        select(User).where(User.role == role, User.is_active == True)
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "role": u.role,
            "display_name": u.email.split("@")[0].replace(".", " ").title(),
        }
        for u in users
    ]


@router.get("/me", response_model=UserSchema)
async def read_user_me(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    # Re-fetch with eager loading to ensure fresh data (avoids stale session cache)
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == current_user.id)
        .execution_options(populate_existing=True)
    )
    return result.scalar_one()


@router.patch("/me", response_model=UserSchema)
async def update_user_me(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_in: UserProfileUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update own profile.
    """
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    from app.core.encryption import encryption_service
    
    if profile_in.first_name is not None:
        profile.first_name_enc = encryption_service.encrypt(profile_in.first_name)
    if profile_in.last_name is not None:
        profile.last_name_enc = encryption_service.encrypt(profile_in.last_name)
    if profile_in.pesel is not None:
        profile.pesel_enc = encryption_service.encrypt(profile_in.pesel)
    if profile_in.address is not None:
        profile.address_enc = encryption_service.encrypt(profile_in.address)
    if profile_in.phone is not None:
        profile.phone_enc = encryption_service.encrypt(profile_in.phone)
        
    await db.commit()
    
    # Re-fetch with profile eagerly loaded
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == current_user.id)
    )
    return result.scalar_one()


@router.post("/change-password")
async def change_password(
    *,
    db: AsyncSession = Depends(deps.get_db),
    password_in: UserPasswordUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Change user password.
    """
    if not security.verify_password(password_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Incorrect current password",
        )
    
    current_user.password_hash = security.get_password_hash(password_in.new_password)
    db.add(current_user)
    await db.commit()
    
    await create_audit_log(
        db, 
        action="password_changed", 
        actor_id=current_user.id
    )
    
    return {"message": "Password updated successfully"}


# 2FA Endpoints
@router.post("/me/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Generate secret for 2FA setup.
    """
    secret = security.generate_totp_secret()
    current_user.totp_secret = secret
    db.add(current_user)
    await db.commit()
    
    otpauth_uri = security.get_totp_uri(current_user.email, secret)
    
    await create_audit_log(
        db, 
        action="2fa_setup_started", 
        actor_id=current_user.id,
        details={"email": current_user.email}
    )
    
    return {"secret": secret, "otpauth_uri": otpauth_uri}


@router.post("/me/2fa/verify", response_model=UserSchema)
async def verify_and_enable_2fa(
    *,
    db: AsyncSession = Depends(deps.get_db),
    verify_in: TwoFactorVerifyRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Verify TOTP code and enable 2FA.
    """
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA not set up")
    
    if security.verify_totp(current_user.totp_secret, verify_in.code):
        current_user.is_2fa_enabled = True
        db.add(current_user)
        await db.commit()
        
        await create_audit_log(
            db, 
            action="2fa_enabled", 
            actor_id=current_user.id
        )
        
        return current_user
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")


@router.post("/me/2fa/disable", response_model=UserSchema)
async def disable_2fa(
    *,
    db: AsyncSession = Depends(deps.get_db),
    verify_in: TwoFactorVerifyRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Disable 2FA.
    """
    if not current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    if security.verify_totp(current_user.totp_secret, verify_in.code):
        current_user.is_2fa_enabled = False
        current_user.totp_secret = None
        db.add(current_user)
        await db.commit()
        
        await create_audit_log(
            db, 
            action="2fa_disabled", 
            actor_id=current_user.id
        )
        
        return current_user
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")
