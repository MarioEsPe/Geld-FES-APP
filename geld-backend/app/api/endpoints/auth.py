# app/api/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
import secrets

# Librerías de Google
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
    
from app.db.database import get_session
from app.models.domain import Usuario
from app.core.security import verificar_password, obtener_password_hash, crear_token_acceso
from app.core.config import settings

router = APIRouter()

class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str

class TokenGoogle(BaseModel):
    credential: str

@router.post("/registrar", status_code=201)
def registrar_admin(usuario_in: UsuarioCreate, session: Session = Depends(get_session)):
    """Registra un nuevo usuario asegurando que la contraseña se encripte."""
    user_exists = session.exec(select(Usuario).where(Usuario.email == usuario_in.email)).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
            
    nuevo_usuario = Usuario(
        email=usuario_in.email,
        hashed_password=obtener_password_hash(usuario_in.password)
    )
    session.add(nuevo_usuario)
    session.commit()
    return {"mensaje": "Usuario creado con éxito. Ya puedes hacer login."}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Valida credenciales clásicas y devuelve el JWT."""
    usuario = session.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
    
    if not usuario or not verificar_password(form_data.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = crear_token_acceso(data={"sub": str(usuario.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google")
def login_google(token_data: TokenGoogle, session: Session = Depends(get_session)):
    """Recibe el token de Google, lo valida y genera sesión en GELD."""
    try:
        # 1. Verificamos la firma criptográfica con los servidores de Google
        id_info = id_token.verify_oauth2_token(
            token_data.credential, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        email = id_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="El token no contiene un email válido")

        # 2. Buscamos si el usuario ya existe en nuestra base de datos
        usuario = session.exec(select(Usuario).where(Usuario.email == email)).first()
        
        # 3. Si es la primera vez que entra, le creamos su bóveda automáticamente
        if not usuario:
            # Generamos una contraseña aleatoria irrompible ya que su llave de acceso será su cuenta de Google
            random_password = secrets.token_urlsafe(32)
            usuario = Usuario(
                email=email,
                hashed_password=obtener_password_hash(random_password)
            )
            session.add(usuario)
            session.commit()
            session.refresh(usuario)
        
        # 4. Generamos nuestro propio JWT estándar para que la App funcione normal
        access_token = crear_token_acceso(data={"sub": str(usuario.id)})
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de Google inválido o expirado")