import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv() # Procura automaticamente por .env no diretório atual

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("ERRO CRÍTICO: MONGODB_URI não encontrada no arquivo .env. Verifique se o arquivo existe em backend/.env")

DB_NAME = os.getenv("DB_NAME", "revalida-fase2")

import certifi

async def seed_questions(file_path="./exams/jsons/2025_1.json"):
    if not os.path.exists(file_path):
        print(f"Erro: {file_path} não encontrado.")
        return

    client = AsyncIOMotorClient(
        MONGODB_URI, 
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True # Contorna erros de TLS Handshake em ambientes restritos
    )
    db = client[DB_NAME]
    
    with open(file_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    if not questions:
        print("Nenhuma questão encontrada no JSON.")
        return

    exam_id = questions[0].get("exam_id")
    if not exam_id:
        print("Erro: 'exam_id' não encontrado nas questões.")
        return

    print(f"--- Iniciando Migração Segura para {exam_id} ---")
    
    # 1. Deletar apenas as questões desta prova específica
    print(f"Limpando questões existentes para a prova: {exam_id}...")
    del_result = await db.questions.delete_many({"exam_id": exam_id})
    print(f"Removidas {del_result.deleted_count} questões antigas.")
    
    # 2. Inserir o novo conjunto perfeito
    print(f"Inserindo {len(questions)} questões da versão V17.5...")
    await db.questions.insert_many(questions)
    
    total_count = await db.questions.count_documents({})
    print(f"Sucesso! Banco de dados atualizado para {exam_id}.")
    print(f"Total de questões no banco (preservando outros anos): {total_count}")
    
    client.close()

if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "./exams/jsons/2025_1.json"
    asyncio.run(seed_questions(target))
