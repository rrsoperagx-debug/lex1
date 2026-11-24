from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class GeneratedDocumentBase(BaseModel):
    template_id: str
    case_id: Optional[uuid.UUID] = None
    filled_data: Dict[str, Any]
    s3_key: Optional[str] = None
    status: Optional[str] = "DRAFT"

class GeneratedDocumentCreate(GeneratedDocumentBase):
    user_id: uuid.UUID

class GeneratedDocumentUpdate(GeneratedDocumentBase):
    pass

class GeneratedDocumentInDBBase(GeneratedDocumentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class GeneratedDocument(GeneratedDocumentInDBBase):
    pass
