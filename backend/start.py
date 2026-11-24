# =============================================================================
# LexPortal API - Skrypt Startowy Serwera (Uvicorn)
# =============================================================================
import os
import uvicorn
import logging
from alembic.config import Config
from alembic import command

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("start_script")

def run_migrations():
    """Ruchamia migracje bazy danych przed startem serwera."""
    try:
        logger.info("Sprawdzanie i uruchamianie migracji bazy danych (Alembic)...")
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Migracje zakończone sukcesem.")
    except Exception as e:
        logger.error(f"Błąd podczas uruchamiania migracji: {e}")
        raise e

if __name__ == "__main__":
    run_migrations()
    port_env = os.environ.get("PORT", "8000")
    if not port_env or port_env == "${PORT}":
        port = 8000
    else:
        try:
            port = int(port_env)
        except ValueError:
            port = 8000
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
