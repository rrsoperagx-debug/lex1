# =============================================================================
# LexPortal API - Główny Plik Aplikacji
# =============================================================================
#
# To jest główny punkt wejścia dla aplikacji backendowej LexPortal (FastAPI).
# Odpowiada za:
#   - Inicjalizację aplikacji FastAPI.
#   - Zarządzanie cyklem życia aplikacji (np. połączenie z bazą danych).
#   - Konfigurację i dodawanie middleware (CORS, ochrona DDoS).
#   - Dołączanie i organizowanie routerów API dla poszczególnych zasobów.
#
# =============================================================================

# No __future__ annotations - causes Pydantic ForwardRef issues

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import redis.asyncio as redis
import asyncio
import socket
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.middleware.ddos_protection import DDoSProtectionMiddleware
from app.middleware.audit_log import AuditLogMiddleware
from app.db.session import engine, AsyncSessionLocal
from app.db.init_db import init_db
from app.db.models import Base

# Konfiguracja logowania SQLAlchemy - wyłączenie gadatliwych logów INSERTów na Railway
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
from app.api.v1.endpoints import (
    auth, cases, ai, notifications, messages, users, seed, audit,
    appointments, contact, dashboard, settings as settings_api,
    payments, config as config_api, marketing, documents, forms, analytics,
    legal_templates, chat, admin_ai
)


# ---------------------------------------------------------------------------
# Inicjalizacja Rate Limitera (Ograniczenie Częstotliwości Zapytań)
# ---------------------------------------------------------------------------
# Używa adresu IP klienta do śledzenia liczby zapytań.
# Zintegrowane z endpointami w celu ochrony przed atakami typu brute-force.
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, enabled=settings.environment != "TESTING")


# ---------------------------------------------------------------------------
# Zarządzanie Cyklem Życia Aplikacji (Lifespan)
# ---------------------------------------------------------------------------
# Ten kontekst manager jest uruchamiany przy starcie i zatrzymaniu serwera.
# Głównie używany do nawiązywania i zamykania połączenia z bazą danych
# oraz inicjalizacji początkowych danych (seeding).
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Logika ponawiania połączenia z bazą danych przy starcie
    retries = 10  # Increased retries
    
    # Mask password for logging
    target_url = settings.database_url
    if "@" in target_url:
        protocol, rest = target_url.split("://", 1)
        creds, host_port_db = rest.split("@", 1)
        target_url_masked = f"{protocol}://****@{host_port_db}"
    else:
        target_url_masked = target_url

    print(f"Próba połączenia z bazą danych: {target_url_masked}")
    
    while retries > 0:
        try:
            if settings.environment != "TESTING":
                async with engine.begin() as conn:
                    # Sprawdza, czy połączenie z bazą danych jest aktywne
                    await conn.execute(text("SELECT 1"))

                # Automatyczne zasilanie bazy danych początkowymi danymi
                async with AsyncSessionLocal() as session:
                    await init_db(session)
            print("Połączono z bazą danych (Migracje obsłużone przez start.py).")
            break  # Wyjście z pętli, jeśli połączenie się powiedzie
        except (OperationalError, socket.gaierror, ConnectionRefusedError, OSError) as e:
            retries -= 1
            print(f"!!! DATABASE CONNECTION ERROR !!!")
            print(f"Error Type: {type(e).__name__}")
            print(f"Details: {str(e)}")
            print(f"Retries left: {retries}")
            if retries == 0:
                print("FATAL: Could not connect to database after several retries.")
                raise e
            await asyncio.sleep(5)
        except Exception as e:
            retries -= 1
            print(f"!!! UNEXPECTED STARTUP ERROR !!!")
            print(f"Error Type: {type(e).__name__}")
            print(f"Details: {str(e)}")
            if retries == 0:
                raise e
            await asyncio.sleep(5)
    
    # 'yield' oznacza moment, w którym aplikacja jest uruchomiona i obsługuje żądania
    yield
    
    # Kod poniżej 'yield' jest wykonywany przy zamykaniu aplikacji
    await engine.dispose()

# ---------------------------------------------------------------------------
# Inicjalizacja Aplikacji FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(
    title="LexPortal API",
    description="Backend API dla platformy prawnej LexPortal",
    version="1.0.0",
    lifespan=lifespan,
)

# Dodanie obsługi rate limitera do stanu aplikacji
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Inicjalizacja klienta Redis
try:
    redis_client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
except Exception:
    redis_client = None

# =============================================================================
# Konfiguracja Middleware
# =============================================================================
# WAŻNE: Kolejność dodawania middleware ma znaczenie.
# Żądania przechodzą przez nie w kolejności dodania.
# -----------------------------------------------------------------------------

# 1. Middleware Logów Audytowych (Ważne: post-processing)
app.add_middleware(AuditLogMiddleware)

# 2. Middleware Ochrony przed DDoS
# Musi być jednym z pierwszych, aby szybko blokować złośliwy ruch.
app.add_middleware(
    DDoSProtectionMiddleware,
    redis_client=redis_client,
    trusted_ips=settings.trusted_ips,
    max_violations=settings.ddos_max_violations,
    ban_duration=settings.ddos_ban_seconds,
    violation_window=settings.ddos_window_seconds
)

# 2. Middleware CORS (Cross-Origin Resource Sharing)
# Umożliwia frontendowi (działającemu na innej domenie) komunikację z API.
origins = [
    "https://test-production-bf56f.up.railway.app",
    "https://frontend-production-e011.up.railway.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost",
    "http://127.0.0.1",
    "http://0.0.0.0",
    "https://sniffily-pseudoascetical-dania.ngrok-free.dev"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.ngrok-free\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# =============================================================================
# Rejestracja Routerów API
# =============================================================================
# Każdy router grupuje endpointy związane z konkretnym zasobem (np. użytkownicy,
# sprawy). `prefix` standaryzuje URL, a `tags` grupuje je w dokumentacji API.
# -----------------------------------------------------------------------------
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["cases"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(messages.router, prefix="/api/v1/messages", tags=["messages"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["appointments"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["contact"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(settings_api.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(config_api.router, prefix="/api/v1/config", tags=["config"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["audit"])
app.include_router(dashboard.router, prefix="/api/v1/admin/dashboard", tags=["dashboard"])
app.include_router(marketing.router, prefix="/api/v1/marketing", tags=["marketing"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents-fallback"])
app.include_router(forms.router, prefix="/api/v1/forms", tags=["forms"])
app.include_router(legal_templates.router, prefix="/api/v1/legal-templates", tags=["legal-templates"])
app.include_router(analytics.router, prefix="/api/v1/admin/analytics", tags=["analytics"])
app.include_router(admin_ai.router, prefix="/api/v1/admin/ai", tags=["ai-admin"])
app.include_router(seed.router, prefix="/api/v1/dev", tags=["development"])


# ---------------------------------------------------------------------------
# Główny Endpoint ("Root")
# ---------------------------------------------------------------------------
# Prosty endpoint do sprawdzania statusu API.
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"name": "LexPortal API", "version": "1.0.0", "status": "running"}
