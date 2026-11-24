from typing import Any, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.api import deps
from app.db.models import Message, User
from app.core.encryption import encryption_service

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

from app.schemas.message import MessageResponse, MessageCreate, MessageUpdate

@router.get("/", response_model=List[MessageResponse])
async def read_messages(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
    include_archived: bool = False
) -> Any:
    """
    Retrieve messages.
    """
    query = select(Message).where(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id
        )
    )
    
    if not include_archived:
        query = query.where(Message.is_archived == False)
        
    result = await db.execute(query.offset(skip).limit(limit).order_by(Message.created_at.desc()))
    messages = result.scalars().all()
    
    return [
        {
            "id": m.id,
            "content": encryption_service.decrypt(m.content_enc) or "[Błąd odszyfrowania]" if m.content_enc else "",
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "subject": m.subject,
            "is_read": m.is_read,
            "is_archived": m.is_archived,
            "file_url": m.file_url,
            "file_type": m.file_type,
            "created_at": m.created_at
        }
        for m in messages
    ]

@router.post("/send", response_model=MessageResponse)
async def send_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    try:
        print(f"DEBUG: send_message start - user={current_user.id}, recipient={message_in.recipient_id}")
        msg = Message(
            sender_id=current_user.id,
            recipient_id=message_in.recipient_id,
            subject=message_in.subject,
            content_enc=encryption_service.encrypt(message_in.content),
            file_url=message_in.file_url,
            file_type=message_in.file_type
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        print(f"DEBUG: send_message success - msg_id={msg.id}")
        
        return {
            "id": msg.id,
            "content": message_in.content,
            "sender_id": msg.sender_id,
            "recipient_id": msg.recipient_id,
            "subject": msg.subject,
            "is_read": msg.is_read,
            "is_archived": msg.is_archived,
            "file_url": msg.file_url,
            "file_type": msg.file_type,
            "created_at": msg.created_at
        }
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error sending message. Please try again later."
        )

@router.patch("/{message_id}", response_model=MessageResponse)
async def update_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    message_id: uuid.UUID,
    message_in: MessageUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update message status (read/archived).
    """
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if msg.sender_id != current_user.id and msg.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = message_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(msg, field, value)
    
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    
    return {
        "id": msg.id,
        "content": encryption_service.decrypt(msg.content_enc) or "[Błąd odszyfrowania]",
        "sender_id": msg.sender_id,
        "recipient_id": msg.recipient_id,
        "subject": msg.subject,
        "is_read": msg.is_read,
        "is_archived": msg.is_archived,
        "file_url": msg.file_url,
        "file_type": msg.file_type,
        "created_at": msg.created_at
    }
