"""
Endpointy FastAPI dla systemu płatności LexPortal / Mollie.

Routing:
  POST /payments/create/{case_id}  – inicjuje płatność (wymaga JWT)
  POST /payments/webhook            – publiczny endpoint dla Mollie (BEZ JWT)
  GET  /payments/status/{case_id}   – polling statusu płatności dla sprawy

UWAGA: endpoint /webhook jest celowo PUBLICZNY (brak get_current_active_user).
Serwery Mollie nie posiadają tokena JWT. Middleware DDoS nie blokuje tej ścieżki
(filtruje wyłącznie /admin, /.env, /wp-admin itp.).
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.db.models import Case, Payment, User
from app.schemas.payment import PaymentInitResponse
from app.services.payment_service import payment_service, resolve_amount

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /payments/create/{case_id}
# ---------------------------------------------------------------------------

@router.post(
    "/create/{case_id}",
    response_model=PaymentInitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Utwórz płatność Mollie dla sprawy",
)
async def create_payment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    case_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Inicjuje płatność w Mollie dla wskazanej sprawy.

    Sprawdza:
    - Czy sprawa istnieje i należy do użytkownika (lub jest adminem/prawnikiem)
    - Czy sprawa nie jest już opłacona

    Zwraca PaymentInitResponse z checkout_url do przekierowania frontendu.
    """
    # 1. Sprawdź czy sprawa istnieje i należy do użytkownika
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono sprawy lub brak uprawnień.",
        )

    is_owner = case.user_id == current_user.id
    is_admin = current_user.role in ("admin", "ADMIN", "lawyer", "LAWYER")
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie znaleziono sprawy lub brak uprawnień.",
        )

    if case.status == "Opłacona/W analizie":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ta sprawa jest już opłacona i w trakcie analizy.",
        )

    # 2. Określ kwotę i opis (zgodnie ze wzorcem feedback + cennik per typ sprawy)
    amount = resolve_amount(case.title)
    description = f"LexPortal - Analiza prawna sprawy: {case.title}"

    # 3. Wywołaj serwis płatności
    try:
        db_payment = await payment_service.create_payment(
            db=db,
            user_id=current_user.id,
            case_id=case.id,
            amount=amount,
            description=description,
        )
    except Exception as exc:
        logger.error("Błąd create_payment case_id=%s: %s", case_id, exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if not db_payment:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nie udało się utworzyć płatności. Spróbuj ponownie.",
        )

    logger.info(
        "Płatność zainicjowana: case_id=%s user_id=%s mollie_id=%s",
        case_id,
        current_user.id,
        db_payment.mollie_id,
    )
    return db_payment  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# POST /payments/webhook  (PUBLICZNY – brak JWT)
# ---------------------------------------------------------------------------

@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Webhook Mollie (publiczny – bez JWT)",
)
async def mollie_webhook(
    background_tasks: BackgroundTasks,
    id: str = Form(...),  # Mollie wysyła ID płatności w polu 'id' jako form-data
    db: AsyncSession = Depends(deps.get_db),
) -> dict:
    """
    Publiczny endpoint wywoływany przez serwery Mollie przy każdej zmianie
    statusu płatności.

    Mollie oczekuje HTTP 200 w ciągu 15 sekund – dlatego przetwarzanie
    odbywa się w BackgroundTasks (zwracamy 200 natychmiast).

    Uwaga: Mollie wysyła tylko ID płatności – resztę danych pobieramy sami
    z ich API wewnątrz handle_webhook.
    """
    if not id or not id.strip():
        # Mollie wysyła pusty webhook testowy przy konfiguracji
        logger.debug("Webhook: pusty parametr id – ignoruję (test Mollie).")
        return {"status": "success"}

    logger.info("Webhook Mollie otrzymany: mollie_id=%s", id)

    # Odpowiadamy 200 natychmiast – Mollie nie czeka na przetworzenie
    background_tasks.add_task(payment_service.handle_webhook, db, id)

    return {"status": "success"}


# ---------------------------------------------------------------------------
# GET /payments/status/{case_id}  – polling ze strony frontend
# ---------------------------------------------------------------------------

@router.get(
    "/status/{case_id}",
    summary="Pobierz status płatności dla sprawy (polling)",
)
async def get_payment_status(
    *,
    db: AsyncSession = Depends(deps.get_db),
    case_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> dict:
    """
    Zwraca aktualny status płatności i sprawy.

    Używany przez komponent PaymentStatus.tsx do pollingu co 3 sekundy
    po powrocie użytkownika ze strony płatności Mollie.
    """
    case_result = await db.execute(select(Case).where(Case.id == case_id))
    case = case_result.scalar_one_or_none()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprawa nie znaleziona.",
        )

    is_owner = case.user_id == current_user.id
    is_admin = current_user.role in ("admin", "ADMIN", "lawyer", "LAWYER")
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień.",
        )

    # Ostatnia płatność dla tej sprawy
    payment_result = await db.execute(
        select(Payment)
        .where(Payment.case_id == case_id)
        .order_by(Payment.created_at.desc())
        .limit(1)
    )
    payment = payment_result.scalars().first()

    return {
        "case_id": str(case_id),
        "case_status": case.status,
        "payment_status": payment.status if payment else None,
        "mollie_id": payment.mollie_id if payment else None,
        "is_paid": case.status == "Opłacona/W analizie",
    }
