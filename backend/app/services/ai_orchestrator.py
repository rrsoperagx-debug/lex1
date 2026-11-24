import logging
import hashlib
import json
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIProvider:
    """Klasa bazowa dla dostawców AI zgodnie z wzorcem Strategy (Lexportal v2.0)."""
    def __init__(self, name: str):
        self.name = name

    async def process(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        raise NotImplementedError

class GeminiProvider(AIProvider):
    def __init__(self):
        super().__init__("Gemini")
        self.api_key = settings.gemini_api_key

    async def process(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "Gemini API key not configured"}
            
        # Resilient URL construction
        model_name = settings.gemini_model
        if model_name.startswith("models/"):
            model_name = model_name.replace("models/", "", 1, 1) if hasattr(model_name, 'replace') else str(model_name).replace("models/", "", 1)
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": f"{system_prompt}\n\nUser: {user_prompt}"}]
            }],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                r = await client.post(url, json=payload)
                r.raise_for_status()
                data = r.json()
                content = data['candidates'][0]['content']['parts'][0]['text']
                return {"success": True, "content": content}
        except Exception as e:
            logger.error(f"[{self.name}] Error: {str(e)}")
            return {"success": False, "error": str(e)}

class MistralProvider(AIProvider):
    def __init__(self):
        super().__init__("Mistral")
        # UWAGA: Klucz API z instrukcji USERA dla Lexportal v2.0
        self.api_key = "1yTxtJEZD6UetIR0v05WkWayonz6BkGs"
        self.endpoint = "https://api.mistral.ai/v1/chat/completions"

    async def process(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "mistral-large-latest",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                r = await client.post(self.endpoint, headers=headers, json=payload)
                r.raise_for_status()
                res = r.json()
                content = res['choices'][0]['message']['content']
                return {"success": True, "content": content}
        except Exception as e:
            logger.error(f"[{self.name}] Error: {str(e)}")
            return {"success": False, "error": str(e)}

class CerebrasProvider(AIProvider):
    def __init__(self):
        super().__init__("Cerebras")
        # UWAGA: Klucz API z instrukcji USERA dla Lexportal v2.0
        self.api_key = "csk-tppcfe4tv3hjv698hhmvyjt5e368hw884jrdf4wvyfkxt6y8"
        try:
            from cerebras.cloud.sdk import Cerebras
            self.client = Cerebras(api_key=self.api_key)
        except ImportError:
            logger.error("Cerebras SDK not installed")
            self.client = None

    async def process(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        if not self.client:
            return {"success": False, "error": "Cerebras SDK not initialized"}
        
        try:
            # Ultra-fast inference on Llama-3.1-70b
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama3.1-70b",
                max_completion_tokens=32768,
                temperature=0.1,
                stream=False
            )
            
            content = response.choices[0].message.content
            return {"success": True, "content": content}
        except Exception as e:
            logger.error(f"[{self.name}] Error: {str(e)}")
            return {"success": False, "error": f"Cerebras Failure: {str(e)}"}

class LexportalOrchestrator:
    """Zarządza logiką Failover i Tiered Selection zgodnie z Lexportal v2.0."""
    def __init__(self):
        self.gemini = GeminiProvider()
        self.cerebras = CerebrasProvider()
        self.mistral = MistralProvider()
        
        # Kolejność domyślna dla fallbacku
        self.providers_map = {
            "Gemini": self.gemini,
            "Cerebras": self.cerebras,
            "Mistral": self.mistral
        }

    def _select_primary_provider(self, text: str):
        """Inteligentny wybór modelu na podstawie długości tekstu (Tiered Selection)."""
        length = len(text)
        if length < 2500:
            return self.gemini, "TIER_1 (Cost-Saving)"
        elif length < 8000:
            return self.cerebras, "TIER_2 (Speed-Optimized)"
        else:
            return self.mistral, "TIER_3 (High-Precision)"

    async def transform_legal_text(self, text: str, title: str, system_prompt: str) -> Optional[str]:
        primary_provider, tier_info = self._select_primary_provider(text)
        logger.info(f"[*] Strategia: {tier_info}")
        
        # Budujemy łańcuch fallbacku: Primary -> Mistral (najbardziej stabilny)
        fallback_chain = [primary_provider]
        if primary_provider.name != "Mistral":
            fallback_chain.append(self.mistral)
        
        user_prompt = f"Dokument: {title}\nTreść:\n{text[:15000]}"
        
        for provider in fallback_chain:
            logger.info(f"[*] Próba transformacji przez: {provider.name}")
            result = await provider.process(system_prompt, user_prompt)
            
            if result.get("success"):
                content = result["content"]
                # AUDIT LOG (Punkt 5 v2.0): Hashowanie treści dla integralności
                content_hash = hashlib.sha256(content.encode()).hexdigest()
                logger.info(f"[AUDIT] Sukces. Provider: {provider.name}, Hash: {content_hash}")
                return content
            
            logger.warning(f"[!] {provider.name} zawiódł: {result.get('error')}")
        
        logger.error("[FATAL] Wszystkie modele AI zawiodły.")
        return None

    async def analyze_case(self, case_details: str) -> Optional[Dict[str, Any]]:
        """
        Specialized analysis for legal cases. Returns structured risk assessment.
        """
        system_prompt = """
        Jesteś Senior LegalTech Architect. Przeanalizuj poniższą sprawę pod kątem:
        1. Ryzyk prawnych (CRITICAL, WARNING, INFO).
        2. Brakujących dokumentów.
        3. Rekomendacji dalszych kroków zgodnie z polskim KPC i KC.
        
        Zwróć odpowiedź w formacie JSON:
        {
            "risks": [{"level": "CRITICAL", "desc": "..."}, ...],
            "missing_docs": ["..."],
            "recommendations": ["..."],
            "summary": "..."
        }
        """
        
        result_content = await self.transform_legal_text(
            text=case_details, 
            title="Analysis Request", 
            system_prompt=system_prompt
        )
        
        if result_content:
            try:
                # Basic cleaning of markdown if AI returned it
                clean_json = result_content.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json.split("```json")[1].split("```")[0].strip()
                elif clean_json.startswith("```"):
                    clean_json = clean_json.split("```")[1].split("```")[0].strip()
                    
                return json.loads(clean_json)
            except Exception as e:
                logger.error(f"Failed to parse AI JSON response: {e}")
                return {"error": "Invalid format from AI", "raw": result_content}
        return None

    async def get_risk_assessment(self, case_details: str) -> Dict[str, Any]:
        """
        Oceń ryzyko prawne poniższej sprawy w skali 0-100.
        Zwraca JSON: {score, level, threats: [], advice: ''}
        """
        system_prompt = """
        Jesteś ekspertem prawa polskiego (Radca Prawny).
        Oceń ryzyko prawne poniższej sprawy w skali 0-100.
        Zidentyfikuj 3 krytyczne zagrożenia merytoryczne.
        Bądź rygorystyczny i konkretny.
        Zwróć odpowiedź WYŁĄCZNIE w formacie JSON:
        {
            "score": <int 0-100>,
            "level": <"Low" | "Medium" | "High">,
            "threats": ["...", "...", "..."],
            "advice": "..."
        }
        """
        
        # Używamy Cerebras dla szybkości (Tier 2)
        result = await self.cerebras.process(system_prompt, case_details)
        
        if result.get("success"):
            try:
                clean_json = result["content"].strip()
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```")[1].split("```")[0].strip()
                
                return json.loads(clean_json)
            except Exception as e:
                logger.error(f"Failed to parse Risk AI JSON: {e}")
                
        # Fallback if AI fails
        return {
            "score": 50,
            "level": "Medium",
            "threats": ["Błąd analizy AI", "Wymagana ręczna weryfikacja"],
            "advice": "Nie udało się przeprowadzić automatycznej analizy ryzyka. Skonsultuj się z administratorem systemowym."
        }

orchestrator = LexportalOrchestrator()
