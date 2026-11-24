from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LegalTemplateBase(BaseModel):
    custom_id: str
    title: str
    content: str
    category: str
    description: Optional[str] = None
    target_audience: str = "operator"
    risk_level: str = "low"
    fields: Optional[List[Dict[str, Any]]] = None
    ai_hints: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    logic: Optional[str] = None
    required_attachments: Optional[List[str]] = None
    is_active: bool = True

class LegalTemplateCreate(LegalTemplateBase):
    pass

class LegalTemplateUpdate(BaseModel):
    custom_id: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    risk_level: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None
    ai_hints: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    logic: Optional[str] = None
    required_attachments: Optional[List[str]] = None
    is_active: Optional[bool] = None

class LegalTemplate(LegalTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
