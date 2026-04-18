import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = None
db = None

async def connect_to_mongo():
    global client, db
    if MONGO_URI:
        client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
        db = client["revalida_fase2"]
        print("Connected to MongoDB!")
    else:
        print("MONGO_URI is missing!")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")
