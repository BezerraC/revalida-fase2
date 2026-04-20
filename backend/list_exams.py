import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def check_exams():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db = client[os.getenv("DB_NAME", "revalida-fase2")]
    exams = await db.questions.distinct("exam_id")
    print(f"Exams in DB: {exams}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_exams())
