# =============================================================================
# LexPortal API - Zarządzanie Sesją Bazy Danych
# =============================================================================
#
# Ten plik jest odpowiedzialny za konfigurację i zarządzanie połączeniami
# z bazą danych PostgreSQL przy użyciu SQLAlchemy w trybie asynchronicznym.
#
# Kluczowe Komponenty:
#   - engine: Główny silnik SQLAlchemy, skonfigurowany z pulą połączeń
#             i opcjonalnym SSL dla środowisk produkcyjnych.
#   - AsyncSessionLocal: Fabryka sesji, która tworzy nowe, asynchroniczne
#                        sesje bazy danych na żądanie.
#   - get_db: Asynchroniczny generator używany jako zależność (dependency)
#             w endpointach FastAPI do dostarczania aktywnej sesji DB.
#
# =============================================================================
import ssl
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


# Create a secure SSL context that works with Railway/Cloud providers
# We disable hostname check and cert verification for cloud compatibility
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

connect_args = {}
if settings.DATABASE_SSL:
    connect_args["ssl"] = ssl_context

engine = create_async_engine(
    settings.database_url,
    echo=settings.sql_echo,
    pool_size=20,          # Maintain up to 20 permanent connections
    max_overflow=10,       # Allow up to 10 additional temporary connections
    pool_timeout=30,       # Wait up to 30 seconds for a connection
    pool_recycle=1800,     # Recycle connections every 30 minutes
    pool_pre_ping=True,    # Check connection health before use
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
