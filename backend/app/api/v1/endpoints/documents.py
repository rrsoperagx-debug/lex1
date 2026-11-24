# ============================================================================
# LexPortal - API v1: Moduł Dokumentów (Podpis Elektroniczny)
# ============================================================================
# Opis:
#   Ten plik definiuje endpointy API dla modułu obsługi dokumentów prawnych.
#   Główną funkcjonalnością jest integracja (symulowana) z platformami
#   podpisu elektronicznego (np. Autenti/DocuSign).
#
# Kluczowe endpointy:
#   - POST /send-to-sign: Umożliwia wysłanie wygenerowanego dokumentu do
#     klienta w celu złożenia podpisu. Obsługuje zarówno realne UUID
#     spraw z bazy danych, jak i mock-id wykorzystywane wczesniej.
#
# Integracje:
#   - Autenti (Symulacja): Przyjmuje dane dokumentu i maila klienta.
#   - Audit Log: Każda próba podpisu jest rejestrowana w systemie bezpieczeństwa.
#
# Dostęp:
#   Endpointy wymagają uwierzytelnionego użytkownika z tokenem JWT.
# ============================================================================
from __future__ import annotations

import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import os

from app.api import deps
from app.db.models import User, Case, AuditLog, Document
from app.services.audit import create_audit_log

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/generate", response_model=Dict[str, Any])
async def generate_document(
    data: Dict[str, Any],
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Generate a document from a legal template.
    Expects template_id, case_id (optional), and fields data.
    """
    from app.services.document_service import document_service
    import uuid
    
    template_id = data.get("template_id")
    case_id = data.get("case_id")
    fields_data = data.get("data", {})
    
    if not template_id:
        raise HTTPException(status_code=400, detail="template_id is required")
        
    try:
        template_uuid = uuid.UUID(str(template_id))
        case_uuid = uuid.UUID(str(case_id)) if case_id else None
        
        doc = await document_service.generate_from_template(
            db=db,
            template_id=template_uuid,
            case_id=case_uuid,
            data=fields_data
        )
        
        return {
            "status": "success",
            "document_id": str(doc.id),
            "filename": doc.filename,
            "file_url": doc.file_url
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating document: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during document generation")

@router.post("/send-to-sign", response_model=Dict[str, Any])
async def send_document_to_sign(
    data: Dict[str, Any],
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Simulate sending a document to be signed via Autenti/DocuSign.
    """
    case_id = data.get("caseId")
    document_id = data.get("documentId")
    logger.info(f"Received send-to-sign request for caseId: {case_id}, documentId: {document_id}")
    
    if not case_id:
        raise HTTPException(status_code=400, detail="caseId is required")

    import uuid
    # Verify document exists if provided
    document = None
    if document_id:
        try:
            doc_uuid = uuid.UUID(str(document_id))
            from app.db.models import Document
            doc_result = await db.execute(select(Document).where(Document.id == doc_uuid))
            document = doc_result.scalar_one_or_none()
            if document:
                await db.execute(
                    update(Document)
                    .where(Document.id == doc_uuid)
                    .values(status="sent")
                )
        except (ValueError, AttributeError):
            logger.warning(f"Invalid document_id format or document not found: {document_id}")

    # Verify case exists
    try:
        case_uuid = uuid.UUID(str(case_id))
        
        result = await db.execute(select(Case).where(Case.id == case_uuid))
        case = result.scalar_one_or_none()
        
        if not case:
            raise HTTPException(status_code=404, detail=f"Case with ID {case_id} not found in database")

        # Update case status
        await db.execute(
            update(Case)
            .where(Case.id == case_uuid)
            .values(status="Oczekuje na podpis")
        )
        await db.commit()
        
    except (ValueError, AttributeError):
        # Handle mock ID (e.g. "LP/2023/101")
        logger.info(f"Using mock case ID: {case_id}. Skipping database update.")
        case = None # We proceed without a real case object
    
    # Log the action
    logger.info(f"Sending document for case {case_id} to sign. Client: {data.get('clientEmail')}")

    # Create audit log (linked to user even if case is mock)
    await create_audit_log(
        db=db,
        action="document_sent_to_sign",
        actor_id=current_user.id,
        details={
            "case_id": str(case_id),
            "document_id": str(document_id) if document_id else None,
            "client_email": data.get("clientEmail"),
            "document_title": data.get("title"),
            "is_mock": case is None
        },
        ip_address=None
    )

    return {
        "status": "success",
        "message": "Document successfully sent to Autenti for signing",
        "provider": "Autenti",
        "client_email": data.get("clientEmail"),
        "is_mock": case is None
    }


@router.get("/{id}/download")
async def download_document(
    id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Download a document by ID.
    Requires relevant permissions (Owner or Admin).
    """
    # 1. Fetch document and related case
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.case))
        .where(Document.id == id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2. Check permissions
    # If case is linked, check if user is owner. If not linked, check if user is admin (or handle differently)
    if document.case:
        if current_user.role != "ADMIN" and document.case.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions to access this document")
    else:
        # Document without case_id (e.g. system template or orphaned) - only Admin for now
        if current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Not enough permissions")

    # 3. Verify file exists
    if not os.path.exists(document.file_url):
        logger.error(f"File not found on disk: {document.file_url}")
        raise HTTPException(status_code=404, detail="Physical file not found on server")

    # 4. Return file
    return FileResponse(
        path=document.file_url,
        filename=document.filename,
        media_type="application/octet-stream"
    )

