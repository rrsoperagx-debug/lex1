import uuid
import json
from io import BytesIO
from typing import Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from jose import jwt
from pydantic import ValidationError

from app.api import deps
from app.db.models import ChatMessage, User
from app.core.encryption import encryption_service
from app.schemas.chat_message import ChatMessageResponse, ChatMessageCreate
from app.core.config import settings

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
except ImportError:
    pass

router = APIRouter()

class ChatConnectionManager:
    def __init__(self):
        # Maps user_id -> List[WebSocket]
        self.active_connections: dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: uuid.UUID):
        if user_id in self.active_connections and websocket in self.active_connections[user_id]:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: uuid.UUID):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

manager = ChatConnectionManager()

async def get_ws_user(token: str, db: AsyncSession) -> User:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except (jwt.JWTError, ValidationError):
        return None
    
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    return user

@router.get("/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    other_user_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get chat history between current user and another user.
    """
    query = select(ChatMessage).where(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.recipient_id == current_user.id)
        )
    ).order_by(ChatMessage.timestamp.asc()).offset(skip).limit(limit)

    result = await db.execute(query)
    messages = result.scalars().all()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "content": encryption_service.decrypt(m.encrypted_content) or "[Błąd odszyfrowania]",
            "timestamp": m.timestamp
        }
        for m in messages
    ]

@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    WebSocket endpoint for real-time chat.
    Authentication via token in query param.
    """
    current_user = await get_ws_user(token, db)
    if not current_user:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, current_user.id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            recipient_id = uuid.UUID(message_data.get("recipient_id"))
            content = message_data.get("content")

            if content and recipient_id:
                # Save to DB
                new_msg = ChatMessage(
                    sender_id=current_user.id,
                    recipient_id=recipient_id,
                    encrypted_content=encryption_service.encrypt(content)
                )
                db.add(new_msg)
                await db.commit()
                await db.refresh(new_msg)

                msg_response = {
                    "id": str(new_msg.id),
                    "sender_id": str(new_msg.sender_id),
                    "recipient_id": str(new_msg.recipient_id),
                    "content": content,
                    "timestamp": new_msg.timestamp.isoformat()
                }

                # Send to recipient if online
                await manager.send_personal_message(msg_response, recipient_id)
                # Send back to sender
                await manager.send_personal_message(msg_response, current_user.id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, current_user.id)
    except Exception as e:
        print(f"WS error: {e}")
        manager.disconnect(websocket, current_user.id)

@router.get("/export")
async def export_chat(
    other_user_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Export chat history offline to PDF.
    """
    query = select(ChatMessage).where(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.recipient_id == current_user.id)
        )
    ).order_by(ChatMessage.timestamp.asc())

    result = await db.execute(query)
    messages = result.scalars().all()

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Historia Czatu - LexPortal")
    y -= 30
    c.setFont("Helvetica", 10)

    for m in messages:
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)
        
        timestamp_str = m.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        sender = "Ty" if m.sender_id == current_user.id else "Inny"
        try:
            content = encryption_service.decrypt(m.encrypted_content) or "[Błąd odszyfrowania]"
        except:
            content = "[Błąd odszyfrowania]"
            
        text = f"[{timestamp_str}] {sender}: {content}"
        c.drawString(50, y, text)
        y -= 20

    c.showPage()
    c.save()

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=chat_{other_user_id}.pdf"}
    )
