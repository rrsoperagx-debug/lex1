import asyncio
from app.db.session import AsyncSessionLocal
from app.db.models import User
from sqlalchemy import select, update

async def force_disable():
    async with AsyncSessionLocal() as session:
        print("FORCING 2FA DISABLE...")
        await session.execute(update(User).values(is_2fa_enabled=False))
        await session.commit()
        
        result = await session.execute(select(User.email, User.is_2fa_enabled))
        for row in result.all():
            print(f"VERIFY: {row[0]}: 2FA={row[1]}")

if __name__ == "__main__":
    asyncio.run(force_disable())
