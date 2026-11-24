from __future__ import annotations

import uuid
from typing import Any, List

import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.api import deps
from app.db.models import Case, User, Document, AuditLog
from app.schemas.case import Case as CaseSchema, CaseCreate, CaseUpdate
from app.schemas.document import Document as DocumentSchema
from app.schemas.audit import AuditLogResponse
from app.core.encryption import encryption_service
from app.services.ai_orchestrator import orchestrator

UPLOAD_DIR = "uploads"

router = APIRouter()


async def run_ai_risk_assessment_task(case_id: uuid.UUID, db_session_factory: Any):
    """Asynchroniczna walidacja ryzyka spraw."""
    from app.db.session import SessionLocal
    async with SessionLocal() as db:
        result = await db.execute(select(Case).where(Case.id == case_id))
        case = result.scalar_one_or_none()
        if not case:
            return

        description = f"Tytuł: {case.title}\nTyp: {case.case_type}\nOpis: {case.description}"
        assessment = await orchestrator.get_risk_assessment(description)
        
        if assessment:
            case.risk_score = assessment.get("score")
            case.risk_level = assessment.get("level")
            case.risk_analysis = assessment
            await db.commit()

@router.get("/", response_model=List[CaseSchema])
async def read_cases(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve cases.
    """
    if (current_user.role or "").upper() == "ADMIN":
        result = await db.execute(
            select(Case)
            .options(selectinload(Case.documents))
            .order_by(desc(Case.created_at))
            .offset(skip)
            .limit(limit)
        )
    else:
        result = await db.execute(
            select(Case)
            .where(Case.user_id == current_user.id)
            .options(selectinload(Case.documents))
            .order_by(desc(Case.created_at))
            .offset(skip)
            .limit(limit)
        )
    cases = result.scalars().all()
    
    return cases


@router.post("/", response_model=CaseSchema)
async def create_case(
    *,
    db: AsyncSession = Depends(deps.get_db),
    case_in: CaseCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new case.
    """
    case = Case(
        title=case_in.title,
        description=case_in.description,
        client_name=case_in.client_name,
        client_id_str=case_in.client_id_str,
        case_type=case_in.case_type,
        user_id=current_user.id,
    )
    db.add(case)
    await db.commit()
    
    # Refresh with eager loading to avoid MissingGreenlet
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.documents))
        .where(Case.id == case.id)
    )
    case_with_docs = result.scalar_one()
    
    # Trigger Risk Assessment in background
    background_tasks.add_task(run_ai_risk_assessment_task, case.id, None)
    
    return case_with_docs


@router.get("/{id}", response_model=CaseSchema)
async def read_case(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get case by ID.
    """
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.documents))
        .where(Case.id == id)
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if (current_user.role or "").upper() != "ADMIN" and case.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    return case


@router.patch("/{id}", response_model=CaseSchema)
async def update_case(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    case_in: CaseUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update case details or status.
    """
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.documents))
        .where(Case.id == id)
    )
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if (current_user.role or "").upper() != "ADMIN" and case.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = case_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)

    await db.commit()
    await db.refresh(case)
    return case


@router.post("/{id}/documents", response_model=DocumentSchema)
async def upload_document(
    id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a document to a case with strict validation.
    """
    # 1. Validation: File extension
    allowed_extensions = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # 2. Validation: File size (limit to 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    await file.seek(0)

    # 3. Verify case access
    result = await db.execute(select(Case).where(Case.id == id))
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if (current_user.role or "").upper() != "ADMIN" and case.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # 4. Save file safely
    # Use a secure filename to prevent path traversal
    import secrets
    safe_filename = f"{id}_{secrets.token_hex(4)}_{os.path.basename(file.filename)}"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_location, "wb+") as file_object:
        file_object.write(contents)
    
    # 5. Create DB record
    document = Document(
        case_id=id,
        filename=file.filename,
        file_url=file_location,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return document


@router.get("/{id}/history", response_model=List[AuditLogResponse])
async def read_case_history(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve audit logs for a specific case.
    """
    # Verify case access
    result = await db.execute(select(Case).where(Case.id == id))
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if (current_user.role or "").upper() != "ADMIN" and case.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Fetch logs where details->'case_id' matches
    # PostgreSQL JSONB operator ->> returns text
    from sqlalchemy import text
    query = (
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .where(
            (AuditLog.details["case_id"].astext == str(id)) |
            (AuditLog.details["resource_id"].astext == str(id))
        )
        .order_by(desc(AuditLog.timestamp))
    )
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=log.id,
            action=log.action,
            actor_name=log.actor.full_name if log.actor else "System",
            ip_address=log.ip_address,
            status=log.status,
            timestamp=log.timestamp,
            details=log.details,
        )
        for log in logs
    ]
