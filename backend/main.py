from fastapi import FastAPI, HTTPException, Request, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
import database
from models import CaseModel, ChatSessionModel, ChatRequest, ChatTurn, Fase1Request, Fase1ChatRequest, UserRegistration, UserLogin
from bson import ObjectId
import gemini_service
import os
from pydantic import BaseModel
from auth_utils import get_current_user
from auth_handler import get_password_hash, verify_password, create_access_token
from datetime import datetime
from typing import Optional

app = FastAPI(title="Revalida AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await database.connect_to_mongo()
    if database.db is not None:
        cases_collection = database.db.cases
        cases_count = await cases_collection.count_documents({})
        if cases_count < 30:
            await cases_collection.delete_many({})
            from cases_data import mock_cases
            await cases_collection.insert_many(mock_cases)
            print("30 Casos recriados no MongoDB com categorias!")

@app.on_event("shutdown")
async def shutdown_db_client():
    await database.close_mongo_connection()

@app.get("/cases")
async def get_cases(current_user: dict = Depends(get_current_user)):
    cases_cursor = database.db.cases.find({})
    cases = []
    async for doc in cases_cursor:
        doc["_id"] = str(doc["_id"])
        cases.append(doc)
    return cases

class CreateSessionRequest(BaseModel):
    case_id: str

@app.post("/auth/register")
async def register(user_data: UserRegistration):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")
    
    existing_user = await database.db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "role": "student",
        "gemini_api_key": None,
        "created_at": datetime.utcnow()
    }
    
    await database.db.users.insert_one(user_dict)
    return {"message": "Usuário criado com sucesso"}

@app.post("/auth/login")
async def login(credentials: UserLogin):
    user = await database.db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "role": current_user.get("role", "student"),
        "gemini_api_key": current_user.get("gemini_api_key"),
        "created_at": current_user.get("created_at")
    }

@app.patch("/auth/profile/api-key")
async def update_api_key(api_key: str = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    await database.db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"gemini_api_key": api_key}}
    )
    return {"message": "Chave de API atualizada com sucesso"}

class UpdateProfileRequest(BaseModel):
    full_name: str
    email: str

@app.patch("/auth/profile")
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    # Se o e-mail mudou, verificar se o novo e-mail já está em uso
    if data.email != current_user["email"]:
        existing = await database.db.users.find_one({"email": data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Este e-mail já está sendo utilizado por outro usuário.")
    
    await database.db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {
            "full_name": data.full_name,
            "email": data.email
        }}
    )
    return {"message": "Perfil atualizado com sucesso"}

@app.post("/sessions")
async def create_session(req: CreateSessionRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    case = await database.db.cases.find_one({"_id": ObjectId(req.case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    session = {
        "user_id": user_id,
        "case_id": str(case["_id"]),
        "history": [],
        "feedback": None
    }
    result = await database.db.sessions.insert_one(session)
    return {"session_id": str(result.inserted_id)}

@app.get("/sessions/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = await database.db.sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])
    
    case = await database.db.cases.find_one({"_id": ObjectId(session["case_id"])})
    if case:
        case["_id"] = str(case["_id"])
        session["case_data"] = case
        
    return session

@app.post("/chat")
async def chat_interaction(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    api_key = current_user.get("gemini_api_key")
    if not api_key:
        raise HTTPException(status_code=403, detail="Você precisa configurar sua chave de API do Gemini no Perfil para usar o chat.")

    session = await database.db.sessions.find_one({"_id": ObjectId(request.session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    case = await database.db.cases.find_one({"_id": ObjectId(session["case_id"])})
    
    # Recriar lista pydantic do histórico
    history_dicts = session.get("history", [])
    history_turns = [ChatTurn(**t) for t in history_dicts]
    
    response_text = await gemini_service.get_patient_response(
        system_prompt=case["patient_system_prompt"],
        history=history_turns,
        user_message=request.message.text,
        api_key=api_key
    )
    
    # Atualizar doc no Mongo
    user_turn = {"role": "user", "text": request.message.text}
    model_turn = {"role": "model", "text": response_text}
    
    await database.db.sessions.update_one(
        {"_id": ObjectId(request.session_id)},
        {"$push": {"history": {"$each": [user_turn, model_turn]}}}
    )
    
    return {"reply": response_text}

@app.post("/feedback/{session_id}")
async def get_feedback(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    api_key = current_user.get("gemini_api_key")
    if not api_key:
        raise HTTPException(status_code=403, detail="Você precisa configurar sua chave de API do Gemini no Perfil para receber feedback.")

    session = await database.db.sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    case = await database.db.cases.find_one({"_id": ObjectId(session["case_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="O cenário clínico desta sessão foi apagado no servidor.")
    case_model = CaseModel(**{**case, "_id": str(case["_id"])})
    
    history_dicts = session.get("history", [])
    history_turns = [ChatTurn(**t) for t in history_dicts]
    
    if len(history_turns) == 0:
        return {"feedback": "Nenhuma interação ocorreu para ser avaliada."}
        
    try:
        feedback_text = await gemini_service.generate_feedback(case_model, history_turns, api_key=api_key)
    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower():
            raise HTTPException(status_code=429, detail="A SUA chave de API do Google atingiu o limite gratuito. Por favor, aguarde cerca de 1 minuto.")
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno na geração do feedback. Tente novamente.")
    
    await database.db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"feedback": feedback_text}}
    )
    
    return {"feedback": feedback_text}


@app.post("/fase1/sessions")
async def create_fase1_session(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = {
        "user_id": user_id,
        "history": [],
        "document": ""
    }
    result = await database.db.fase1_sessions.insert_one(session)
    return {"session_id": str(result.inserted_id)}

@app.get("/fase1/sessions/{session_id}")
async def get_fase1_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = await database.db.fase1_sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    session["_id"] = str(session["_id"])
    return session

@app.post("/fase1/chat")
async def fase1_chat(request: Fase1ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    api_key = current_user.get("gemini_api_key")
    if not api_key:
        raise HTTPException(status_code=403, detail="Você precisa configurar sua chave de API do Gemini no Perfil para usar o tutor.")

    session = await database.db.fase1_sessions.find_one({"_id": ObjectId(request.session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
    user_text = request.message.text
    history_turns = session.get("history", [])
    
    # Store user turn
    history_turns.append({"role": "user", "text": user_text})
    
    try:
        reply_data = await gemini_service.generate_fase1_chat(user_text, history_turns, api_key=api_key)
    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower() or "limite" in str(e).lower():
            raise HTTPException(status_code=429, detail="O limite da sua chave de API foi atingido. Aguarde 1 minuto.")
        raise HTTPException(status_code=500, detail=str(e))
        
    ai_reply = reply_data.get("reply", "")
    new_doc = reply_data.get("document", "")
    
    # Store bot turn
    history_turns.append({"role": "model", "text": ai_reply})
    
    update_fields = {"history": history_turns}
    if new_doc and new_doc.strip() != "":
        update_fields["document"] = new_doc
        
    await database.db.fase1_sessions.update_one(
        {"_id": ObjectId(request.session_id)},
        {"$set": update_fields}
    )
    
    return {
        "reply": ai_reply,
        "document": new_doc if new_doc and new_doc.strip() != "" else session.get("document", "")
    }


@app.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    sessions_cursor = database.db.sessions.find({
        "user_id": user_id,
        "history.0": {"$exists": True}
    })
    
    out = []
    async for session in sessions_cursor:
        case = await database.db.cases.find_one({"_id": ObjectId(session["case_id"])})
        case_title = case["title"] if case else "Caso Desconhecido"
        case_category = case["category"] if case else "Geral"
        
        out.append({
            "session_id": str(session["_id"]),
            "case_id": session["case_id"],
            "case_title": case_title,
            "case_category": case_category,
            "turns_count": len(session.get("history", [])),
            "has_feedback": session.get("feedback") is not None
        })
        
    # Reverse so the newest ones are first
    out.reverse()
    return {"history": out}

@app.get("/fase1/history")
async def get_fase1_history(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    sessions_cursor = database.db.fase1_sessions.find({
        "user_id": user_id,
        "history.0": {"$exists": True}
    })
    
    out = []
    async for session in sessions_cursor:
        doc = session.get("document", "")
        title = "Tópicos Variados"
        
        # Procura o primeiro cabeçalho # para ser o título
        lines = doc.split("\\n")
        for line in lines:
            line = line.strip()
            if line.startswith("# "):
                title = line.replace("# ", "").strip()
                break
                
        out.append({
            "session_id": str(session["_id"]),
            "title": title,
            "turns_count": len(session.get("history", []))
        })
        
    out.reverse()
    return {"history": out}
