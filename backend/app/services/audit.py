from __future__ import annotations

from typing import Optional
from datetime import datetime
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import WebSocket

from app.db.models import AuditLog

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()


async def create_audit_log(
    db: AsyncSession,
    action: str,
    actor_id: Optional[uuid.UUID] = None,
    resource_id: Optional[uuid.UUID] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None,
    status: str = "success"
) -> AuditLog:
    """
    Create a new audit log entry.
    
    Args:
        db: Database session
        action: Action performed (e.g., "user_login", "case_created")
        actor_id: ID of user who performed the action
        resource_id: ID of affected resource (stored in details)
        ip_address: IP address of the client
        details: Additional structured detail data
        status: Status of the action
    """
    final_details = details or {}
    if resource_id:
        final_details["resource_id"] = str(resource_id)

    audit_log = AuditLog(
        actor_id=actor_id,
        action=action,
        details=final_details if final_details else None,
        ip_address=ip_address,
        status=status,
        timestamp=datetime.utcnow(),
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(audit_log)
    
    # Broadcast to all connected clients
    await manager.broadcast({
        "id": str(audit_log.id),
        "action": audit_log.action,
        "status": audit_log.status,
        "ip_address": audit_log.ip_address,
        "timestamp": audit_log.timestamp.isoformat(),
        "details": audit_log.details
    })
    
    return audit_log
