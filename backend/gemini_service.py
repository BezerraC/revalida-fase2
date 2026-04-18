import os
import google.generativeai as genai
from models import ChatTurn, CaseModel
from typing import List

def __init_gemini__():
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def get_patient_response(system_prompt: str, history: List[ChatTurn], user_message: str) -> str:
    __init_gemini__()
    
    generation_config = {
        "temperature": 0.5,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
    }
    
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
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
            return "*(Paciente ofegante - A API do Google atingiu o limite gratuito de mensagens por minuto. Por favor, espere 1 minuto e mande a mensagem novamente)*"
        return "Desculpe doutor, não entendi. Pode repetir?"

async def generate_feedback(case: CaseModel, history: List[ChatTurn]) -> str:
    __init_gemini__()
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
