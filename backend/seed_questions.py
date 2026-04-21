import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi

load_dotenv() 

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("ERRO CRÍTICO: MONGODB_URI não encontrada no arquivo .env.")

DB_NAME = os.getenv("DB_NAME", "revalida-fase2")
JSONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exams", "jsons")

async def process_file(db, file_path):
    filename = os.path.basename(file_path)
    if not os.path.exists(file_path):
        print(f"Erro: {file_path} não encontrado.")
        return

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            questions = json.load(f)
    except Exception as e:
        print(f"Erro ao ler {filename}: {e}")
        return
    
    if not questions:
        print(f"Nenhuma questão encontrada em {filename}.")
        return

    exam_id = questions[0].get("exam_id")
    if not exam_id:
        # Tenta pegar do nome do arquivo se falhar
        exam_id = filename.replace(".json", "")
        for q in questions:
            q["exam_id"] = exam_id

    print(f"\n--- Migrando {exam_id} ({len(questions)} questões) ---")
    
    # 1. Limpeza segura (apenas deste exam_id)
    await db.questions.delete_many({"exam_id": exam_id})
    
    # 2. Inserção
    if questions:
        await db.questions.insert_many(questions)
        print(f"Sucesso: {exam_id} inserido.")

async def run_migration():
    if not os.path.exists(JSONS_DIR):
        print(f"Erro: Diretorio {JSONS_DIR} nao encontrado.")
        return

    client = AsyncIOMotorClient(
        MONGODB_URI, 
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True 
    )
    db = client[DB_NAME]
    
    # Lista todos os arquivos JSON e ordena para consistência
    files = sorted([f for f in os.listdir(JSONS_DIR) if f.endswith(".json")])
    
    print(f"Encontrados {len(files)} arquivos de exames para migração.")
    
    for filename in files:
        file_path = os.path.join(JSONS_DIR, filename)
        await process_file(db, file_path)
    
    total_count = await db.questions.count_documents({})
    print(f"\n==========================================")
    print(f"MIGRAÇÃO CONCLUÍDA!")
    print(f"Total de questões no banco de dados: {total_count}")
    print(f"==========================================\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(run_migration())
