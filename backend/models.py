from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class UserRegistration(BaseModel):
    full_name: str
    email: EmailStr
    cpf: str
    phone: str
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class UserModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    full_name: str
    email: EmailStr
    cpf: str
    phone: str
    hashed_password: str
    role: str = "student"
    gemini_api_key: Optional[str] = None
    profile_image: Optional[str] = None
    total_score: int = 0
    level: int = 1
    subscription_status: str = "pending" # pending, active, overdue
    asaas_customer_id: Optional[str] = None
    subscription_expiry: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CaseModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    title: str
    category: str
    description: str
    patient_system_prompt: str
    checklist: List[str]

class ChatTurn(BaseModel):
    role: str
    text: str

class ChatSessionModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    case_id: str
    history: List[ChatTurn]
    feedback: Optional[str] = None

class MessageInput(BaseModel):
    text: str

class ChatRequest(BaseModel):
    session_id: str
    message: MessageInput

class Fase1Request(BaseModel):
    query: str

class Fase1SessionModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    history: List[ChatTurn]
    document: str

class Fase1ChatRequest(BaseModel):
    session_id: str
    message: MessageInput

class QuestionModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    exam_id: str # ex: "revalida_2025_1"
    number: int
    text: str
    alternatives: dict # {"A": "...", "B": "..."}
    correct_answer: Optional[str] = None # A, B, C, D ou "Anulada"
    theme: str
    images: List[str] = [] # Lista de caminhos para as imagens

class ThemeMetric(BaseModel):
    correct: int
    total: int

class SimulationResult(BaseModel):
    total_questions: int
    correct_answers: int
    score_percentage: float
    theme_metrics: dict # { "Theme Name": ThemeMetric }
    finished_at: datetime = Field(default_factory=datetime.utcnow)

class SimuladoSessionModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    exam_id: Optional[str] = None
    theme: Optional[str] = None
    mode: str # treino / simulado
    time_limit: str # free / 4h
    question_ids: List[str] = []
    answers: dict = {} # { "0": "A", "1": "B" }
    current_index: int = 0
    elapsed_time: int = 0
    status: str = "active" # active / finished
    result: Optional[SimulationResult] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
