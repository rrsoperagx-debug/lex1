import asyncio
from app.db.session import SessionLocal
from app.db.models import User
from sqlalchemy import select

async def check_users():
    async with SessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Active: {u.is_active}")

if __name__ == "__main__":
    asyncio.run(check_users())
