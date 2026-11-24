from typing import Any, List, Optional, Dict
from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import AuditLog, User
from app.services.audit import manager
from app.api.deps import get_current_active_superuser

router = APIRouter()


from app.schemas.audit import AuditLogResponse, PaginatedAuditLogs


@router.get("/logs", response_model=PaginatedAuditLogs)
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    action: Optional[str] = None,
    status: Optional[str] = None,
) -> Any:
    """
    Retrieve audit logs with server-side pagination and filtering.
    """
    offset = (page - 1) * size
    
    # Base query
    query = select(AuditLog).options(selectinload(AuditLog.actor))
    
    # Filters
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
    if status:
        query = query.where(AuditLog.status == status)
        
    # Count total
    count_query = select(func.count()).select_from(query.alias())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Sort and paginate
    query = query.order_by(desc(AuditLog.timestamp)).limit(size).offset(offset)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    items = [
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
    
    return PaginatedAuditLogs(
        items=items,
        total=total,
        page=page,
        size=size
    )


@router.get("/logs/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve a single audit log by ID.
    """
    result = await db.execute(
        select(AuditLog).options(selectinload(AuditLog.actor)).where(AuditLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    
    return AuditLogResponse(
        id=log.id,
        action=log.action,
        actor_name=log.actor.full_name if log.actor else "System",
        ip_address=log.ip_address,
        status=log.status,
        timestamp=log.timestamp,
        details=log.details,
    )

@router.websocket("/ws/logs")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Real-time audit log stream via WebSocket.
    Token is verified for superuser privileges.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        from jose import jwt
        from app.core.config import settings
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No user_id in token")
        
        # Verify if user exists and is superuser
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.is_superuser:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive: wait for any client message (heartbeat ping etc.)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
