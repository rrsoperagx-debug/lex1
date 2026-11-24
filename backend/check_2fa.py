import asyncio
from app.db.session import AsyncSessionLocal
from app.db.models import User
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User.email, User.is_2fa_enabled))
        for row in result.all():
            print(f"{row[0]}: 2FA={row[1]}")

if __name__ == "__main__":
    asyncio.run(check())
