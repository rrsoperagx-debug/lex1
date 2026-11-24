from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime

class MessageBase(BaseModel):
    recipient_id: uuid.UUID
    subject: Optional[str] = None
    content: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None

class MessageResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID
    subject: Optional[str] = None
    content: str
    is_read: bool
    is_archived: bool
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
