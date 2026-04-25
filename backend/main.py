from fastapi import FastAPI, HTTPException, Request, Depends, Body, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
import database
from models import CaseModel, ChatSessionModel, ChatRequest, ChatTurn, Fase1Request, Fase1ChatRequest, UserRegistration, UserLogin
from bson import ObjectId
import gemini_service
import os
from pydantic import BaseModel, Field
from auth_utils import get_current_user, get_current_admin, oauth2_scheme
from auth_handler import get_password_hash, verify_password, create_access_token
from datetime import datetime, timezone, timedelta
from typing import Optional

app = FastAPI(
    title="Med Master API",
    description="""
    Med Master: Plataforma de Elite para o Revalida
    
    Esta API fornece todos os recursos necessários para a plataforma Med Master, incluindo:
    
    Autenticação: Gestão de usuários e perfis.
    Simulados: Configuração e execução de simulados da Fase 1.
    Histórico: Acompanhamento de progresso e resultados.
    Inteligência Artificial: Geração de explicações e chat clínico.
    """,
    version="1.0.0",
    contact={
        "name": "Suporte Med Master",
        "email": "cbezerraneto@gmail.com",
    },
    openapi_tags=[
        {"name": "Auth", "description": "Gerenciamento de usuários e autenticação"},
        {"name": "Simulados", "description": "Criação, execução e histórico de simulados"},
        {"name": "Casos Clínicos", "description": "Gestão de casos e interações"},
        {"name": "Metadata", "description": "Endpoints auxiliares para filtros e temas"}
    ],
    dependencies=[Depends(oauth2_scheme)]
)

@app.post("/auth/docs-login", tags=["Auth"], include_in_schema=True)
async def login_for_docs(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await database.db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir imagens dos exames
app.mount("/exams/images", StaticFiles(directory="exams/images"), name="exams_images")

# Servir imagens de perfil
if not os.path.exists("uploads/profiles"):
    os.makedirs("uploads/profiles", exist_ok=True)
app.mount("/uploads/profiles", StaticFiles(directory="uploads/profiles"), name="profile_images")

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

@app.get("/cases", tags=["Casos Clínicos"])
async def get_cases(current_user: dict = Depends(get_current_user)):
    cases_cursor = database.db.cases.find({})
    cases = []
    async for doc in cases_cursor:
        doc["_id"] = str(doc["_id"])
        cases.append(doc)
    return cases

class CreateSessionRequest(BaseModel):
    case_id: str

class QuestionReport(BaseModel):
    reason: str
    description: Optional[str] = None
    question_id: str
    user_email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending" # pending, resolved, dismissed

@app.post("/auth/register", tags=["Auth"])
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
        "created_at": datetime.now(timezone.utc)
    }
    
    await database.db.users.insert_one(user_dict)
    return {"message": "Usuário criado com sucesso"}

@app.post("/auth/login", tags=["Auth"])
async def login(credentials: UserLogin):
    user = await database.db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", tags=["Auth"])
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "role": current_user.get("role", "student"),
        "gemini_api_key": current_user.get("gemini_api_key"),
        "profile_image": current_user.get("profile_image"),
        "total_score": current_user.get("total_score", 0),
        "level": current_user.get("level", 1),
        "created_at": current_user.get("created_at")
    }

@app.patch("/auth/profile/api-key", tags=["Auth"])
async def update_api_key(api_key: str = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    await database.db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"gemini_api_key": api_key}}
    )
    return {"message": "Chave de API atualizada com sucesso"}

class UpdateProfileRequest(BaseModel):
    full_name: str
    email: str

@app.patch("/auth/profile", tags=["Auth"])
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

@app.post("/auth/profile/image", tags=["Auth"])
async def upload_profile_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # Validar extensão
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Apenas imagens JPG, PNG ou WEBP são permitidas.")
    
    # Criar nome único
    user_id = str(current_user["_id"])
    filename = f"{user_id}.{ext}"
    file_path = f"uploads/profiles/{filename}"
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Gerar URL relativa (ou absoluta dependendo da preferência)
    # Aqui usaremos a relativa que o StaticFiles serve
    image_url = f"/uploads/profiles/{filename}"
    
    await database.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile_image": image_url}}
    )
    
    return {"image_url": image_url, "message": "Foto de perfil atualizada!"}

@app.post("/sessions", tags=["Casos Clínicos"])
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

@app.get("/sessions/{session_id}", tags=["Casos Clínicos"])
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(session_id)}
    
    # Se não for admin, só pode ver a própria sessão
    if current_user.get("role") != "admin":
        query["user_id"] = user_id
        
    session = await database.db.sessions.find_one(query)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])
    
    case = await database.db.cases.find_one({"_id": ObjectId(session["case_id"])})
    if case:
        case["_id"] = str(case["_id"])
        session["case_data"] = case
        
    return session

@app.delete("/sessions/{session_id}", tags=["Casos Clínicos"])
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    result = await database.db.sessions.delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sessão não encontrada ou não pertence ao usuário")
    return {"message": "Sessão removida com sucesso"}

@app.get("/admin/sessions", tags=["Casos Clínicos"])
async def get_all_sessions(admin: dict = Depends(get_current_admin)):
    sessions_cursor = database.db.sessions.find({})
    sessions = []
    async for sess in sessions_cursor:
        sess["_id"] = str(sess["_id"])
        
        # Buscar nome do usuário
        user = await database.db.users.find_one({"_id": ObjectId(sess["user_id"])})
        sess["user_name"] = user["full_name"] if user else "Usuário Removido"
        sess["user_email"] = user["email"] if user else "N/A"
        
        # Buscar título do caso
        case = await database.db.cases.find_one({"_id": ObjectId(sess["case_id"])})
        sess["case_title"] = case["title"] if case else "Cenário Removido"
        
        # Adicionar contagem de turnos
        sess["turns_count"] = len(sess.get("history", []))
        
        sessions.append(sess)
        
    sessions.reverse() # Mais recentes primeiro
    return sessions

@app.post("/chat", tags=["Casos Clínicos"])
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

@app.post("/feedback/{session_id}", tags=["Casos Clínicos"])
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


@app.post("/fase1/sessions", tags=["Simulados"])
async def create_fase1_session(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = {
        "user_id": user_id,
        "history": [],
        "document": ""
    }
    result = await database.db.fase1_sessions.insert_one(session)
    return {"session_id": str(result.inserted_id)}

@app.get("/fase1/sessions/{session_id}", tags=["Simulados"])
async def get_fase1_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = await database.db.fase1_sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    session["_id"] = str(session["_id"])
    return session

@app.delete("/fase1/sessions/{session_id}", tags=["Simulados"])
async def delete_fase1_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    result = await database.db.fase1_sessions.delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sessão não encontrada ou não pertence ao usuário")
    return {"message": "Sessão removida com sucesso"}

@app.post("/fase1/chat", tags=["Simulados"])
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


@app.get("/history", tags=["Simulados"])
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

@app.get("/fase1/history", tags=["Simulados"])
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

# ----------------------------------------------------------------
# ADMIN ENDPOINTS
# ----------------------------------------------------------------

@app.get("/admin/stats", tags=["Auth"])
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    users_count = await database.db.users.count_documents({})
    cases_count = await database.db.cases.count_documents({})
    sessions_fase2 = await database.db.sessions.count_documents({})
    sessions_fase1 = await database.db.fase1_sessions.count_documents({})
    
    return {
        "total_users": users_count,
        "total_cases": cases_count,
        "total_sessions": sessions_fase2 + sessions_fase1,
        "fase2_sessions": sessions_fase2,
        "fase1_sessions": sessions_fase1
    }

@app.get("/admin/users", tags=["Auth"])
async def get_admin_users(admin: dict = Depends(get_current_admin)):
    users_cursor = database.db.users.find({})
    users = []
    async for user in users_cursor:
        user["_id"] = str(user["_id"])
        # Nunca enviar o hash da senha
        if "hashed_password" in user:
            del user["hashed_password"]
        users.append(user)
    return users

@app.patch("/admin/users/{user_id}/role", tags=["Auth"])
async def update_user_role(user_id: str, role: str = Body(..., embed=True), admin: dict = Depends(get_current_admin)):
    if role not in ["admin", "student"]:
        raise HTTPException(status_code=400, detail="Role inválida")
        
    await database.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role}}
    )
    return {"message": f"Role do usuário atualizada para {role}"}

@app.post("/admin/cases", tags=["Casos Clínicos"])
async def create_case(case_data: CaseModel, admin: dict = Depends(get_current_admin)):
    case_dict = case_data.dict(by_alias=True)
    if "_id" in case_dict:
        del case_dict["_id"]
        
    result = await database.db.cases.insert_one(case_dict)
    return {"id": str(result.inserted_id), "message": "Caso criado com sucesso"}

@app.patch("/admin/cases/{case_id}", tags=["Casos Clínicos"])
async def update_case(case_id: str, case_data: CaseModel, admin: dict = Depends(get_current_admin)):
    update_data = case_data.dict(by_alias=True, exclude_unset=True)
    if "_id" in update_data:
        del update_data["_id"]
        
    await database.db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_data}
    )
    return {"message": "Caso atualizado com sucesso"}

@app.delete("/admin/cases/{case_id}", tags=["Casos Clínicos"])
async def delete_case(case_id: str, admin: dict = Depends(get_current_admin)):
    await database.db.cases.delete_one({"_id": ObjectId(case_id)})
    return {"message": "Caso removido com sucesso"}

# ----------------------------------------------------------------
# FASE 1: QUESTÕES E SIMULADOS
# ----------------------------------------------------------------

@app.get("/questions", tags=["Simulados"])
async def get_questions(
    exam_id: Optional[str] = None, 
    theme: Optional[str] = None,
    specialty: Optional[str] = None,
    topic: Optional[str] = None,
    focus: Optional[str] = None,
    session_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if session_id:
        session = await database.db.simulado_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": str(current_user["_id"])
        })
        if session and session.get("question_ids"):
            q_ids = [ObjectId(qid) for qid in session["question_ids"]]
            # Buscar na ordem específica
            questions_cursor = database.db.questions.find({"_id": {"$in": q_ids}})
            questions_map = {}
            async for q in questions_cursor:
                q["_id"] = str(q["_id"])
                questions_map[q["_id"]] = q
            
            # Reordenar
            ordered_questions = [questions_map[qid] for qid in session["question_ids"] if qid in questions_map]
            if ordered_questions:
                return ordered_questions
            # Se não encontrou nenhuma questão pelos IDs, cai para a busca genérica por filtros

    query = {}
    if exam_id and exam_id != "all": query["exam_id"] = exam_id
    if theme and theme != "all": query["theme"] = theme
    if specialty and specialty != "all": query["metadata.specialty"] = specialty
    if topic and topic != "all": query["metadata.topic"] = topic
    if focus and focus != "all": query["metadata.focus"] = {"$in": [focus]}
        
    questions_cursor = database.db.questions.find(query)
    questions = []
    async for q in questions_cursor:
        q["_id"] = str(q["_id"])
        questions.append(q)
    return questions

@app.get("/questions/{question_id}", tags=["Simulados"])
async def get_question(question_id: str, current_user: dict = Depends(get_current_user)):
    q = await database.db.questions.find_one({"_id": ObjectId(question_id)})
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada")
    q["_id"] = str(q["_id"])
    return q

@app.post("/questions/{question_id}/report", tags=["Metadata"])
async def report_question(
    question_id: str, 
    report: QuestionReport, 
    current_user: dict = Depends(get_current_user)
):
    report_dict = report.dict()
    report_dict["user_email"] = current_user["email"]
    report_dict["question_id"] = question_id
    report_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await database.db.question_reports.insert_one(report_dict)
    return {"message": "Reporte enviado com sucesso", "report_id": str(result.inserted_id)}

@app.get("/admin/reports", tags=["Metadata"])
async def get_all_reports(current_user: dict = Depends(get_current_admin)):
    reports_cursor = database.db.question_reports.find().sort("created_at", -1)
    reports = []
    async for doc in reports_cursor:
        doc["_id"] = str(doc["_id"])
        reports.append(doc)
    return reports

@app.patch("/admin/reports/{report_id}", tags=["Metadata"])
async def update_report_status(
    report_id: str, 
    status: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_admin)
):
    result = await database.db.question_reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reporte não encontrado")
    return {"message": f"Reporte marcado como {status}"}

@app.get("/exams", tags=["Metadata"])
async def get_unique_exams(current_user: dict = Depends(get_current_user)):
    # Retorna uma lista única de exam_ids presentes no banco
    exams_list = await database.db.questions.distinct("exam_id")
    # Ordena de forma decrescente para os mais novos aparecerem primeiro
    exams_list.sort(reverse=True)
    return exams_list

@app.get("/themes", tags=["Metadata"])
async def get_unique_themes(current_user: dict = Depends(get_current_user)):
    # Retorna uma lista única de temas presentes no banco
    themes_list = await database.db.questions.distinct("theme")
    themes_list = [t for t in themes_list if t and t.strip()]
    themes_list.sort()
    return themes_list

@app.get("/specialties", tags=["Metadata"])
async def get_unique_specialties(current_user: dict = Depends(get_current_user)):
    # Retorna uma lista única de especialidades presentes no metadata
    specialties_list = await database.db.questions.distinct("metadata.specialty")
    specialties_list = [s for s in specialties_list if s and s.strip()]
    specialties_list.sort()
    return specialties_list

@app.get("/topics", tags=["Metadata"])
async def get_unique_topics(current_user: dict = Depends(get_current_user)):
    # Retorna uma lista única de tópicos presentes no metadata
    topics_list = await database.db.questions.distinct("metadata.topic")
    topics_list = [t for t in topics_list if t and t.strip()]
    topics_list.sort()
    return topics_list

@app.get("/focus", tags=["Metadata"])
async def get_unique_focus(current_user: dict = Depends(get_current_user)):
    # Retorna uma lista única de focus presentes no metadata
    focus_list = await database.db.questions.distinct("metadata.focus")
    focus_list = [f for f in focus_list if f and f.strip()]
    focus_list.sort()
    return focus_list

@app.post("/simulado/sessions", tags=["Simulados"])
async def create_simulado_session(
    data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    exam_id = data.get("exam_id")
    theme = data.get("theme")
    specialty = data.get("specialty")
    topic = data.get("topic")
    focus = data.get("focus")
    
    # Buscar questões para fixar a ordem
    query = {}
    
    def apply_filter(field, value):
        if value:
            if isinstance(value, list):
                if "all" in value: return # Ignora se "all" estiver na lista
                query[field] = {"$in": value}
            elif value != "all":
                query[field] = value

    apply_filter("exam_id", exam_id)
    apply_filter("theme", theme)
    apply_filter("metadata.specialty", specialty)
    apply_filter("metadata.topic", topic)
    
    # Focus é especial pois já é uma lista no banco
    if focus:
        if isinstance(focus, list):
            if "all" not in focus:
                query["metadata.focus"] = {"$in": focus}
        elif focus != "all":
            query["metadata.focus"] = {"$in": [focus]}
    
    questions_cursor = database.db.questions.find(query)
    question_ids = []
    async for q in questions_cursor:
        question_ids.append(str(q["_id"]))

    if not question_ids:
        raise HTTPException(status_code=400, detail="Nenhuma questão encontrada para os filtros selecionados")

    session_dict = {
        "user_id": str(current_user["_id"]),
        "exam_id": exam_id,
        "theme": theme,
        "specialty": specialty,
        "topic": topic,
        "focus": focus,
        "mode": data.get("mode", "treino"),
        "time_limit": data.get("time_limit", "free"),
        "question_ids": question_ids,
        "answers": {},
        "current_index": 0,
        "elapsed_time": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    result = await database.db.simulado_sessions.insert_one(session_dict)
    return {"session_id": str(result.inserted_id)}

@app.patch("/simulado/sessions/{session_id}", tags=["Simulados"])
async def update_simulado_session(
    session_id: str,
    data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    update_fields = {}
    if "answers" in data: update_fields["answers"] = data["answers"]
    if "current_index" in data: update_fields["current_index"] = data["current_index"]
    if "elapsed_time" in data: update_fields["elapsed_time"] = data["elapsed_time"]
    # Removido status do PATCH para evitar finalização precoce sem cálculo de result

    await database.db.simulado_sessions.update_one(
        {"_id": ObjectId(session_id), "user_id": str(current_user["_id"])},
        {"$set": update_fields}
    )
    return {"message": "Progresso salvo"}

@app.get("/simulado/active", tags=["Simulados"])
async def get_active_sessions(current_user: dict = Depends(get_current_user)):
    cursor = database.db.simulado_sessions.find({
        "user_id": str(current_user["_id"]),
        "status": "active"
    }).sort("created_at", -1)
    
    sessions = []
    async for s in cursor:
        s["_id"] = str(s["_id"])
        sessions.append(s)
    return sessions

@app.get("/simulado/sessions/{session_id}", tags=["Simulados"])
async def get_simulado_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await database.db.simulado_sessions.find_one({"_id": ObjectId(session_id), "user_id": str(current_user["_id"])})
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    session["_id"] = str(session["_id"])
    return session

@app.post("/simulado/sessions/{session_id}/finish", tags=["Simulados"])
async def finish_simulado_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = await database.db.simulado_sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    # Se já estiver finalizada E tiver resultado, apenas retorna
    if session.get("status") == "finished" and session.get("result"):
        return {"message": "Sessão já finalizada", "result": session.get("result")}

    # Recalcular resultados para garantir integridade
    answers = session.get("answers", {})
    question_ids = session.get("question_ids", [])
    
    if not question_ids:
        # Fallback se a sessão for antiga e não tiver question_ids
        query = {}
        if session.get("exam_id"): query["exam_id"] = session.get("exam_id")
        if session.get("theme"): query["theme"] = session.get("theme")
        questions_cursor = database.db.questions.find(query)
        questions = []
        async for q in questions_cursor:
            questions.append(q)
    else:
        q_obj_ids = [ObjectId(qid) for qid in question_ids]
        questions_cursor = database.db.questions.find({"_id": {"$in": q_obj_ids}})
        questions_map = {}
        async for q in questions_cursor:
            questions_map[str(q["_id"])] = q
        questions = [questions_map[qid] for qid in question_ids if qid in questions_map]
    
    if not questions:
        raise HTTPException(status_code=400, detail="Não foi possível recuperar as questões desta sessão")

    total_questions = len(questions)
    correct_answers = 0
    theme_metrics = {}

    for i, q in enumerate(questions):
        q_theme = q.get("theme", "Geral")
        if q_theme not in theme_metrics:
            theme_metrics[q_theme] = {"correct": 0, "total": 0}
        
        theme_metrics[q_theme]["total"] += 1
        
        user_ans = answers.get(str(i)) # O frontend salva como index stringificado no MongoDB às vezes ou int
        if user_ans is None:
            user_ans = answers.get(i)
            
        if user_ans == q["correct_answer"] or q["correct_answer"] == "Anulada":
            correct_answers += 1
            theme_metrics[q_theme]["correct"] += 1

    score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    result_data = {
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "score_percentage": round(score_percentage, 2),
        "theme_metrics": theme_metrics,
        "finished_at": datetime.now(timezone.utc)
    }

    # Atualizar sessão
    await database.db.simulado_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"status": "finished", "result": result_data}}
    )

    # Atualizar score do usuário (ex: cada acerto vale 10 pontos)
    points_earned = correct_answers * 10
    
    user = await database.db.users.find_one({"_id": ObjectId(user_id)})
    new_total_score = user.get("total_score", 0) + points_earned
    new_level = (new_total_score // 1000) + 1

    await database.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"total_score": new_total_score, "level": new_level}}
    )

    return {"message": "Simulado finalizado com sucesso", "result": result_data}

@app.delete("/simulado/sessions/{session_id}", tags=["Simulados"])
async def delete_simulado_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    result = await database.db.simulado_sessions.delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sessão não encontrada ou não pertence ao usuário")
    return {"message": "Sessão removida com sucesso"}

@app.get("/simulado/history", tags=["Simulados"])
async def get_simulado_history(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = database.db.simulado_sessions.find({
        "user_id": user_id,
        "status": {"$in": ["finished", "active"]}
    }).sort("created_at", -1)
    
    out = []
    async for s in cursor:
        res = s.get("result", {})
        # Tenta pegar o nome do exame ou o tema
        title = s.get("exam_id", "Simulado").replace("_", " ") if s.get("exam_id") else s.get("theme", "Simulado Personalizado")
        
        # Para sessões ativas, podemos estimar o progresso
        answered_count = len(s.get("answers", {}))
        
        out.append({
            "session_id": str(s["_id"]),
            "title": title,
            "exam_id": s.get("exam_id"),
            "theme": s.get("theme"),
            "correct_answers": res.get("correct_answers", 0),
            "total_questions": res.get("total_questions", 0),
            "score_percentage": res.get("score_percentage", 0),
            "finished_at": res.get("finished_at") or s.get("created_at"),
            "mode": s.get("mode", "treino"),
            "status": s.get("status", "active"),
            "answered_count": answered_count
        })
    return {"history": out}
