from typing import Any, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db.models import ContactMessage, User, Message
from app.schemas.contact import ContactMessage as ContactSchema, ContactMessageCreate
from app.core.encryption import encryption_service

router = APIRouter()

@router.get("/", response_model=List[ContactSchema])
async def read_contact_messages(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve contact messages (admin/lawyer only).
    """
    if current_user.role not in ["admin", "lawyer"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    result = await db.execute(select(ContactMessage).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/", response_model=ContactSchema)
async def create_contact_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    contact_in: ContactMessageCreate,
    current_user_id: Optional[uuid.UUID] = None, # Optional if anonymous
) -> Any:
    """
    Create new contact message.
    """
    contact = ContactMessage(
        **contact_in.model_dump(),
        user_id=current_user_id
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    
    # Task 8: Send to Operator Panel as internal message
    result = await db.execute(select(User).where(User.role == "lawyer", User.is_active == True))
    lawyers = result.scalars().all()
    
    sender_info = f"Użytkownik (ID: {current_user_id})" if current_user_id else f"Gość ({contact_in.sender_name or 'Anonim'}, {contact_in.sender_email or 'brak email'})"
    
    for lawyer in lawyers:
        sys_msg = Message(
            sender_id=lawyer.id, # Placeholder: lawyer as sender for system message if no system user
            recipient_id=lawyer.id,
            subject=f"Nowe zgłoszenie: {contact.subject}",
            content_enc=encryption_service.encrypt(f"Otrzymano nowe zgłoszenie od {sender_info}:\n\n{contact.message}")
        )
        db.add(sys_msg)
    
    await db.commit()
    return contact

