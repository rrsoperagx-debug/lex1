import asyncio
import os
import sys

# Path setup
sys.path.append("/app")

async def check_users():
    from app.db.session import AsyncSessionLocal
    from app.db.models import User
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        if not users:
            print("No users found in database.")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Active: {u.is_active}")

if __name__ == "__main__":
    asyncio.run(check_users())
