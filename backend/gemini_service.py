import os
import json
import google.generativeai as genai
from models import ChatTurn, CaseModel
from typing import List, Optional

def configure_genai(api_key: str):
    genai.configure(api_key=api_key)

async def get_patient_response(system_prompt: str, history: List[ChatTurn], user_message: str, api_key: str) -> str:
    configure_genai(api_key)
    
    generation_config = {
        "temperature": 0.5,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
    }
    
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash", # Corrigido para a versão estável atual ou preferida
        generation_config=generation_config,
        system_instruction=system_prompt,
    )
    
    gemini_history = []
    for turn in history:
        gemini_history.append({"role": turn.role, "parts": [{"text": turn.text}]})
        
    try:
        chat = model.start_chat(history=gemini_history)
        response = await chat.send_message_async({"role": "user", "parts": [{"text": user_message}]})
        return response.text
    except Exception as e:
        print(f"Erro no gemini: {e}")
        if "429" in str(e) or "quota" in str(e).lower():
            return "*(Paciente ofegante - O limite da SUA chave de API do Google foi atingido. Por favor, espere um momento)*"
        return f"*(Erro na API: {str(e)})*"

async def generate_feedback(case: CaseModel, history: List[ChatTurn], api_key: str) -> str:
    configure_genai(api_key)
    model = genai.GenerativeModel(model_name="gemini-2.5-flash")
    
    conversation_text = ""
    for turn in history:
        role_str = "Aluno (Médico)" if turn.role == "user" else "Paciente (IA)"
        conversation_text += f"{role_str}: {turn.text}\n"
        
    checklist_text = "\n".join([f"- {item}" for item in case.checklist])
    
    prompt = f"""
    Você é um avaliador do teste do Revalida INEP (prova prática de habilidades clínicas).
    Abaixo está a transcrição da simulação de uma anamnese sobre o caso '{case.title}'.
    
    Checklist de Avaliação Esperada:
    {checklist_text}
    
    Transcrição da Consulta:
    {conversation_text}
    
    Avalie o desempenho do aluno detalhadamente. 
    1. Pontue quais itens do checklist ele cumpriu e quais ele falhou.
    2. Liste feedback de habilidades de comunicação (empatia, clareza, etc).
    3. Dê uma nota geral de 0 a 10.
    Retorne a resposta formatada em Markdown, sendo construtivo.
    """
    
    try:
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        print(f"Erro no gemini ao gerar feedback: {e}")
        raise e

async def generate_fase1_chat(user_message: str, history: List[ChatTurn], api_key: str) -> dict:
    configure_genai(api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={"response_mime_type": "application/json"}
    )
    
    prompt = """Você é um Médico Preceptor (Tutor) especialista no Revalida INEP (Brasil).
Sua função é conversar com o aluno e ajudá-lo a estudar (Fase 1 teórica). O aluno pode perguntar sobre doenças, sintomas ou fazer simulações teóricas.

Responda OBRIGATORIAMENTE em formato JSON válido, contendo exatamente duas chaves:
1. "reply": A sua resposta de conversação (natural, clara e direta para ser falada em áudio). Se estiver cumprimentando, dê as boas vindas.
2. "document": Um artigo estruturado em Markdown sobre a principal doença da conversa. Siga sempre o formato prático INEP:
   # [Nome da Doença]
   ## 1. Definição e Epidemiologia
   ## 2. Quadro Clínico (cite 'pegadinhas' clássicas)
   ## 3. Diagnóstico (compare UBS/UPA vs Padrão Ouro)
   ## 4. Tratamento e Conduta
   Se não for uma doença específica ou não se aplicar, deixe o campo "document" vazio (""). SEMPRE preencha esse campo com o texto markdown se houver uma doença ou tema sendo discutido, em vez de deixar pro usuário pedir de novo.

Aqui está o histórico recente da conversa:
"""
    for turn in history[-4:]:
        prompt += f"\n[{turn.get('role', 'user')}] {turn.get('text', '')}"
        
    prompt += f"\n\n[user] {user_message}"

    try:
        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print(f"Erro no gemini ao gerar fase 1: {e}")
        if "429" in str(e) or "quota" in str(e).lower():
            raise Exception("Limite de requisições da SUA chave atingido. Aguarde um momento.")
        raise Exception(f"Erro na API do Gemini: {str(e)}")
