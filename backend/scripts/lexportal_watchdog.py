import os
import time
import json
import sqlite3
import hashlib
import logging
import asyncio
from datetime import datetime
from docx import Document
from playwright.async_api import async_playwright

# Dodajemy katalog nadrzędny do sys.path, aby móc importować app.services
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai_orchestrator import LexportalOrchestrator

# --- KONFIGURACJA ZGODNA Z V2.0 ---
CONFIG = {
    "DOWNLOAD_DIR": "./lex_vault_v2",
    "THROTTLING_DELAY": 5,
    "DB_PATH": "lex_monitor.db",
    "SYSTEM_PROMPT": """
        ROLE: Senior LegalTech Architect & Polish Radca Prawny.
        TASK: Convert raw legal text into Lexportal Smart Template JSON.
        RULES:
        1. Use uppercase descriptive tags: {{TAG_NAME}}.
        2. Strict terminology: Zamawiający/Wykonawca, Zleceniodawca/Zleceniobiorca.
        3. Mandatory: Include {{RODO_CLAUSE}} and Penalty Cap.
        4. IP Transfer: Apply Art. 50 of Copyright Act if applicable.
        5. Output: ONLY valid minified JSON.
    """
}

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('watchdog.log')
    ]
)
logger = logging.getLogger("LexWatchdog")

class LexportalWatchdog:
    """
    WATCHDOG v2.0 - Monitoruje zmiany i zarządza przyrostową kolejką pobierania.
    Zgodny z LEXPORTAL AI SYSTEM RULES - VERSION 2.0.
    """
    
    def __init__(self):
        self.orchestrator = LexportalOrchestrator()
        os.makedirs(CONFIG["DOWNLOAD_DIR"], exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Inicjalizacja lokalnej bazy śledzenia (Audit Log/State)."""
        conn = sqlite3.connect(CONFIG["DB_PATH"])
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_templates (
                url_hash TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT,
                processed_at TIMESTAMP,
                content_hash TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def _is_new(self, url: str) -> bool:
        """Sprawdza czy URL był już procesowany."""
        url_hash = hashlib.md5(url.encode()).hexdigest()
        conn = sqlite3.connect(CONFIG["DB_PATH"])
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM processed_templates WHERE url_hash = ?", (url_hash,))
        exists = cursor.fetchone()
        conn.close()
        return exists is None

    def _mark_as_processed(self, url: str, title: str, content_hash: str = ""):
        """Zapisuje ślad w bazie (Audit Log)."""
        url_hash = hashlib.md5(url.encode()).hexdigest()
        conn = sqlite3.connect(CONFIG["DB_PATH"])
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO processed_templates (url_hash, url, title, processed_at, content_hash)
            VALUES (?, ?, ?, ?, ?)
        ''', (url_hash, url, title, datetime.now(), content_hash))
        conn.commit()
        conn.close()

    async def process_link(self, page, url: str):
        """Pobiera i przetwarza pojedynczy dokument."""
        try:
            logger.info(f"[*] Przetwarzanie dokumentu: {url}")
            await page.goto(url)
            title = await page.inner_text("h1")
            
            # Pobieranie pliku (zakładamy obecność linku do .doc/.docx)
            async with page.expect_download() as download_info:
                # Szukamy linku do pobrania
                await page.click("a:has-text('.doc'), a:has-text('.docx')")
            
            download = await download_info.value
            filename = f"{int(time.time())}_{download.suggested_filename}"
            path = os.path.join(CONFIG["DOWNLOAD_DIR"], filename)
            await download.save_as(path)
            
            # Konwersja DOCX na tekst
            doc = Document(path)
            raw_text = "\n".join([para.text for para in doc.paragraphs])
            
            # Transformacja przez orkiestrator (Failover AI)
            smart_json = await self.orchestrator.transform_legal_text(
                raw_text, title, CONFIG["SYSTEM_PROMPT"]
            )
            
            if smart_json:
                content_hash = hashlib.sha256(smart_json.encode()).hexdigest()
                output_path = os.path.join(CONFIG["DOWNLOAD_DIR"], f"template_{content_hash[:12]}.json")
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(smart_json)
                
                self._mark_as_processed(url, title, content_hash)
                logger.info(f"[SUCCESS] Szablon '{title}' przetworzony i zapisany.")
                return True
            
            return False
        except Exception as e:
            logger.error(f"[ERROR] Błąd przetwarzania linku {url}: {str(e)}")
            return False

    async def check_for_updates(self, category_urls: list):
        """Cykl monitorowania kategorii."""
        logger.info("Starting Watchdog cycle...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            for cat_url in category_urls:
                logger.info(f"[*] Checking category: {cat_url}")
                await page.goto(cat_url)
                
                # Pobranie linków do dokumentów
                links = await page.eval_on_selector_all(
                    ".title a", 
                    "nodes => nodes.map(n => n.href)"
                )
                
                for link in links:
                    if self._is_new(link):
                        logger.info(f"[NEW] Znaleziono nowy dokument: {link}")
                        success = await self.process_link(page, link)
                        if success:
                            await asyncio.sleep(CONFIG["THROTTLING_DELAY"])
                    else:
                        logger.debug(f"[SKIP] Dokument już istnieje: {link}")

            await browser.close()
        
        logger.info("Cycle completed.")

    async def start_infinite_monitor(self, category_urls: list, interval_seconds: int = 3600):
        """Uruchamia Watchdoga w trybie ciągłym."""
        logger.info(f"Lexportal Watchdog active. Interval: {interval_seconds}s")
        while True:
            try:
                await self.check_for_updates(category_urls)
            except Exception as e:
                logger.critical(f"[CRITICAL] Watchdog loop crashed: {e}")
            
            logger.info(f"[*] Sleeping for {interval_seconds}s...")
            await asyncio.sleep(interval_seconds)

if __name__ == "__main__":
    CATEGORIES = [
        "https://poradnikprziebiorcy.pl/pobierz/umowy",
        "https://poradnikprziebiorcy.pl/pobierz/kadry"
    ]
    
    watchdog = LexportalWatchdog()
    asyncio.run(watchdog.start_infinite_monitor(CATEGORIES))
