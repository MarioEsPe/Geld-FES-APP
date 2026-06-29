# app/api/endpoints/categorias.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from app.db.database import get_session
from app.schemas.categoria import CategoriaCreate, CategoriaRead
from app.crud import crud_categoria

from app.api.deps import obtener_usuario_actual
from app.models.domain import Usuario

router = APIRouter()

@router.post("/", response_model=CategoriaRead, status_code=201)
def create_categoria(
    categoria: CategoriaCreate, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    return crud_categoria.create_categoria(session=session, categoria_in=categoria)

@router.get("/", response_model=List[CategoriaRead])
def read_categorias(
    skip: int = 0, 
    limit: int = 100, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    return crud_categoria.get_categorias(session=session, skip=skip, limit=limit)