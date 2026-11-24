# ============================================================================
# LexPortal - API v1: Moduł Interakcji z AI
# ============================================================================
# Opis:
#   Ten plik definiuje główne endpointy API służące do interakcji z modelem
#   językowym AI (Gemini). Udostępnia funkcjonalność generowania treści
#   zarówno w trybie standardowym (pojedyncza odpowiedź), jak i strumieniowym
#   (Server-Sent Events).
#
# Kluczowe endpointy:
#   - POST /generate: Przyjmuje prompt użytkownika i zwraca kompletną
#     odpowiedź od modelu AI.
#   - POST /generate-stream: Obsługuje ten sam proces, co /generate, ale
#     zwraca odpowiedź w postaci strumienia (chunk po chunku), co jest
#     idealne dla interaktywnych interfejsów typu chatbot.
#
# Architektura i Bezpieczeństwo:
#   - GeminiService: Serwis enkapsulujący logikę komunikacji z API Gemini.
#   - ContextStore: Przechowuje historię konwersacji w Redis, aby zapewnić
#     kontekst dla kolejnych zapytań w ramach tej samej sesji.
#   - Rate Limiting: Zastosowano ogranicznik (10 zapytań/minutę), aby
#     chronić API przed nadużyciami.
#   - PII Sanitize: Prompt użytkownika jest filtrowany w celu usunięcia
#     potencjalnych danych osobowych przed wysłaniem do AI.
# ============================================================================
# Future annotations disabled - causes Pydantic ForwardRef issues

import logging

from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.pii import sanitize_pii
from app.core.config import settings
from app.services.context_store import ContextStore
from app.services.gemini import GeminiService
from app.db.models import AIUsageLog, User
from app.api import deps
from sqlalchemy.ext.asyncio import AsyncSession
import time


router = APIRouter()

# Rate limiter instance
limiter = Limiter(key_func=get_remote_address)

_context_store = ContextStore(settings.redis_url)
_gemini = GeminiService(settings.gemini_api_key)
_logger = logging.getLogger(__name__)


from app.services.llm_service import llm_service


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=20000)
    session_id: str = Field(default="default", min_length=1, max_length=128)

class AnalyzingRequest(BaseModel):
    query: str = Field(..., min_length=5)

# For backward compatibility if needed, but endpoint uses AnalyzeRequest
class AnalyzeRequest(BaseModel):
    query: str = Field(..., min_length=5)


class GenerateResponse(BaseModel):
    text: str

class IntentRequest(BaseModel):
    query: str

class IntentResponse(BaseModel):
    intent: str
    action: str
    confidence: float
    entities: dict


class EvaluateRequest(BaseModel):
    text_to_evaluate: str
    checklist: list[str]


class EvaluateResponse(BaseModel):
    score: int
    missing_elements: list[str]
    is_tech_compliant: bool
    legal_risk: str
    comment: str


from fastapi.responses import StreamingResponse
import json
import asyncio

@router.post("/evaluate", response_model=EvaluateResponse)
@limiter.limit("5/minute")
async def evaluate(req: EvaluateRequest, request: Request) -> EvaluateResponse:
    try:
        result = await llm_service.evaluate(req.text_to_evaluate, req.checklist)
        return EvaluateResponse(**result)
    except Exception as e:
        _logger.exception("AI evaluation failed")
        raise HTTPException(
            status_code=500,
            detail=f"AI evaluation failed: {str(e)}",
        )


@router.post("/generate", response_model=GenerateResponse)
@limiter.limit("10/minute")
async def generate(req: GenerateRequest, request: Request, db: AsyncSession = Depends(deps.get_db)) -> GenerateResponse:
    try:
        start_time = time.time()
        sanitized = sanitize_pii(req.prompt)
        context = _context_store.get_last_messages(req.session_id, limit=5)
        text, usage = _gemini.generate(sanitized, context=context)
        
        response_time_ms = int((time.time() - start_time) * 1000)
        cost = (usage.get("prompt_tokens", 0) / 1_000_000.0) * 0.075 + (usage.get("completion_tokens", 0) / 1_000_000.0) * 0.30

        log_entry = AIUsageLog(
            provider="Gemini",
            model_name=_gemini.model_name,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            cost=cost,
            response_time_ms=response_time_ms,
            status="success" if not text.startswith("Error") else "error"
        )
        db.add(log_entry)
        await db.commit()

        _context_store.append_message(req.session_id, role="user", text=sanitized, keep_last=10)
        _context_store.append_message(req.session_id, role="model", text=text, keep_last=10)
        return GenerateResponse(text=text)
    except Exception as e:
        _logger.exception("AI generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"AI generation failed: {type(e).__name__}: {e}",
        ) from e

@router.post("/generate-stream")
@limiter.limit("10/minute")
async def generate_stream(req: GenerateRequest, request: Request, db: AsyncSession = Depends(deps.get_db)):
    sanitized = sanitize_pii(req.prompt)
    context = _context_store.get_last_messages(req.session_id, limit=5)
    
    async def stream_generator():
        full_text = []
        start_time = time.time()
        try:
            async for chunk in _gemini.generate_stream(sanitized, context=context):
                full_text.append(chunk)
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            
            # Save to context after full generation
            final_text = "".join(full_text)
            
            response_time_ms = int((time.time() - start_time) * 1000)
            # Estimate tokens: 1 token ~= 4 chars
            prompt_estimated = len(sanitized) // 4
            completion_estimated = len(final_text) // 4
            total_estimated = prompt_estimated + completion_estimated
            cost = (prompt_estimated / 1_000_000.0) * 0.075 + (completion_estimated / 1_000_000.0) * 0.30

            log_entry = AIUsageLog(
                provider="Gemini-Stream",
                model_name=_gemini.model_name,
                prompt_tokens=prompt_estimated,
                completion_tokens=completion_estimated,
                total_tokens=total_estimated,
                cost=cost,
                response_time_ms=response_time_ms,
                status="success" if not final_text.startswith("Błąd") else "error"
            )
            db.add(log_entry)
            await db.commit()

            _context_store.append_message(req.session_id, role="user", text=sanitized, keep_last=10)
            _context_store.append_message(req.session_id, role="model", text=final_text, keep_last=10)
            yield "data: [DONE]\n\n"
        except Exception as e:
            _logger.exception("AI streaming failed")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@router.post("/intent", response_model=IntentResponse)
@limiter.limit("20/minute")
async def analyze_intent(req: IntentRequest, request: Request, db: AsyncSession = Depends(deps.get_db)):
    """
    Module 3: User Intent Engine / AI Router.
    Analyzes user queries to route them appropriately in the application.
    """
    sanitized_query = sanitize_pii(req.query)
    
    schema = {
        "intent": "string (one of: legal_advice, document_generation, support, dashboard_navigation, other)",
        "action": "string (specific action to take, e.g., 'open_chat', 'go_to_invoices', 'open_template_generator')",
        "confidence": "float (0.0 to 1.0)",
        "entities": "dictionary of extracted entities (e.g., {'document_type': 'nda', 'topic': 'rozowód'})"
    }

    prompt = f"""
    Jesteś silnikiem rozpoznawania intencji (Intent Router) w systemie Lexportal (LegalTech).
    Zanalizuj poniższe polecenie użytkownika i sklasyfikuj jego intencję.
    
    Polecenie: "{sanitized_query}"
    
    Dostępne kategorie (intent):
    - legal_advice (Pytania prawne, porady, czat na temat spraw prawnych)
    - document_generation (Prośba o stworzenie pisma, umowy, dokumentu)
    - dashboard_navigation (Chęć przejścia do konkretnej sekcji aplikacji np. faktury, sprawy, kalendarz, ustawienia)
    - support (Problemy techniczne, reset hasła)
    - other (Inne lub nierozpoznane)
    """

    start_time = time.time()
    try:
        from app.services.llm_service import llm_service
        json_result = await llm_service.generate_json(prompt, schema=schema)
        
        # Log AI Usage for Router
        response_time_ms = int((time.time() - start_time) * 1000)
        # Assuming minimal token usage for groq
        log_entry = AIUsageLog(
            provider="Groq-Router",
            model_name=llm_service.model,
            prompt_tokens=150,
            completion_tokens=50,
            total_tokens=200,
            cost=0.0001,
            response_time_ms=response_time_ms,
            status="success"
        )
        db.add(log_entry)
        await db.commit()

        return IntentResponse(
            intent=json_result.get("intent", "other"),
            action=json_result.get("action", "unknown"),
            confidence=float(json_result.get("confidence", 0.0)),
            entities=json_result.get("entities", {})
        )
    except Exception as e:
        _logger.exception("Intent Engine error")
        raise HTTPException(status_code=500, detail="Błąd silnika decyzyjnego.")

@router.post("/analyze-case")
@limiter.limit("5/minute")
async def analyze_case(
    req: AnalyzeRequest,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> dict:
    """
    Advanced Case Analysis (Lexportal v2.0).
    Orchestrates multiple AI models to provide in-depth legal assessment.
    """
    from app.services.ai_orchestrator import orchestrator
    from app.services.notification_service import NotificationService
    import time
    
    start_time = time.time()
    sanitized_query = sanitize_pii(req.query)
    
    analysis = await orchestrator.analyze_case(sanitized_query)
    
    if not analysis:
        raise HTTPException(status_code=500, detail="AI analysis failed.")
        
    response_time_ms = int((time.time() - start_time) * 1000)
    
    # Log usage
    log = AIUsageLog(
        user_id=current_user.id,
        provider="Orchestrator-v2",
        model_name="Multi-Model-Tiered",
        prompt_tokens=len(sanitized_query) // 4,
        completion_tokens=500,
        total_tokens=(len(sanitized_query) // 4) + 500,
        cost=0.01,
        response_time_ms=response_time_ms,
        status="success"
    )
    db.add(log)
    
    # Send System Notification
    await NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        message=f"Twoja analiza AI dla zapytania: '{req.query[:30]}...' jest gotowa."
    )
    
    await db.commit()
    return analysis
