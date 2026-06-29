# app/api/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
    
from app.db.database import get_session
from app.models.domain import Usuario
from app.core.security import verificar_password, obtener_password_hash, crear_token_acceso

router = APIRouter()

# Esquema para registrar el primer usuario administrador
class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str

@router.post("/registrar", status_code=201)
def registrar_admin(usuario_in: UsuarioCreate, session: Session = Depends(get_session)):
    """Registra un nuevo usuario asegurando que la contraseña se encripte."""
    # Verificamos si el correo ya existe
    user_exists = session.exec(select(Usuario).where(Usuario.email == usuario_in.email)).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
            
    # Encriptamos la contraseña antes de guardarla en PostgreSQL
    nuevo_usuario = Usuario(
        email=usuario_in.email,
        hashed_password=obtener_password_hash(usuario_in.password)
    )
    session.add(nuevo_usuario)
    session.commit()
    return {"mensaje": "Usuario creado con éxito. Ya puedes hacer login."}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Valida credenciales y devuelve el JWT para autorizar peticiones futuras."""
    # 1. Buscamos al usuario por correo (OAuth2 usa 'username' por defecto para el ID)
    usuario = session.exec(select(Usuario).where(Usuario.email == form_data.username)).first()
    
    # 2. Verificamos que exista y la contraseña coincida
    if not usuario or not verificar_password(form_data.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Generamos el Token inyectando el ID del usuario
    access_token = crear_token_acceso(data={"sub": str(usuario.id)})
    
    # 4. Devolvemos el token en el formato estándar esperado por las APIs
    return {"access_token": access_token, "token_type": "bearer"}