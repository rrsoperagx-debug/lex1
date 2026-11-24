from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime

class ChatMessageBase(BaseModel):
    recipient_id: uuid.UUID
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID
    content: str  # Decrypted content
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
