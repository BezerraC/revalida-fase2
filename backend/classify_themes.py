import os
import json
import re
import asyncio
import google.generativeai as genai
from tqdm import tqdm
from dotenv import load_dotenv

# Load API Key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

CATEGORIES = [
    "Clínica Médica",
    "Cirurgia Geral",
    "Ginecologia e Obstetrícia",
    "Pediatria",
    "Saúde Coletiva"
]

SYSTEM_PROMPT = f"""
Você é um médico especialista em provas do Revalida (INEP/Brasil).
Sua tarefa é classificar questões médicas em uma das 5 grandes áreas:
{", ".join(CATEGORIES)}.

Instruções:
1. Receberei uma lista de questões (texto e alternativas).
2. Para cada questão, identifique a área correspondente.
3. Responda APENAS em formato JSON, com uma lista de objetos contendo "number" e "theme".
4. O campo "theme" deve ser EXATAMENTE um dos seguintes: {", ".join(CATEGORIES)}.
5. Se uma questão for impossível de classificar (muito curta ou sem contexto), use "Saúde Coletiva" como padrão para legislação ou "Clínica Médica" para medicina geral.

Exemplo de resposta:
[
  {{"number": 1, "theme": "Clínica Médica"}},
  {{"number": 2, "theme": "Cirurgia Geral"}}
]
"""

async def classify_batch(batch, model_name="gemini-flash-latest"):
    model = genai.GenerativeModel(model_name)
    
    questions_text = ""
    for q in batch:
        questions_text += f"\n--- Questão {q['number']} ---\n{q['text']}\n"
        if "alternatives" in q and q["alternatives"]:
            for letter, alt in q["alternatives"].items():
                questions_text += f"{letter}) {alt}\n"
    
    prompt = f"Classifique as seguintes questões:\n{questions_text}"
    
    for attempt in range(3):
        try:
            response = await model.generate_content_async(
                [SYSTEM_PROMPT, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            if "429" in str(e):
                wait_time = 60 * (attempt + 1)
                print(f"  Quota atingida. Aguardando {wait_time}s...", flush=True)
                await asyncio.sleep(wait_time)
            elif "404" in str(e):
                # Se flash-latest falhar, tenta gemini-pro-latest
                if model_name == "gemini-flash-latest":
                    print(f"  Modelo {model_name} não encontrado, tentando gemini-pro-latest...", flush=True)
                    return await classify_batch(batch, "gemini-pro-latest")
                else:
                    print(f"  Erro 404 persistente para {model_name}: {e}", flush=True)
                    return []
            else:
                print(f"  Erro no Gemini (tentativa {attempt+1}): {e}", flush=True)
                if attempt == 2: return []
                await asyncio.sleep(5)
    return []



async def process_file(file_path):
    print(f"Processando: {os.path.basename(file_path)}", flush=True)
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    batch_size = 10 
    updated_themes = {}
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        print(f"  Classificando lote {i//batch_size + 1}/{(len(data)-1)//batch_size + 1}...", flush=True)
        results = await classify_batch(batch)
        for res in results:
            updated_themes[res["number"]] = res["theme"]


    count = 0
    for q in data:
        num = q["number"]
        if num in updated_themes:
            q["theme"] = updated_themes[num]
            count += 1
        else:
            if not q.get("theme"):
                q["theme"] = "Clínica Médica"

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Finalizado: {os.path.basename(file_path)} ({count} questões atualizadas)", flush=True)


async def main():
    jsons_dir = "./exams/jsons"
    files = [f for f in os.listdir(jsons_dir) if f.endswith(".json")]
    
    # Prioridades do usuário
    priority = ["2024_2.json", "2017.json"]
    other_files = [f for f in files if f not in priority]
    other_files.sort(reverse=True)
    
    sorted_files = priority + other_files
    
    for filename in sorted_files:
        file_path = os.path.join(jsons_dir, filename)
        await process_file(file_path)


if __name__ == "__main__":
    asyncio.run(main())
