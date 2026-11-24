from __future__ import annotations

from decimal import Decimal
from enum import Enum
from typing import Optional
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class PaymentStatus(str, Enum):
    """Status płatności zgodny z API Mollie."""
    open = "open"
    canceled = "canceled"
    pending = "pending"
    expired = "expired"
    failed = "failed"
    paid = "paid"


class PaymentBase(BaseModel):
    """
    Bazowy schemat płatności.
    Mollie wymaga kwoty jako string z dokładnie 2 cyframi po przecinku,
    np. "199.00" zamiast 199 lub 199.0.
    """
    amount: str       # "199.00" – wymagany format Mollie
    currency: str = "PLN"
    description: str


class PaymentCreate(PaymentBase):
    """Schemat tworzenia płatności – dane wejściowe od klienta."""
    case_id: uuid.UUID


class PaymentResponse(PaymentBase):
    """Pełna odpowiedź z bazy danych – zwracana przez API."""
    id: uuid.UUID
    status: str
    checkout_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("amount", mode="before")
    @classmethod
    def convert_amount_to_str(cls, v: object) -> str:
        """Konwertuje Decimal (PostgreSQL Numeric) na string "199.00"."""
        if isinstance(v, Decimal):
            return f"{v:.2f}"
        return str(v)


class PaymentInitResponse(BaseModel):
    """
    Schemat odpowiedzi endpoint'u POST /create/{case_id}.
    Zwraca minimalny zestaw danych potrzebnych frontendowi do przekierowania.
    """
    id: uuid.UUID
    case_id: uuid.UUID
    mollie_id: Optional[str] = None
    checkout_url: Optional[str] = None
    status: str
    amount: str
    currency: str

    model_config = ConfigDict(from_attributes=True)

    @field_validator("amount", mode="before")
    @classmethod
    def convert_amount_to_str(cls, v: object) -> str:
        if isinstance(v, Decimal):
            return f"{v:.2f}"
        return str(v)


class PaymentWebhook(BaseModel):
    """
    Schemat danych webhooka od Mollie.
    Mollie wysyła POST z polem `id` (mollie_id płatności) jako form-data.
    """
    id: str  # mollie_id, np. "tr_WDqYK6vllg"
