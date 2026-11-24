from typing import Any, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import SystemSetting

router = APIRouter()


class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    category: str = "general"


class SystemSettingUpdate(BaseModel):
    value: str


class SystemSettingResponse(SystemSettingBase):
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=List[SystemSettingResponse])
async def get_settings(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
) -> Any:
    """
    Retrieve system settings.
    """
    query = select(SystemSetting)
    if category:
        query = query.where(SystemSetting.category == category)
    
    result = await db.execute(query)
    settings = result.scalars().all()
    return settings


@router.patch("/{key}", response_model=SystemSettingResponse)
async def update_setting(
    key: str,
    setting_in: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a system setting by key.
    """
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    setting.value = setting_in.value
    await db.commit()
    await db.refresh(setting)
    return setting


@router.post("/", response_model=SystemSettingResponse)
async def create_setting(
    setting_in: SystemSettingBase,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new system setting (admin only ideally, but keeping it simple for now).
    """
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == setting_in.key))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Setting with this key already exists")
    
    setting = SystemSetting(**setting_in.model_dump())
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    return setting
