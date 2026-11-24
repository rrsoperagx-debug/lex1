import json
import logging
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, provider: str = "groq"):
        self.provider = provider
        if self.provider == "groq":
            self.client = AsyncOpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            self.model = "llama-3.3-70b-versatile"
        elif self.provider == "github":
            self.client = AsyncOpenAI(
                api_key=settings.github_token,
                base_url="https://models.inference.ai.azure.com"
            )
            self.model = "gpt-4o-mini"
        else:
            raise ValueError(f"Nieobsługiwany dostawca: {provider}")

    async def generate_json(self, prompt: str, schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generuje ustrukturyzowaną odpowiedź w formacie JSON z wykorzystaniem Groq lub OpenAI formatu.
        Wykorzystuje tryb json_object obsługiwany przez modele Llama3 na Groq oraz GPT-4o-mini.
        """
        try:
            # Komunikat systemowy precyzujący format
            system_prompt = "Zwróć odpowiedź WYŁĄCZNIE jako poprawny obiekt JSON. Nie dodawaj znaczników markdown ani innego tekstu."
            
            # W OpenAI/Groq, jeśli oczekujemy konkretnego schematu, możemy przekazać go w wiadomości systemowej
            if schema:
                system_prompt += f"\nOto wymagany schemat JSON. Zastosuj się precyzyjnie do poniższej struktury (nie zwracaj typów, tylko dane odpowiadające polom):\n{json.dumps(schema, indent=2, ensure_ascii=False)}"

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            if not content:
                logger.error("Brak treści w odpowiedzi z modelu.")
                raise ValueError("Brak odpowiedzi z modelu LLM.")
                
            json_response = json.loads(content)
            return json_response
            
        except json.JSONDecodeError as e:
            logger.error(f"Pobrana odpowiedź nie jest poprawnym JSON-em: {e}")
            logger.debug(f"Odpowiedź: {content}")
            raise Exception("Odpowiedź z modelu LLM nie była poprawnym obiektem JSON.")
        except Exception as e:
            logger.error(f"Błąd integracji z API {self.provider}: {e}")
            raise Exception(f"Error generating JSON from LLM: {str(e)}")

    async def evaluate(self, text_to_evaluate: str, checklist: list[str]) -> Dict[str, Any]:
        """
        Ocenia tekst (odpowiedź AI) pod kątem zgodności z listą kontrolną reguł.
        Implementacja wzorca LLM-as-a-Judge.
        """
        prompt = f"""
        Jesteś audytorem jakości w systemie Lexportal. Twoim zadaniem jest ocena poniższego tekstu pod kątem zgodności z listą wymagań.
        Tekst do oceny:
        ---
        {text_to_evaluate}
        ---
        Lista wymagań do sprawdzenia:
        {chr(10).join([f'- {item}' for item in checklist])}

        Zwróć wynik w formacie JSON z następującymi polami:
        - score (0-100)
        - missing_elements (lista brakujących elementów)
        - is_tech_compliant (boolean)
        - legal_risk (low/medium/high)
        - comment (krótkie uzasadnienie)
        """
        
        schema = {
            "score": "integer",
            "missing_elements": "list of strings",
            "is_tech_compliant": "boolean",
            "legal_risk": "string",
            "comment": "string"
        }
        
        return await self.generate_json(prompt, schema=schema)


# Domyślna instancja korzystająca z bezpłatnego modelu Llama-3 na Groq
llm_service = LLMService(provider="groq")
