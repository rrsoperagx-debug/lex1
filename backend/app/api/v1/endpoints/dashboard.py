from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db, AsyncSessionLocal
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardData
from app.api.deps import get_current_active_superuser
from app.core.websockets import manager
import asyncio
from fastapi.encoders import jsonable_encoder

router = APIRouter()

@router.get("/stats", response_model=DashboardData)
async def get_dashboard_stats(
    range_type: str = Query("month", regex="^(hour|day|week|month|year)$"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_superuser)
):
    """
    Get aggregated dashboard statistics for the BI Dashboard.
    Requires Superuser (Admin) privileges.
    """
    return await DashboardService.get_dashboard_stats(db, range_type=range_type)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Broadcast updates every 10 seconds
            # Note: In a real production app, this should be event-driven or optimized
            # to avoid querying DB for every connection.
            # Here we just demo the real-time capability.
            
            # We need a new session for each cycle or reuse one carefully
            async with AsyncSessionLocal() as session:
                stats = await DashboardService.get_dashboard_stats(session, range_type="month")
                data = jsonable_encoder(stats)
                await websocket.send_json(data)
            
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket)
