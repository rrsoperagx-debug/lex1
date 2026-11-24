from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime

class AppointmentBase(BaseModel):
    title: str
    date: str
    time: str
    type: str = "online"
    description: Optional[str] = None
    status: str = "active"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Appointment(AppointmentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
