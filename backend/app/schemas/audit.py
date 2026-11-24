from typing import List, Optional, Dict
from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    action: str
    actor_name: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    timestamp: datetime
    details: Optional[Dict] = None
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedAuditLogs(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    size: int
