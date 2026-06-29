from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
import jwt

from app.db.database import get_session
from app.core.config import settings
from app.models.domain import Usuario

# Le indicamos a FastAPI y a Swagger la URL donde se consiguen los tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme), 
    session: Session = Depends(get_session)
) -> Usuario:
    """
    Intercepta la petición, extrae el token del header, lo decodifica y 
    devuelve el usuario de la base de datos si el token es válido y no ha expirado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Decodificamos el token usando nuestra llave secreta
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        
        # 2. Extraemos el ID del usuario (el 'sub' que inyectamos en auth.py)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Tu sesión ha expirado, vuelve a iniciar sesión"
        )
    except jwt.InvalidTokenError:
        raise credentials_exception
        
    # 3. Buscamos al usuario en la base de datos para confirmar que sigue existiendo
    usuario = session.get(Usuario, user_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Si el usuario está inactivo (ej. si lo suspendes en un futuro), lo bloqueamos
    if not usuario.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    return usuario