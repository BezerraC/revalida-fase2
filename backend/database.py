import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "revalida_db")
client = None
db = None

async def connect_to_mongo():
    global client, db
    if MONGO_URI:
        client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
        db = client[DB_NAME]
        print(f"Connected to MongoDB database: {DB_NAME}!")
    else:
        print("MONGODB_URI is missing in .env!")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")
