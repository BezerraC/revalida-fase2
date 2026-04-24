import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from tqdm import tqdm
import sys

# 1. Configurações Iniciais
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY não encontrada no arquivo .env")

genai.configure(api_key=api_key)

# Configuração para resposta estruturada
generation_config = genai.GenerationConfig(
    temperature=0.3, # Um pouco mais de temperatura para textos explicativos mais fluidos
    response_mime_type="application/json"
)

# 2. System Prompt focado em Explicação Médica
system_instruction = """
Você é um professor médico especialista em pedagogia para o Revalida.
Sua tarefa é analisar uma questão médica e gerar explicações didáticas para cada alternativa.

REGRAS DE OURO:
1. "context": Resuma o raciocínio clínico da questão em 2 ou 3 frases.
2. "alternatives": Para cada letra (A, B, C, D), explique por que ela está correta ou incorreta. 
   - Comece sempre com "Correta." ou "Incorreta.".
   - Use justificativas baseadas em consensos médicos ou fisiopatologia.
3. "annulled_reason": Se o campo 'correct_answer' for "Anulada", explique o motivo técnico da anulação (ex: erro de enunciado, falta de alternativa correta, bibliografia divergente). Se não for anulada, retorne null.

SAÍDA ESPERADA (JSON):
{
  "context": "Descrição sucinta do caso...",
  "alternatives": {
    "A": "Incorreta. O motivo é...",
    "B": "Correta. Conforme o guideline...",
    "C": "Incorreta. Não se aplica pois...",
    "D": "Incorreta. Esse achado é típico de..."
  },
  "annulled_reason": null
}
"""

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash", 
    generation_config=generation_config,
    system_instruction=system_instruction
)

# 3. Caminhos de Pastas (Lendo da saída do script anterior)
INPUT_DIR = Path("./exams/jsons")
OUTPUT_DIR = Path("./exams/jsons_explained")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def processar_explicacoes(filtro_arquivo=None):
    if filtro_arquivo:
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
        print(f"Nenhum arquivo encontrado em {INPUT_DIR}. Certifique-se de rodar o classificador primeiro.")
        return

    for arquivo_path in arquivos_json:
        print(f"\n--- Gerando Explicações para: {arquivo_path.name} ---")
        
        with open(arquivo_path, 'r', encoding='utf-8') as f:
            questoes = json.load(f)
            
        # Filtra apenas o que não tem explicação ainda
        questoes_pendentes = [q for q in questoes if "explanation" not in q]
        
        if not questoes_pendentes:
            print(f"Arquivo {arquivo_path.name} já está totalmente explicado. Pulando.")
            continue

        for questao in tqdm(questoes_pendentes, desc="Processando Questões"):
            # Prepara o contexto para a IA
            gabarito = questao.get("correct_answer")
            alternativas_texto = json.dumps(questao.get("alternatives", {}), ensure_ascii=False)
            metadata = json.dumps(questao.get("metadata", {}), ensure_ascii=False)
            
            prompt_usuario = f"""
            GABARITO: {gabarito}
            METADADOS: {metadata}
            TEXTO DA QUESTÃO: {questao.get('text', '')}
            ALTERNATIVAS: {alternativas_texto}
            """
            
            sucesso = False
            tentativas = 0
            
            while not sucesso and tentativas < 3:
                try:
                    response = model.generate_content(prompt_usuario)
                    expl_json = json.loads(response.text)
                    
                    # Injeta a nova chave no objeto original
                    questao["explanation"] = expl_json
                    sucesso = True
                    time.sleep(1.5) # Delay para evitar Rate Limit
                    
                except Exception as e:
                    tentativas += 1
                    print(f"\nErro na questão {questao.get('number')} de {arquivo_path.name}: {e}")
                    time.sleep(5)
            
            if not sucesso:
                questao["explanation"] = {"error": "Não foi possível gerar a explicação automaticamente."}

        # Salva o resultado final na nova pasta
        output_path = OUTPUT_DIR / arquivo_path.name
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questoes, f, ensure_ascii=False, indent=2)
            
        print(f"Concluído e salvo em: {output_path}")

if __name__ == "__main__":
    filtro = sys.argv[1] if len(sys.argv) > 1 else None
    processar_explicacoes(filtro)