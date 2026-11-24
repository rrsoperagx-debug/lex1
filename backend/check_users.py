import asyncio
from app.db.session import AsyncSessionLocal
from app.db.models import User
from sqlalchemy.future import select

async def check_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User.email, User.role))
        users = result.all()
        print("USERS IN DATABASE:")
        for user in users:
            print(f"- {user.email} (Role: {user.role})")

if __name__ == "__main__":
    asyncio.run(check_users())
