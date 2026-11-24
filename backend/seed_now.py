import asyncio
import os
import sys

# Add the current directory to sys.path to allow importing from 'app'
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.db.init_db import init_db

async def main():
    print("Starting manual seeding...")
    async with AsyncSessionLocal() as session:
        await init_db(session)
        print("Manual seeding complete.")

if __name__ == "__main__":
    asyncio.run(main())
