# =============================================================================
# LexPortal Backend - Serwis Powiadomień (notification_service.py)
# =============================================================================
#
# Ten serwis odpowiada za:
#   - Tworzenie powiadomień systemowych dla użytkowników.
#   - Zarządzanie stanem (przeczytane/nieprzeczytane) w bazie danych.
#   - (W przyszłości) Integrację z systemami zewnętrznymi (E-mail, Push).
#
# =============================================================================

import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Notification

class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: uuid.UUID,
        message: str,
    ) -> Notification:
        """
        Tworzy nowe powiadomienie dla użytkownika.
        """
        notification = Notification(
            user_id=user_id,
            message=message,
            is_read=False
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        notification_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """
        Oznacza pojedyncze powiadomienie jako przeczytane.
        """
        from sqlalchemy import select
        result = await db.execute(
            select(Notification)
            .where(Notification.id == notification_id)
            .where(Notification.user_id == user_id)
        )
        notification = result.scalar_one_or_none()
        if notification:
            notification.is_read = True
            await db.commit()
            return True
        return False

    @staticmethod
    async def mark_all_as_read(
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> None:
        """
        Oznacza wszystkie powiadomienia użytkownika jako przeczytane.
        """
        from sqlalchemy import update
        await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id)
            .values(is_read=True)
        )
        await db.commit()
