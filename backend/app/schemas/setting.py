from typing import Optional
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    category: str = "general"

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    value: str

class SystemSettingResponse(SystemSettingBase):
    id: uuid.UUID
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
