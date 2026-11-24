
# ============================================================================
# LexPortal - Schematy Pydantic: Moduł Marketingu
# ============================================================================
# Opis:
#   Ten plik zawiera modele Pydantic (schematy) używane do walidacji danych
#   w endpointach API modułu marketingowego. Definiują one strukturę danych
#   przychodzących (Create, Update) i wychodzących (Response) z API.
#
# Kluczowe schematy:
#   - MarketingCampaignBase: Podstawowy model z polami wspólnymi dla
#     tworzenia i odczytu kampanii.
#   - MarketingCampaignCreate: Schemat używany przy tworzeniu nowej kampanii.
#     Waliduje dane wejściowe z żądania POST.
#   - MarketingCampaignResponse: Schemat określający strukturę danych
#     zwracanych przez API (np. przy pobieraniu listy kampanii).
#   - AIPlanBrief: Definiuje oczekiwaną strukturę JSON-a generowanego
#     przez AI, co zapewnia spójność danych.
#   - MarketingDashboardStats: Model dla zagregowanych statystyk
#     marketingowych.
# ============================================================================
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, Field
from decimal import Decimal

from app.db.models import CampaignChannel, CampaignStatus


# Struktura szczegółów planu AI wewnątrz JSONB
class AIPlanBrief(BaseModel):
    audience_persona: str
    keywords: List[str]
    ad_headlines: List[str]
    ad_descriptions: List[str]
    suggested_cta: str
    usp: List[str] # Unique Selling Points

class MarketingCampaignBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    channel: CampaignChannel
    budget: Decimal = Field(Decimal("0.00"), ge=Decimal("0"))
    currency: str = "PLN"
    goal: str = Field(..., min_length=5, max_length=255)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class MarketingCampaignCreate(MarketingCampaignBase):
    ai_generated_plan: Optional[Dict[str, Any]] = None

class MarketingCampaignUpdate(BaseModel):
    name: Optional[str] = None
    channel: Optional[CampaignChannel] = None
    status: Optional[CampaignStatus] = None
    budget: Optional[Decimal] = None
    currency: Optional[str] = None
    goal: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    ai_generated_plan: Optional[Dict[str, Any]] = None

class MarketingCampaignResponse(MarketingCampaignBase):
    id: uuid.UUID
    status: CampaignStatus
    ai_generated_plan: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignStats(BaseModel):
    channel: CampaignChannel
    total_campaigns: int
    active_campaigns: int
    total_budget: Decimal
    avg_budget: Decimal

    class Config:
        from_attributes = True

class MarketingDashboardStats(BaseModel):
    total_campaigns: int
    active_campaigns: int
    total_budget_spent: Decimal
    campaigns_by_channel: List[CampaignStats]
    campaigns_by_status: dict # {status: count}
    campaigns_by_goal: dict # {goal: count}

    class Config:
        from_attributes = True
