# app/api/endpoints/familias.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List

from app.db.database import get_session
from app.schemas.familia import FamiliaCreate, FamiliaRead, FamiliaUpdate
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

@router.put("/{familia_id}", response_model=FamiliaRead)
def actualizar_familia(
    familia_id: str,
    datos_actualizados: FamiliaUpdate,
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    familia = crud_familia.get_familia_por_id(session, familia_id)
    if not familia:
        raise HTTPException(status_code=404, detail="Familia no encontrada")
    
    return crud_familia.update_familia(session, familia, datos_actualizados)

@router.delete("/{familia_id}")
def eliminar_familia(
    familia_id: str,
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    familia = crud_familia.get_familia_por_id(session, familia_id)
    if not familia:
        raise HTTPException(status_code=404, detail="Familia no encontrada")
    
    if crud_familia.familia_tiene_categorias(session, familia_id):
        raise HTTPException(
            status_code=400, 
            detail=f"No puedes eliminar la familia '{familia.nombre_familia}' porque tiene categorías asociadas."
        )
        
    crud_familia.delete_familia(session, familia)
    return {"mensaje": "Familia eliminada correctamente"}