import logging
from typing import Dict, Any
from app.services.llm_service import llm_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class TemplateParserService:
    """
    Serwis odpowiedzialny za transformację surowej treści tekstowej 
    (np. pobranej ze stron prawniczych) na ustrukturyzowany, gotowy
    do renderowania szablon JSON za pomocą modelu LLM.
    """
    def __init__(self):
        self.llm = llm_service
        
    async def parse_raw_template(self, title: str, description: str, raw_content: str) -> Dict[str, Any]:
        """
        Wysyła prompt do LLM (Groq/GitHub), który konwertuje zawartość na ustrukturyzowany JSON.
        """
        logger.info(f"Rozpoczynam transformację AI dla szablonu: {title}")
        
        prompt = f"""
Jesteś ekspertem prawnym i architektem systemów LegalTech. 
Twoim zadaniem jest przetworzenie surowego tekstu do ustrukturyzowanego formatu gotowego do użycia w systemie generowania dokumentów.

Tytuł dokumentu: {title}
Opis: {description}

Surowa treść dokumentu (często niesformatowana i zawierająca redundantne dane z artykułów):
---
{raw_content}
---

Instrukcje:
1. Skup się wyłącznie na właściwej TREŚCI DOKUMENTU, zignoruj stopki, reklamy, komentarze z artykułu w raw_content.
2. Zidentyfikuj wszystkie logiczne zmienne pola w dokumencie (np. data, strony umowy, np. reprezentant, NIP, kwoty umowne, miejsce zawarcia).
3. Zamień te pola w gotowym tekście dokumentu na tagi w formacie {{{{ID_POLA}}}}, gdzie ID_POLA zapisane jest małymi literami z użyciem snake_case (np. {{{{client_name}}}}).
4. Wygeneruj strukturę HTML dla dokumentu, używaj tagów <h1>, <h2>, <p>, <strong>, <ul>, <li> by oddać prawniczą formę pisma. Kod html wstaw do klucza "content".
5. Skonstruuj definicje zmiennych (`fields`) użytych w dokumencie. Będą one budować dynamiczny formularz w React.
"""
        try:
            schema = {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "category": {"type": "string"},
                    "description": {"type": "string"},
                    "content": {"type": "string", "description": "Sformatowany HTML z użyciem zmiennych np. {{data_umowy}}"},
                    "fields": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string", "description": "Snake case identity, np. data_umowy"},
                                "label": {"type": "string", "description": "Ludzko czytelny nagłówek"},
                                "type": {"type": "string", "enum": ["text", "textarea", "date"]},
                                "required": {"type": "boolean"},
                                "placeholder": {"type": "string"}
                            },
                            "required": ["id", "label", "type", "required"]
                        }
                    }
                }
            }
            
            result = await self.llm.generate_json(prompt, schema=schema)
            if "error" in result:
                 logger.error(f"LLM API zwróciło błąd integracji: {result['error']}")
                 raise ValueError(f"Nie udało się sparsować dokumentu: {result['error']}")
                 
            logger.info("Pomyślnie przetworzono dokument przez model AI.")
            return result
        except Exception as e:
            logger.error(f"Błąd podczas parsowania szablonu przez AI: {e}")
            raise

template_parser_service = TemplateParserService()
