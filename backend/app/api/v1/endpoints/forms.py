import json
import logging
import uuid
import os
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.sql import func

from app.api import deps
from app.db.models import User, FormTemplate, UserFormDraft, Document
from app.schemas.form import FormTemplate as FormTemplateSchema, UserFormDraft as UserFormDraftSchema
from app.services.pdf_generator_service import pdf_generator_service
from app.core.encryption import encryption_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/templates", response_model=List[FormTemplateSchema])
async def get_form_templates(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List available document templates."""
    result = await db.execute(select(FormTemplate).where(FormTemplate.is_active == True))
    return result.scalars().all()

@router.get("/templates/{code}", response_model=FormTemplateSchema)
async def get_template_by_code(
    code: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Retrieve template definition by its code."""
    result = await db.execute(select(FormTemplate).where(FormTemplate.code == code))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.get("/drafts/{draft_id}", response_model=UserFormDraftSchema)
async def get_form_draft(
    draft_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Retrieve a specific draft."""
    result = await db.execute(
        select(UserFormDraft).where(
            (UserFormDraft.id == draft_id) & (UserFormDraft.user_id == current_user.id)
        )
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # Decrypt data for schema
    data = json.loads(encryption_service.decrypt(draft.data_enc))
    
    return {
        "id": draft.id,
        "user_id": draft.user_id,
        "template_id": draft.template_id,
        "data": data,
        "status": draft.status,
        "created_at": draft.created_at,
        "updated_at": draft.updated_at
    }

@router.post("/drafts", response_model=UserFormDraftSchema)
async def save_form_draft(
    template_id: uuid.UUID,
    data: dict,
    draft_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Save or update a form draft (Auto-save)."""
    encrypted_data = encryption_service.encrypt(json.dumps(data))
    
    if draft_id:
        result = await db.execute(
            select(UserFormDraft).where(
                (UserFormDraft.id == draft_id) & (UserFormDraft.user_id == current_user.id)
            )
        )
        draft = result.scalar_one_or_none()
        if draft:
            draft.data_enc = encrypted_data
            # Manual update for updated_at if not handled by onupdate in Mapped style sometimes
            draft.updated_at = func.now()
            await db.commit()
            await db.refresh(draft)
        else:
            raise HTTPException(status_code=404, detail="Draft not found")
    else:
        draft = UserFormDraft(
            user_id=current_user.id,
            template_id=template_id,
            data_enc=encrypted_data,
            status="draft"
        )
        db.add(draft)
        await db.commit()
        await db.refresh(draft)
    
    return {
        "id": draft.id,
        "user_id": draft.user_id,
        "template_id": draft.template_id,
        "data": data,
        "status": draft.status,
        "created_at": draft.created_at,
        "updated_at": draft.updated_at
    }

@router.post("/generate/{draft_id}")
async def generate_form_pdf(
    draft_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Generate the final PDF and create a Document record."""
    try:
        pdf_bytes = await pdf_generator_service.fill_pdf_template(db, draft_id, current_user.id)
        
        # Save to storage
        filename = f"form_{draft_id}_{uuid.uuid4().hex[:8]}.pdf"
        storage_dir = os.path.join("app", "static", "generated") # Assuming static dir is served
        os.makedirs(storage_dir, exist_ok=True)
        file_path = os.path.join(storage_dir, filename)
        
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
            
        # Create Document record
        doc = Document(
            id=uuid.uuid4(),
            filename=filename,
            file_url=f"/static/generated/{filename}",
            status="unsigned"
        )
        db.add(doc)
        
        # Update draft status
        await db.execute(
            update(UserFormDraft)
            .where(UserFormDraft.id == draft_id)
            .values(status="generated")
        )
        
        await db.commit()
        return {"document_id": str(doc.id), "file_url": doc.file_url}
        
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
