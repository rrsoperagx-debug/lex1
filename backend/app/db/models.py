# =============================================================================
# LexPortal API - Modele Bazy Danych (SQLAlchemy)
# =============================================================================
#
# Ten plik definiuje wszystkie tabele i relacje w bazie danych PostgreSQL
# przy użyciu ORM (Object-Relational Mapper) SQLAlchemy.
# Każda klasa odpowiada jednej tabeli w bazie danych.
#
# Kluczowe Koncepcje:
#   - Base: Deklaratywna baza, z której dziedziczą wszystkie modele.
#   - Mapped/mapped_column: Nowoczesna składnia SQLAlchemy 2.0 do definicji
#                           kolumn i typów danych.
#   - relationship: Definiuje relacje między tabelami (jeden-do-wielu,
#                   wiele-do-jednego, itp.).
#   - *_enc: Pola z sufiksem '_enc' przechowują dane zaszyfrowane na poziomie
#            aplikacji w celu ochrony PII (Personally Identifiable Information).
#
# =============================================================================
# Future annotations disabled - causes Pydantic ForwardRef issues
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, LargeBinary, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy import Numeric
import enum


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    role: Mapped[str] = mapped_column(String, default="client", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    # 2FA fields
    totp_secret: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_2fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    profile: Mapped[Optional["UserProfile"]] = relationship("UserProfile", uselist=False, back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    cases: Mapped[List["Case"]] = relationship("Case", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="actor")
    
    # Messages
    sent_messages: Mapped[List["Message"]] = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages: Mapped[List["Message"]] = relationship("Message", foreign_keys="Message.recipient_id", back_populates="recipient")

    # Chat Messages
    sent_chat_messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", foreign_keys="ChatMessage.sender_id", back_populates="sender")
    received_chat_messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", foreign_keys="ChatMessage.recipient_id", back_populates="recipient")

    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    marketing_campaigns: Mapped[List["MarketingCampaign"]] = relationship("MarketingCampaign", back_populates="user", cascade="all, delete-orphan")
    form_drafts: Mapped[List["UserFormDraft"]] = relationship("UserFormDraft", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profile"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Encrypted fields
    first_name_enc: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_name_enc: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pesel_enc: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    address_enc: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone_enc: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="profile")

    # Pydantic-compatible properties mapping _enc fields to plain names
    @property
    def first_name(self):
        return self.first_name_enc

    @property
    def last_name(self):
        return self.last_name_enc

    @property
    def pesel(self):
        return self.pesel_enc

    @property
    def address(self):
        return self.address_enc

    @property
    def phone(self):
        return self.phone_enc

class Case(Base):
    __tablename__ = "case"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="open", index=True)
    
    # Dodatkowe pola dla CMS
    client_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    client_id_str: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    case_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="cases")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="case", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "document"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("case.id"), nullable=True, index=True)
    template_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("legal_template.id"), nullable=True, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="unsigned", index=True) # unsigned, signed, archived
    filled_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True) # Data used to generate the document
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    case: Mapped[Optional["Case"]] = relationship("Case", back_populates="documents")
    template: Mapped[Optional["LegalTemplate"]] = relationship("LegalTemplate", back_populates="instances")

class Notification(Base):
    __tablename__ = "notification"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    message: Mapped[str] = mapped_column(String, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action: Mapped[str] = mapped_column(String, nullable=False)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="success", index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    actor: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")

class Message(Base):
    __tablename__ = "message"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    recipient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    content_enc: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    file_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")

class ChatMessage(Base):
    __tablename__ = "chat_message"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    recipient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    encrypted_content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id], back_populates="sent_chat_messages")
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id], back_populates="received_chat_messages")

class Appointment(Base):
    __tablename__ = "appointment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[str] = mapped_column(String, nullable=False, index=True) # Store as YYYY-MM-DD
    time: Mapped[str] = mapped_column(String, nullable=False) # Store as HH:MM
    type: Mapped[str] = mapped_column(String, default="online") # online, in_office, court
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active", index=True) # active, archived, completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User")

class ContactMessage(Base):
    __tablename__ = "contact_message"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    sender_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sender_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[Optional["User"]] = relationship("User")

class FinanceMetric(Base):
    __tablename__ = "finance_metric"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    revenue_actual: Mapped[float] = mapped_column(server_default="0.0")
    revenue_predicted: Mapped[float] = mapped_column(server_default="0.0")
    costs: Mapped[float] = mapped_column(server_default="0.0")
    currency: Mapped[str] = mapped_column(String, default="PLN")

class TrafficMetric(Base):
    __tablename__ = "traffic_metric"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    page_path: Mapped[str] = mapped_column(String, nullable=False, index=True)
    visitor_id: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Anonymous or User ID
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String, default="view") # view, click, message_sent

class SystemSetting(Base):
    __tablename__ = "system_setting"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    category: Mapped[str] = mapped_column(String, default="general", index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Payment(Base):
    __tablename__ = "payment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("case.id"), nullable=False, index=True)
    # mollie_id jest nullable – rekord tworzymy PRZED wywołaniem Mollie (db.flush),
    # a potem uzupełniamy po odpowiedzi od bramki
    mollie_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="PLN")
    # status jako String (nie Enum SQLAlchemy) dla prostszych migracji
    status: Mapped[str] = mapped_column(String, default="open", nullable=False, index=True)
    checkout_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("marketing_campaign.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="payments")
    case: Mapped["Case"] = relationship("Case", back_populates="payments")
    campaign: Mapped[Optional["MarketingCampaign"]] = relationship("MarketingCampaign", back_populates="payments")


class CampaignChannel(str, enum.Enum):
    GOOGLE_ADS = "google_ads"
    META_ADS = "meta_ads"
    LINKEDIN_ADS = "linkedin_ads"
    NEWSLETTER = "newsletter"
    SEO_CONTENT = "seo_content"
    EMAIL = "email"  # Legacy/Others
    SMS = "sms"      # Legacy/Others
    SOCIAL_MEDIA = "social_media" # Legacy/Others

class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    PLANNING = "planning"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class CampaignGoal(str, enum.Enum):
    LEAD_GENERATION = "lead_generation"
    BRAND_AWARENESS = "brand_awareness"
    ENGAGEMENT = "engagement"
    SALES = "sales"
    RETENTION = "retention"
    CUSTOM = "custom"


class MarketingCampaign(Base):
    __tablename__ = "marketing_campaign"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    channel: Mapped[CampaignChannel] = mapped_column(Enum(CampaignChannel), nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(Enum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False, index=True)
    
    # Finanse
    budget: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.00)
    currency: Mapped[str] = mapped_column(String(3), default="PLN")
    
    # Czas
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Treść i Strategia
    goal: Mapped[str] = mapped_column(String(255), nullable=False) # e.g. "Pozyskanie spraw rozwodowych"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Serce AI: Tutaj przechowujemy JSON z personami, słowami kluczowymi i copy
    ai_generated_plan: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True) 

    # Audyt
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="marketing_campaigns")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="campaign")


# =============================================================================
# Form Creator Models
# =============================================================================

class FormTemplate(Base):
    __tablename__ = "form_template"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False) # e.g. "ZUS_EMP_2026"
    title: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True) # e.g. "Emerytury", "Podatki"
    pdf_template_path: Mapped[str] = mapped_column(String, nullable=False) # Path to the raw PDF file
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    schema_definition: Mapped[dict] = mapped_column(JSONB, nullable=False) # Full UI schema for React

    mappings: Mapped[List["FormFieldMapping"]] = relationship("FormFieldMapping", back_populates="template", cascade="all, delete-orphan")
    drafts: Mapped[List["UserFormDraft"]] = relationship("UserFormDraft", back_populates="template", cascade="all, delete-orphan")


class FormFieldMapping(Base):
    __tablename__ = "form_field_mapping"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("form_template.id"), nullable=False, index=True)
    frontend_key: Mapped[str] = mapped_column(String, nullable=False) # e.g. "first_name"
    pdf_field_name: Mapped[str] = mapped_column(String, nullable=False) # e.g. "form1[0].Page1[0].Imie[0]"
    
    template: Mapped["FormTemplate"] = relationship("FormTemplate", back_populates="mappings")


class UserFormDraft(Base):
    __tablename__ = "user_form_draft"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("form_template.id"), nullable=False, index=True)
    
    data_enc: Mapped[str] = mapped_column(String, nullable=False) # Encrypted JSON data
    status: Mapped[str] = mapped_column(String, default="draft", nullable=False, index=True) # draft, completed, generated
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="form_drafts")
    template: Mapped["FormTemplate"] = relationship("FormTemplate", back_populates="drafts")


class LegalTemplate(Base):
    __tablename__ = "legal_template"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    custom_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. 'T-WORK-002'
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False) # Markdown with {{TAG}}
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_audience: Mapped[str] = mapped_column(String(50), default="operator") # client, operator
    risk_level: Mapped[str] = mapped_column(String(20), default="low") # low, medium, high
    fields: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True) # List of dictionaries defining fields
    ai_hints: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    validation_rules: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    logic: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    required_attachments: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True) # List of strings
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    instances: Mapped[List["Document"]] = relationship("Document", back_populates="template")

class AIUsageLog(Base):
    __tablename__ = "ai_usage_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("user.id", ondelete="SET NULL"), nullable=True, index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(default=0)
    completion_tokens: Mapped[int] = mapped_column(default=0)
    total_tokens: Mapped[int] = mapped_column(default=0)
    cost: Mapped[float] = mapped_column(Numeric(15, 6), default=0.0)
    response_time_ms: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(50), default="success")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user: Mapped[Optional["User"]] = relationship("User")
