# app/api/endpoints/familias.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from app.db.database import get_session
from app.schemas.familia import FamiliaCreate, FamiliaRead
from app.crud import crud_familia

from app.api.deps import obtener_usuario_actual
from app.models.domain import Usuario

router = APIRouter()

@router.post("/", response_model=FamiliaRead, status_code=201)
def create_familia(
    familia: FamiliaCreate, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Crea una nueva Familia de gastos en la base de datos.
    *Ruta Protegida: Requiere Token JWT.*
    """
    return crud_familia.create_familia(session=session, familia_in=familia)

@router.get("/", response_model=List[FamiliaRead])
def read_familias(
    skip: int = 0, limit: int = 100, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Obtiene la lista de todas las familias configuradas.
    *Ruta Protegida: Requiere Token JWT.*
    """
    return crud_familia.get_familias(session=session, skip=skip, limit=limit)