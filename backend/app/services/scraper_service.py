import logging
import asyncio
from typing import Dict, Any, Optional
from playwright.async_api import async_playwright, TimeoutError

logger = logging.getLogger(__name__)

class ScraperService:
    """
    Serwis odpowiedzialny za pobieranie treści ze stron typu poradnikprzedsiebiorcy.pl.
    Zastosowanie headless browser pozwala omijać podstawowe blokady i renderować zawartość JS.
    """
    
    @staticmethod
    async def scrape_template_url(url: str) -> Dict[str, Any]:
        """
        Pobiera tytuł, krótki opis oraz surową treść dokumentu z danego URL.
        """
        logger.info(f"Rozpoczynam scraping URL: {url}")
        
        async with async_playwright() as p:
            # Używamy chromium w trybie headless
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            print("[DEBUG] Page created")
            
            try:
                # Blokujemy ladowanie zbednych zasobow by przyspieszyc scrapowanie
                await page.route("**/*", lambda route: route.continue_() if route.request.resource_type in ["document", "script", "xhr", "fetch"] else route.abort())
                
                print(f"[DEBUG] Navigating to {url}")
                await page.goto(url, wait_until="domcontentloaded", timeout=10000)
                print(f"[DEBUG] Navigation succesful")
                
                # Zależnie od struktury strony, tytuł najczęściej znajduje się w <h1>
                try:
                    title = await page.inner_text('h1', timeout=5000)
                except TimeoutError:
                    title = "Nieznany szablon"
                
                # Próba wyciągnięcia opisu / wstępu
                # poradnikprzedsiebiorcy.pl zazwyczaj używa .article-content lub .post-content
                try:
                    description_paragraphs = await page.query_selector_all('.article-content p')
                    if not description_paragraphs:
                        description_paragraphs = await page.query_selector_all('article p')
                    
                    description_texts = []
                    for p_elem in description_paragraphs[:3]: # Bierzemy do 3 pierwszych paragrafów jako opis
                        text = await p_elem.inner_text()
                        if text.strip():
                            description_texts.append(text.strip())
                    description = "\n".join(description_texts)
                except Exception as e:
                    logger.warning(f"Problem z pobraniem opisu: {e}")
                    description = ""

                # Surowa zawartość - próbujemy pobrać cały tekst z głównego kontenera artykułu
                # To on zostanie przeanalizowany przez AI, aby odtworzyć szablon
                try:
                    content_container = await page.query_selector('.article-content')
                    if not content_container:
                        content_container = await page.query_selector('article')
                    
                    if content_container:
                        raw_content = await content_container.inner_text()
                    else:
                        # W ostateczności bierzemy całe body
                        raw_content = await page.inner_text('body')
                except Exception as e:
                    logger.error(f"Nie udało się pobrać treści artykułu: {e}")
                    raw_content = ""
                
                return {
                    "source_url": url,
                    "title": title.strip(),
                    "description": description.strip(),
                    "raw_content": raw_content.strip()
                }
                
            except Exception as e:
                logger.error(f"Błąd podczas scrapowania {url}: {e}")
                raise
            finally:
                await browser.close()

scraper_service = ScraperService()
