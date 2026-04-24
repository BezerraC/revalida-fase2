import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from tqdm import tqdm
import sys

# Carrega variáveis de ambiente (API Key)
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY não encontrada no arquivo .env")

genai.configure(api_key=api_key)

# Configura o modelo. O 1.5-flash é excelente, rápido e barato para tarefas de classificação JSON.
# Forçamos a saída para ser estritamente JSON.
generation_config = genai.GenerationConfig(
    temperature=0.0,
    response_mime_type="application/json"
)

# Inicializa o modelo com o System Prompt
system_instruction = """
Você é um médico especialista e arquiteto de dados educacionais focado no exame Revalida do Brasil.
Sua tarefa é analisar uma questão de prova médica e classificá-la rigorosamente dentro de uma taxonomia predefinida, retornando APENAS um objeto JSON válido.

REGRAS:
1. "area" deve ser: Clínica Médica, Cirurgia, Ginecologia e Obstetrícia, Pediatria, ou Medicina Preventiva.
2. "specialty" deve ser a subespecialidade médica principal (Ex: Cardiologia, Infectologia).
3. "topic" é a doença ou conceito central (Ex: Infarto Agudo do Miocárdio).
4. "focus" deve ser um array contendo um ou mais: ["Diagnóstico", "Tratamento", "Fisiopatologia", "Exames Complementares", "Epidemiologia", "Prevenção", "Ética Médica"].

SAÍDA ESPERADA:
{
  "area": "Clínica Médica",
  "specialty": "Hematologia",
  "topic": "Linfomas",
  "focus": ["Diagnóstico"]
}
"""

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=generation_config,
    system_instruction=system_instruction
)

# Diretórios
INPUT_DIR = Path("./exams/jsons")
OUTPUT_DIR = Path("./exams/jsons_classified")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def processar_arquivos(filtro_arquivo=None):
    if filtro_arquivo:
        # Se o usuário passou um nome sem .json, adicionamos
        if not filtro_arquivo.endswith(".json"):
            filtro_arquivo += ".json"
        
        caminho_especifico = INPUT_DIR / filtro_arquivo
        if caminho_especifico.exists():
            arquivos_json = [caminho_especifico]
        else:
            print(f"Arquivo não encontrado: {caminho_especifico}")
            return
    else:
        arquivos_json = list(INPUT_DIR.glob("*.json"))
    
    if not arquivos_json:
        print("Nenhum arquivo JSON encontrado no diretório de entrada.")
        return

    for arquivo_path in arquivos_json:
        print(f"\nProcessando prova: {arquivo_path.name}")
        
        with open(arquivo_path, 'r', encoding='utf-8') as f:
            questoes = json.load(f)
            
        # Pega apenas as questões que ainda não têm os metadados novos
        questoes_pendentes = [q for q in questoes if "metadata" not in q]
        
        if not questoes_pendentes:
            print(f"Todas as questões de {arquivo_path.name} já foram processadas. Pulando.")
            continue

        for questao in tqdm(questoes_pendentes, desc="Classificando Questões"):
            # Identifica a letra correta e pega o texto da alternativa
            letra_correta = questao.get("correct_answer")
            texto_alternativa_correta = questao.get("alternatives", {}).get(letra_correta, "")
            
            prompt_usuario = f"""
            Texto da questão: {questao.get('text', '')}
            Alternativa Correta: {texto_alternativa_correta}
            """
            
            sucesso = False
            tentativas = 0
            
            # Loop de retry em caso de falha de rede ou rate limit
            while not sucesso and tentativas < 3:
                try:
                    response = model.generate_content(prompt_usuario)
                    
                    # Converte a string JSON retornada pelo Gemini para um dicionário Python
                    metadados = json.loads(response.text)
                    
                    # Atualiza o objeto da questão
                    questao["metadata"] = metadados
                    sucesso = True
                    
                    # Pequena pausa para evitar estourar o limite de requisições por minuto (RPM)
                    time.sleep(2) 
                    
                except Exception as e:
                    tentativas += 1
                    print(f"\nErro na questão {questao.get('number')} (Tentativa {tentativas}/3): {e}")
                    time.sleep(5) # Espera mais tempo antes de tentar de novo
            
            # Se falhou após 3 tentativas, cria um objeto vazio ou de erro para revisar depois
            if not sucesso:
                questao["metadata"] = {"error": "Falha ao classificar na API"}

        # Salva o arquivo atualizado na nova pasta
        output_path = OUTPUT_DIR / arquivo_path.name
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questoes, f, ensure_ascii=False, indent=2)
            
        print(f"Salvo: {output_path.name}")

if __name__ == "__main__":
    # Pega o argumento da linha de comando se existir
    # Exemplo: py classificador.py 2025_2
    filtro = sys.argv[1] if len(sys.argv) > 1 else None
    processar_arquivos(filtro)
    print("\nProcessamento concluído!")