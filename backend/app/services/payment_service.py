"""
Serwis płatności Mollie dla LexPortal.

Używa asynchronicznego SDK: mollie-api-py
  - async with ClientSDK(security=Security(api_key=...)) as client:
  - await client.payments.create_async(...)
  - await client.payments.get_async(payment_id=...)

Kluczowe cechy implementacji:
  1. Tworzymy rekord DB przed wywołaniem Mollie (db.flush) – zawsze mamy ślad audytu
  2. idempotency_key = str(case_id) – zapobiega podwójnemu obciążeniu za tę samą sprawę
  3. webhookUrl + BackgroundTasks – HTTP 200 natychmiast, przetwarzanie w tle
  4. Przy statusie "paid" sprawa → "Opłacona/W analizie"
  5. Kwoty jako string "199.00" (wymóg Mollie API)
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Optional

from mollie import ClientSDK, Security
from mollie.models import ClientError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.models import Case, Payment

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cennik (per słowa kluczowe w tytule sprawy)
# ---------------------------------------------------------------------------

CASE_PRICE_MAP: dict[str, str] = {
    "biznes":       settings.CASE_PRICE_BUSINESS,
    "firma":        settings.CASE_PRICE_BUSINESS,
    "spółka":       settings.CASE_PRICE_BUSINESS,
    "umowa":        settings.CASE_PRICE_BUSINESS,
    "karny":        settings.CASE_PRICE_CRIMINAL,
    "kryminalne":   settings.CASE_PRICE_CRIMINAL,
    "przestępstwo": settings.CASE_PRICE_CRIMINAL,
}

PAID_STATUS = "paid"
CASE_PAID_STATUS = "Opłacona/W analizie"


def resolve_amount(case_title: str) -> str:
    """
    Wyznacza kwotę na podstawie tytułu sprawy.
    Zwraca string z 2 cyframi po przecinku (wymóg Mollie), np. "199.00".
    Eksportowana funkcja – używana też przez endpoint.
    """
    title_lower = (case_title or "").lower()
    for keyword, price in CASE_PRICE_MAP.items():
        if keyword in title_lower:
            return price
    return settings.CASE_PRICE_DEFAULT


def _get_api_key() -> str:
    """Pobiera klucz API Mollie ze zmiennych środowiskowych."""
    api_key = settings.MOLLIE_API_KEY or os.getenv("MOLLIE_API_KEY", "")
    if not api_key:
        raise ValueError(
            "Brakuje klucza API Mollie. "
            "Ustaw MOLLIE_API_KEY w pliku .env lub zmiennych środowiskowych."
        )
    return api_key


# ---------------------------------------------------------------------------
# Serwis
# ---------------------------------------------------------------------------

class PaymentService:
    """
    Warstwa logiki biznesowej integrująca Mollie z bazą danych LexPortal.

    Wzorzec async with ClientSDK:
      Każda operacja tworzy własny asynchroniczny kontekst HTTP klienta Mollie.
      Dzięki temu:
        - event-loop FastAPI nigdy nie jest blokowany (I/O jest natywnie async)
        - połączenia HTTP są poprawnie zamykane po każdej operacji
        - brak globalnego stanu (thread-safe)
    """

    async def create_payment(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        case_id: uuid.UUID,
        amount: str,
        description: str,
    ) -> Optional[Payment]:
        """
        Tworzy płatność Mollie i zapisuje pełny rekord audytu w bazie danych.

        Parametry są prymitywne (nie ORM objects) – endpoint przekazuje
        już zwalidowane wartości po sprawdzeniu uprawnień.

        Kolejność operacji (ważna dla spójności danych):
          1. Tworzymy rekord Payment w DB i wywołujemy db.flush()
             → uzyskujemy UUID do przekazania jako idempotency_key
          2. Wywołujemy Mollie API async
          3. Uzupełniamy rekord o mollie_id i checkout_url
          4. Commitujemy transakcję

        Jeśli Mollie zwróci błąd → rollback, brak rekordu w DB.
        """
        # APP_BASE_URL to publiczny adres aplikacji (ngrok / produkcja / localhost:80)
        # nginx na porcie 80 serwuje frontend I proksy API pod /api → oba URL-e używają tej samej domeny
        redirect_url = (
            f"{settings.APP_BASE_URL}/#/payment/status?case_id={case_id}"
        )
        webhook_url = (
            f"{settings.APP_BASE_URL}{settings.API_V1_STR}/payments/webhook"
        )

        try:
            # 1. Tworzymy lokalny rekord (przed wywołaniem Mollie)
            db_payment = Payment(
                user_id=user_id,
                case_id=case_id,
                amount=float(amount),
                currency="PLN",
                status="open",
                description=description,
            )
            db.add(db_payment)
            await db.flush()  # Pobieramy UUID (db_payment.id) przed commitem

            # 2. Wywołujemy Mollie API – async with ClientSDK (nie blokuje event-loop)
            async with ClientSDK(
                security=Security(api_key=_get_api_key())
            ) as client:
                payment_request = {
                    "amount": {
                        "currency": "PLN",
                        "value": amount,  # "199.00" – wymagany format Mollie
                    },
                    "description": description,
                    "redirectUrl": redirect_url,
                    "webhookUrl": webhook_url,
                    "metadata": {
                        "payment_id": str(db_payment.id),
                        "case_id": str(case_id),
                        "user_id": str(user_id),
                    },
                }

                # idempotency_key = db_payment.id (UUID tej konkretnej próby płatności)
                # Zapobiega podwójnemu obciążeniu klienta przy szybkim klikaniu,
                # ale pozwala ponowić próbę dla tej samej sprawy przy nowym rekordzie.
                mollie_payment = await client.payments.create_async(
                    payment_request=payment_request,
                    idempotency_key=str(db_payment.id),
                )

            # 3. Uzupełniamy rekord o dane z Mollie
            # mollie-api-py SDK: checkout URL jest w mollie_payment.links.checkout.href
            # (pole links ma alias "_links", checkout jest Optional[URL])
            db_payment.mollie_id = mollie_payment.id
            checkout_url: Optional[str] = None
            if mollie_payment.links and mollie_payment.links.checkout:
                checkout_url = mollie_payment.links.checkout.href
            db_payment.checkout_url = checkout_url

            await db.commit()
            await db.refresh(db_payment)

            logger.info(
                "Płatność utworzona: mollie_id=%s payment_id=%s case_id=%s kwota=%s PLN",
                mollie_payment.id,
                db_payment.id,
                case_id,
                amount,
            )
            return db_payment

        except ValueError:
            await db.rollback()
            raise  # Brak klucza API – re-raise do endpointu
        except ClientError as exc:
            await db.rollback()
            logger.error(
                "Mollie ClientError przy create_payment case_id=%s: %s",
                case_id,
                exc.message if hasattr(exc, "message") else str(exc),
            )
            return None
        except Exception as exc:
            await db.rollback()
            logger.error(
                "Nieoczekiwany błąd create_payment case_id=%s: %s",
                case_id,
                exc,
            )
            return None

    async def handle_webhook(
        self,
        db: AsyncSession,
        mollie_id: str,
    ) -> Optional[Payment]:
        """
        Obsługuje webhook od Mollie: pobiera aktualny status płatności
        i aktualizuje bazę danych.

        Wywoływana przez endpoint /webhook przez BackgroundTasks –
        serwer Mollie otrzymuje HTTP 200 natychmiast, a my przetwarzamy w tle.

        Webhook jest odporny na błędy: cały blok w try/except.

        Jeśli status == 'paid' → sprawa dostaje status "Opłacona/W analizie".
        """
        try:
            # 1. Pobierz aktualny status z Mollie
            async with ClientSDK(
                security=Security(api_key=_get_api_key())
            ) as client:
                mollie_payment = await client.payments.get_async(payment_id=mollie_id)

            new_status: str = mollie_payment.status

            # 2. Znajdź płatność w naszej bazie
            result = await db.execute(
                select(Payment).where(Payment.mollie_id == mollie_id)
            )
            db_payment = result.scalar_one_or_none()

            if not db_payment:
                logger.warning(
                    "Webhook: brak płatności mollie_id=%s w bazie danych.", mollie_id
                )
                return None

            old_status = db_payment.status
            db_payment.status = new_status

            # 3. Jeśli zapłacono – aktywuj analizę sprawy
            if new_status == PAID_STATUS and old_status != PAID_STATUS:
                case_result = await db.execute(
                    select(Case).where(Case.id == db_payment.case_id)
                )
                db_case = case_result.scalar_one_or_none()
                if db_case:
                    db_case.status = CASE_PAID_STATUS
                    db.add(db_case)
                    logger.info(
                        "Sprawa case_id=%s → '%s'",
                        db_payment.case_id,
                        CASE_PAID_STATUS,
                    )

            await db.commit()
            await db.refresh(db_payment)

            logger.info(
                "Webhook przetworzony: mollie_id=%s %s → %s",
                mollie_id,
                old_status,
                new_status,
            )
            return db_payment

        except ValueError:
            raise
        except Exception as exc:
            logger.error("Błąd webhook mollie_id=%s: %s", mollie_id, exc)
            await db.rollback()
            return None


# Singleton serwisu – importowany przez endpointy FastAPI
payment_service = PaymentService()
