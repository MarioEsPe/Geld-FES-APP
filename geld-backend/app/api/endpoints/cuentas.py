# app/api/endpoints/cuentas.py
from fastapi import APIRouter, Depends, HTTPException  # <-- AGREGADO HTTPException
from sqlmodel import Session
from typing import List

from app.db.database import get_session
from app.schemas.cuenta import CuentaCreate, CuentaRead, CuentaUpdate
from app.crud import crud_cuenta

from app.api.deps import obtener_usuario_actual
from app.models.domain import Usuario, Cuenta  # <-- AGREGADO Cuenta desde tus modelos

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

@router.put("/{cuenta_id}")
def actualizar_cuenta(
    cuenta_id: str,
    datos_actualizados: CuentaUpdate,
    session: Session = Depends(get_session),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Actualiza uno o varios campos de una cuenta existente."""
    cuenta = session.get(Cuenta, cuenta_id)
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # Actualizamos solo los campos que el usuario envió
    datos_dict = datos_actualizados.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(cuenta, key, value)
        
    session.add(cuenta)
    session.commit()
    session.refresh(cuenta)
    
    return cuenta


@router.delete("/{cuenta_id}")
def eliminar_cuenta(
    cuenta_id: str, 
    session: Session = Depends(get_session),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """
    Elimina una cuenta. 
    Nota: Fallará automáticamente (protección de integridad) si la cuenta 
    ya tiene transacciones asociadas en el historial.
    """
    cuenta = session.get(Cuenta, cuenta_id)
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    session.delete(cuenta)
    session.commit()
    return {"mensaje": "Cuenta eliminada correctamente"}