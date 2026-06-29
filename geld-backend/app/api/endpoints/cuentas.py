# app/api/endpoints/cuentas.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from app.db.database import get_session
from app.schemas.cuenta import CuentaCreate, CuentaRead
from app.crud import crud_cuenta

from app.api.deps import obtener_usuario_actual
from app.models.domain import Usuario

router = APIRouter()

@router.post("/", response_model=CuentaRead, status_code=201)
def create_cuenta(
    cuenta: CuentaCreate, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Registra una nueva cuenta financiera en el sistema.
    *Ruta Protegida: Requiere Token JWT.*
    """
    return crud_cuenta.create_cuenta(session=session, cuenta_in=cuenta)

@router.get("/", response_model=List[CuentaRead])
def read_cuentas(
    skip: int = 0, 
    limit: int = 100, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Obtiene el catálogo de cuentas registradas.
    *Ruta Protegida: Requiere Token JWT.*
    """
    return crud_cuenta.get_cuentas(session=session, skip=skip, limit=limit)