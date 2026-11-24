"""
System configuration & health status endpoint.
Requires superuser privileges.
"""
from __future__ import annotations

import time
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from app.api.deps import get_current_active_superuser
from app.db.session import get_db
from app.db.models import User, SystemSetting
from app.core.config import settings
from app.schemas.setting import SystemSettingResponse, SystemSettingUpdate

router = APIRouter()


@router.get("/status")
async def get_system_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> dict[str, Any]:
    """
    Returns real-time health status of all system components.
    Admin-only endpoint.
    """
    results: dict[str, Any] = {}

    # --- 1. Database latency ---
    try:
        t0 = time.monotonic()
        await db.execute(text("SELECT 1"))
        db_latency_ms = round((time.monotonic() - t0) * 1000)
        results["db_connection"] = "active"
        results["db_latency_ms"] = db_latency_ms
    except Exception as exc:
        results["db_connection"] = "error"
        results["db_latency_ms"] = None
        results["db_error"] = str(exc)

    # --- 2. Redis ping ---
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url, socket_timeout=1)
        t0 = time.monotonic()
        await r.ping()
        redis_latency_ms = round((time.monotonic() - t0) * 1000)
        await r.aclose()
        results["redis_cache"] = "connected"
        results["redis_latency_ms"] = redis_latency_ms
    except Exception:
        results["redis_cache"] = "unavailable"
        results["redis_latency_ms"] = None

    # --- 3. Gemini AI key presence ---
    if settings.gemini_api_key:
        results["ai_status"] = "healthy"
        results["ai_model"] = settings.gemini_model
    else:
        results["ai_status"] = "not_configured"
        results["ai_model"] = None

    # --- 4. Mollie integration mode ---
    mollie_key = settings.MOLLIE_API_KEY
    if mollie_key.startswith("live_"):
        results["mollie_integration"] = "live"
    elif mollie_key.startswith("test_"):
        results["mollie_integration"] = "test"
    else:
        results["mollie_integration"] = "not_configured"

    # --- 5. App metadata ---
    maintenance_setting = await db.scalar(
        select(SystemSetting.value).where(SystemSetting.key == "maintenance_mode")
    )
    results["maintenance_mode"] = maintenance_setting == "true"
    results["app_version"] = "1.0.0"
    results["environment"] = settings.environment
    results["base_url"] = settings.APP_BASE_URL

    return results

@router.get("/settings", response_model=list[SystemSettingResponse])
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> list[SystemSettingResponse]:
    """Retrieve all configurable system settings."""
    result = await db.execute(select(SystemSetting).order_by(SystemSetting.category, SystemSetting.key))
    return result.scalars().all()

@router.put("/settings/{key}", response_model=SystemSettingResponse)
async def update_system_setting(
    key: str,
    setting_in: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> SystemSettingResponse:
    """Update a specific system setting by key."""
    # Ensure it exists or create it
    setting = await db.scalar(select(SystemSetting).where(SystemSetting.key == key))
    
    if not setting:
        # Create a new setting if it does not exist
        setting = SystemSetting(
            key=key,
            value=setting_in.value,
            category="general",
            description=f"Auto-generated for {key}"
        )
        db.add(setting)
    else:
        setting.value = setting_in.value
        
    await db.commit()
    await db.refresh(setting)
    
    return setting


@router.post("/ai/ping")
async def ping_gemini_ai(
    current_user: User = Depends(get_current_active_superuser),
) -> dict[str, Any]:
    """
    Send a lightweight test request to the Gemini API and report latency.
    """
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="Klucz Gemini nie skonfigurowany.")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": "Ping"}]}],
        "generationConfig": {"maxOutputTokens": 1},
    }

    try:
        t0 = time.monotonic()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
        latency_ms = round((time.monotonic() - t0) * 1000)
        if resp.status_code == 200:
            return {"status": "ok", "latency_ms": latency_ms}
        return {"status": "error", "http_status": resp.status_code, "latency_ms": latency_ms}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
