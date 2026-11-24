from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.init_db import init_db

router = APIRouter()

@router.post("/run")
async def seed_data(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Seed database with initial data using the centralized init_db logic.
    """
    await init_db(db)
    return {"message": "Database seed process completed"}

