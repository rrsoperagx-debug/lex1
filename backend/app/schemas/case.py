from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from .document import Document


class CaseBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    client_id_str: Optional[str] = None
    case_type: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_analysis: Optional[dict] = None


class CaseCreate(CaseBase):
    pass


class CaseUpdate(CaseBase):
    status: Optional[str] = None


class CaseInDBBase(CaseBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_analysis: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Case(CaseInDBBase):
    documents: List[Document] = []
