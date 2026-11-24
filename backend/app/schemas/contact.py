from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
import uuid
from datetime import datetime

class ContactMessageBase(BaseModel):
    subject: str
    message: str
    sender_name: Optional[str] = None
    sender_email: Optional[EmailStr] = None

class ContactMessageCreate(ContactMessageBase):
    pass

class ContactMessage(ContactMessageBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
