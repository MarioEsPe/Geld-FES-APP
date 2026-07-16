# app/api/endpoints/categorias.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List

from app.db.database import get_session
from app.schemas.categoria import CategoriaCreate, CategoriaRead, CategoriaUpdate
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

@router.put("/{categoria_id}", response_model=CategoriaRead)
def actualizar_categoria(
    categoria_id: str,
    datos_actualizados: CategoriaUpdate,
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    categoria = crud_categoria.get_categoria_por_id(session, categoria_id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    return crud_categoria.update_categoria(session, categoria, datos_actualizados)

@router.delete("/{categoria_id}")
def eliminar_categoria(
    categoria_id: str,
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    categoria = crud_categoria.get_categoria_por_id(session, categoria_id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    if crud_categoria.categoria_tiene_transacciones(session, categoria_id):
        raise HTTPException(
            status_code=400, 
            detail=f"No puedes eliminar '{categoria.nombre_categoria}' porque ya tiene transacciones registradas."
        )
        
    crud_categoria.delete_categoria(session, categoria)
    return {"mensaje": "Categoría eliminada correctamente"}