import os
import json
import google.generativeai as genai
from models import ChatTurn, CaseModel
from typing import List, Optional

def configure_genai(api_key: Optional[str] = None):
    key = api_key or os.getenv("GOOGLE_API_KEY")
    if not key:
        print("AVISO: GOOGLE_API_KEY não encontrada no .env")
    genai.configure(api_key=key)

async def get_patient_response(system_prompt: str, history: List[ChatTurn], user_message: str, api_key: Optional[str] = None) -> str:
    configure_genai(api_key)
    
    generation_config = {
        "temperature": 0.5,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 2048,
        "response_mime_type": "text/plain",
    }
    
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-lite",
        generation_config=generation_config,
        system_instruction=system_prompt,
    )
    
    chat_history = []
    for turn in history:
        chat_history.append({"role": turn.role, "parts": [turn.text]})
    
    chat = model.start_chat(history=chat_history)
    response = chat.send_message(user_message)
    return response.text

async def generate_feedback(case: CaseModel, history: List[ChatTurn], api_key: Optional[str] = None) -> str:
    configure_genai(api_key)
    model = genai.GenerativeModel(model_name="gemini-2.5-flash-lite")
    
    conversation_text = ""
    for turn in history:
        role = "Médico" if turn.role == "user" else "Paciente"
        conversation_text += f"{role}: {turn.text}\n"
    
    prompt = f"""
    Você é um avaliador do Revalida INEP.
    Analise a consulta médica abaixo entre um Médico (estudante) e um Paciente.
    
    CENÁRIO CLÍNICO:
    Título: {case.title}
    Descrição: {case.description}
    Checklist de Avaliação (Critérios):
    {case.checklist}
    
    CONVERSA:
    {conversation_text}
    
    Sua tarefa:
    1. Forneça um feedback detalhado sobre a performance do médico.
    2. Liste o que ele acertou e o que ele esqueceu com base no checklist.
    3. No final, atribua uma nota de 0 a 10 no formato exato: "Nota: X/10".
    
    Responda em Markdown.
    """
    
    response = model.generate_content(prompt)
    return response.text

async def generate_fase1_chat(user_message: str, history: List[ChatTurn], api_key: Optional[str] = None) -> dict:
    configure_genai(api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-lite",
        generation_config={"response_mime_type": "application/json"}
    )
    
    history_context = ""
    for turn in history:
        role = "Usuário" if turn.role == "user" else "Tutor"
        history_context += f"{role}: {turn.text}\n"
        
    prompt = f"""
    Você é o 'Preceptor IA', um tutor especialista em preparar médicos para o Revalida INEP.
    Sua função é tirar dúvidas de forma técnica, mas didática, focando no que o INEP costuma cobrar.
    
    CONTEXTO DA CONVERSA:
    {history_context}
    
    PERGUNTA ATUAL:
    {user_message}
    
    REQUISITOS DA RESPOSTA (JSON):
    Retorne um objeto JSON com dois campos:
    1. "reply": Sua resposta direta ao aluno (curta, direta e incentivadora).
    2. "document": Um artigo completo em Markdown para a 'Lousa Teórica' sobre o tema da pergunta. 
       - Use títulos, negritos e tabelas se necessário.
       - Inclua 'Pegadinhas do Revalida' se houver.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        
        # Limpeza caso o modelo retorne blocos de código markdown mesmo com JSON mode
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[len("json"):].strip()
            text = text.strip().split("```")[0].strip()
        
        # Tratamento para chaves duplicadas no final (comum em alguns modelos flash)
        text = text.strip()
        if text.count('{') == 1 and text.count('}') > 1:
            while text.endswith("}}"):
                text = text[:-1].strip()

        try:
            parsed = json.loads(text)
            return parsed
        except json.JSONDecodeError:
            # Fallback se o JSON falhar
            return {
                "reply": "Ocorreu um erro ao formatar a resposta técnica, mas estou aqui para ajudar. Pode repetir a dúvida?",
                "document": text
            }
            
    except Exception as e:
        print(f"Erro no gemini ao gerar fase 1: {e}")
        return {
            "reply": "Desculpe, tive um problema ao processar sua dúvida. Pode tentar novamente?",
            "document": ""
        }
