import os
import certifi
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv('MONGODB_URI'), tlsCAFile=certifi.where())
db = client[os.getenv('DB_NAME', 'revalida-fase2')]

q = db.questions.find_one()
print(f"Sample Question ID: {q['_id']}")
print(f"Sample Question ID Type: {type(q['_id'])}")

session_id = "69eaa0d01b11f1448b800fad"
s = db.simulado_sessions.find_one({'_id': ObjectId(session_id)})
q_ids = s.get('question_ids', [])
print(f"Stored Q ID in session: {q_ids[0]}")
print(f"Type of stored Q ID: {type(q_ids[0])}")
