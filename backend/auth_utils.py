import database
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from auth_handler import decode_access_token
from bson import ObjectId

security = HTTPBearer(scheme_name="BearerAuth", description="Insira o seu token JWT para acessar endpoints protegidos")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/docs-login", auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    
    email = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=401, detail="Payload do token inválido")
        
    user = await database.db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
    # Retornamos o usuário como um dicionário, incluindo o ID formatado como string
    user["_id"] = str(user["_id"])
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Acesso negado. Apenas administradores podem acessar este recurso."
        )
    return current_user
