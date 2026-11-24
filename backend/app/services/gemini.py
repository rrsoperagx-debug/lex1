# ============================================================================
# LexPortal - Serwis Integracji z AI (Gemini)
# ============================================================================
# Opis:
#   Ten plik zawiera klasę `GeminiService`, która stanowi warstwę abstrakcji
#   dla komunikacji z API Google Gemini. Hermetyzuje ona logikę wysyłania
#   zapytań, obsługi kontekstu konwersacji oraz przetwarzania odpowiedzi
#   w różnych formatach.
#
# Kluczowe metody:
#   - generate: Wysyła standardowe zapytanie o wygenerowanie tekstu.
#   - generate_json: Wysyła zapytanie z prośbą o odpowiedź w formacie JSON,
#     opcjonalnie z walidacją względem podanego schematu. Zawiera logikę
#     fallback na wypadek problemów z formatowaniem.
#   - generate_stream: Obsługuje asynchroniczne strumieniowanie odpowiedzi
#     z API, idealne dla interaktywnych chatbotów.
#   - _prepare_contents: Prywatna metoda przygotowująca historię konwersacji
#     do formatu wymaganego przez API Gemini.
#
# Rola w architekturze:
#   `GeminiService` jest centralnym punktem integracji z AI. Wszystkie
#   endpointy, które potrzebują skorzystać z generatywnych możliwości AI,
#   powinny używać tej klasy, a nie bezpośrednio komunikować się z API.
# ============================================================================
from google import genai
from google.genai import types
import logging
import json
from typing import AsyncGenerator, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    SYSTEM_INSTRUCTION = (
        "Jesteś Senior Software Engineer i Radcą Prawnym systemu LexPortal.\n"
        "TWOJE OBOWIĄZKI:\n"
        "1. Każda umowa/szablon MUSI zawierać pełną klauzulę RODO.\n"
        "2. Każda umowa MUSI zawierać limit odpowiedzialności (Penalty Cap).\n"
        "3. Używaj terminów: Zleceniodawca/Zleceniobiorca, Zamawiający/Wykonawca.\n"
        "4. KOD: Używaj wyłącznie React, TypeScript i Tailwind CSS. NIP/PESEL waliduj Regexem.\n"
        "5. BEZPIECZEŃSTWO: Endpointy DELETE/PATCH muszą używać Depends(get_current_active_superuser).\n"
        "6. DISCLAIMER: Zawsze dodaj informację, że nie jesteś prawnikiem, a kod/tekst jest wzorem.\n"
    )

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model_name = settings.gemini_model
        if api_key:
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    def _prepare_contents(self, prompt: str, context: Optional[List[dict]] = None) -> List[types.Content]:
        contents = []
        if context:
            for item in context:
                role = item.get('role', 'user')
                if role == 'assistant':
                    role = 'model'
                
                parts = []
                for p in item.get('parts', []):
                    if isinstance(p, str):
                        parts.append(types.Part.from_text(p))
                    elif isinstance(p, dict) and 'text' in p:
                        parts.append(types.Part.from_text(p['text']))
                
                contents.append(types.Content(role=role, parts=parts))

        contents.append(types.Content(role="user", parts=[types.Part.from_text(prompt)]))
        return contents

    def generate(self, prompt: str, context: Optional[List[dict]] = None) -> tuple[str, dict]:
        if not self.client:
            return "Gemini API key is not configured.", {}
        
        try:
            contents = self._prepare_contents(prompt, context)
            config = {
                "system_instruction": self.SYSTEM_INSTRUCTION
            }
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            usage = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            }
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage["prompt_tokens"] = response.usage_metadata.prompt_token_count or 0
                usage["completion_tokens"] = response.usage_metadata.candidates_token_count or 0
                usage["total_tokens"] = response.usage_metadata.total_token_count or 0
                
            return response.text, usage
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return "Error calling Gemini API.", {}


    def generate_json(self, prompt: str, schema: Optional[dict] = None) -> dict:
        if not self.client:
            return {"error": "Gemini API key is not configured."}
        
        try:
            config: dict = {
                "response_mime_type": "application/json",
            }
            if schema:
                config["response_schema"] = schema

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini JSON generation error: {e}")
            # Fallback: attempt to parse any json in text
            try:
                import re
                match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if match:
                    return json.loads(match.group())
            except:
                pass
            return {"error": "Error generating JSON from Gemini API."}

    async def generate_stream(self, prompt: str, context: Optional[List[dict]] = None) -> AsyncGenerator[str, None]:
        if not self.client or not self.api_key:
            yield "Błąd konfiguracji: Brak poprawnego klucza API Gemini. (Gemini API key is not configured)."
            return

        try:
            contents = self._prepare_contents(prompt, context)
            config = {
                "system_instruction": self.SYSTEM_INSTRUCTION
            }
            # stream=True in generate_content is not how the new SDK works sometimes
            # New SDK uses generate_content_stream
            async for chunk in self.client.aio.models.generate_content_stream(
                model=self.model_name,
                contents=contents,
                config=config
            ):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini Streaming API error: {e}")
            yield f"Error during streaming: {type(e).__name__}: {str(e)}"
