from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

class TemplateField(BaseModel):
    id: str
    label: str
    type: str
    required: Optional[bool] = False
    placeholder: Optional[str] = None
    default: Optional[Any] = None
    options: Optional[List[str]] = None
    pattern: Optional[str] = None

class TemplateBase(BaseModel):
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    html_content: str
    schema_definition: List[TemplateField]
    ai_hints: Optional[str] = None
    logic: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None

class TemplateCreate(TemplateBase):
    id: str

class TemplateUpdate(TemplateBase):
    pass

class TemplateInDBBase(TemplateBase):
    id: str
    version: int
    created_at: datetime

    class Config:
        from_attributes = True

class Template(TemplateInDBBase):
    pass
