# =============================================================================
# LexPortal API - Centralna Konfiguracja Aplikacji
# =============================================================================
#
# Ten plik definiuje wszystkie zmienne konfiguracyjne dla aplikacji backendowej.
# Używa Pydantic's `BaseSettings` do wczytywania, walidacji i zarządzania
# ustawieniami z pliku `.env` oraz zmiennych środowiskowych.
#
# Dzięki temu podejściu cała konfiguracja jest scentralizowana,
# udokumentowana i bezpieczna pod względem typów.
#
# =============================================================================

from __future__ import annotations

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Główna klasa konfiguracyjna. Automatycznie wczytuje zmienne z pliku .env.
    """
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ---------------------------------------------------------------------------
    # Ustawienia Ogólne Aplikacji
    # ---------------------------------------------------------------------------
    port: int = 8000
    cors_origins: str = "http://localhost:3000,https://test-production-bf56f.up.railway.app"
    environment: str = "DEVELOPMENT"

    # ---------------------------------------------------------------------------
    # Baza Danych i Redis
    # ---------------------------------------------------------------------------
    # ---------------------------------------------------------------------------
    # Baza Danych i Redis
    # ---------------------------------------------------------------------------
    POSTGRES_USER: str = "lexportal"
    POSTGRES_PASSWORD: str = "" # Required in environment
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "lexportal"
    
    # DATABASE_URL can be provided as a full string (e.g., from Railway)
    # If not provided, it will be constructed from the POSTGRES_* variables
    DATABASE_URL: str | None = None
    DATABASE_SSL: bool = False
    sql_echo: bool = False
    redis_url: str = "redis://redis:6379/0"

    @property
    def database_url(self) -> str:
        """
        Zapewnia kompatybilność URL-a bazy danych z driverem asyncpg.
        Jeśli DATABASE_URL nie jest ustawiony, buduje go z komponentów.
        Niektóre platformy (np. Railway) dostarczają URL w formacie 'postgresql://',
        podczas gdy asyncpg wymaga prefiksu 'postgresql+asyncpg://'.
        """
        url = self.DATABASE_URL
        if not url:
            password = self.POSTGRES_PASSWORD or "lexportal123" # Fallback only for DEV
            url = f"postgresql://{self.POSTGRES_USER}:{password}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # ---------------------------------------------------------------------------
    # Bezpieczeństwo i Uwierzytelnianie
    # ---------------------------------------------------------------------------
    encryption_key: str = ""  # Klucz do szyfrowania danych wrażliwych (BASE64)
    secret_key: str = "dev-secret-keep-it-safe"  # Fallback for non-critical signatures
    jwt_secret: str = "insecure-default-change-me-in-production"
    algorithm: str = "HS256"  # Algorytm podpisu JWT
    access_token_expire_minutes: int = 60  # Reduced to 1 hour for better security

    # Lista zaufanych adresów IP, które mogą omijać niektóre mechanizmy bezpieczeństwa
    # In production, this should ideally be an empty list or strictly controlled
    trusted_ips: List[str] = ["127.0.0.1", "::1"]
    
    # ---------------------------------------------------------------------------
    # Ochrona przed Atakami DDoS
    # ---------------------------------------------------------------------------
    ddos_max_violations: int = 100      # Reduced for stricter protection
    ddos_ban_seconds: int = 3600       # Increased to 1 hour
    ddos_window_seconds: int = 600     # Window of 10 minutes
    
    # ---------------------------------------------------------------------------
    # Klucze API Usług Zewnętrznych
    # ---------------------------------------------------------------------------
    gemini_api_key: str = ""
    gemini_model: str = "models/gemini-flash-latest"
    groq_api_key: str = ""
    github_token: str = ""

    # ---------------------------------------------------------------------------
    # Integracja z Bramką Płatności Mollie
    # ---------------------------------------------------------------------------
    MOLLIE_API_KEY: str = "" # Set in environment

    # Publiczny URL aplikacji
    APP_BASE_URL: str = "http://localhost"

    # ---------------------------------------------------------------------------
    # Ustawienia API
    # ---------------------------------------------------------------------------
    API_V1_STR: str = "/api/v1"

    # ---------------------------------------------------------------------------
    # Cennik Usług (w PLN)
    # ---------------------------------------------------------------------------
    CASE_PRICE_DEFAULT: str = "199.00"
    CASE_PRICE_BUSINESS: str = "499.00"
    CASE_PRICE_CRIMINAL: str = "299.00"


# Instancja obiektu Settings, która będzie używana w całej aplikacji.
settings = Settings()

