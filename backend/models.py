from pydantic import BaseModel, Field
from typing import List, Optional

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
    history: List[ChatTurn]
    document: str

class Fase1ChatRequest(BaseModel):
    session_id: str
    message: MessageInput
