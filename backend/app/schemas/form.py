from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# --- Form Template ---

class FormTemplateBase(BaseModel):
    code: str
    title: str
    category: Optional[str] = None
    pdf_template_path: str
    is_active: bool = True
    schema_definition: Dict[str, Any]

class FormTemplateCreate(FormTemplateBase):
    pass

class FormTemplateUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    pdf_template_path: Optional[str] = None
    is_active: Optional[bool] = None
    schema_definition: Optional[Dict[str, Any]] = None

class FormTemplate(FormTemplateBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

# --- Form Field Mapping ---

class FormFieldMappingBase(BaseModel):
    frontend_key: str
    pdf_field_name: str

class FormFieldMappingCreate(FormFieldMappingBase):
    template_id: UUID

class FormFieldMapping(FormFieldMappingBase):
    id: UUID
    template_id: UUID
    model_config = ConfigDict(from_attributes=True)

# --- User Form Draft ---

class UserFormDraftBase(BaseModel):
    template_id: UUID
    data: Dict[str, Any]

class UserFormDraftCreate(UserFormDraftBase):
    pass

class UserFormDraftUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class UserFormDraft(BaseModel):
    id: UUID
    user_id: UUID
    template_id: UUID
    data: Dict[str, Any] # Decrypted for the frontend
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
