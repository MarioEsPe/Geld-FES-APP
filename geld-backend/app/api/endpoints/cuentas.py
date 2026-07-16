# app/api/endpoints/cuentas.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from app.db.database import get_session
from app.schemas.cuenta import CuentaCreate, CuentaRead, CuentaUpdate
from app.crud import crud_cuenta
from app.api.deps import obtener_usuario_actual

router = APIRouter()

@router.post("/", response_model=CuentaRead, status_code=201)
def create_cuenta(cuenta: CuentaCreate, session: Session = Depends(get_session), usuario_actual=Depends(obtener_usuario_actual)):
    return crud_cuenta.create_cuenta(session=session, cuenta_in=cuenta)

@router.get("/", response_model=List[CuentaRead])
def read_cuentas(skip: int = 0, limit: int = 100, session: Session = Depends(get_session), usuario_actual=Depends(obtener_usuario_actual)):
    return crud_cuenta.get_cuentas(session=session, skip=skip, limit=limit)

@router.get("/resumen/saldos")
def resumen_saldos(session: Session = Depends(get_session), usuario_actual=Depends(obtener_usuario_actual)):
    return crud_cuenta.obtener_resumen_saldos(session=session)

@router.put("/{cuenta_id}")
def actualizar_cuenta(cuenta_id: str, datos_actualizados: CuentaUpdate, session: Session = Depends(get_session), usuario_actual=Depends(obtener_usuario_actual)):
    cuenta = crud_cuenta.get_cuenta_por_id(session, cuenta_id)
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # Validación de cambio de moneda orchestrada en el endpoint usando funciones CRUD
    if datos_actualizados.moneda and datos_actualizados.moneda != cuenta.moneda:
        if crud_cuenta.cuenta_tiene_transacciones(session, cuenta_id):
            raise HTTPException(
                status_code=400, 
                detail="No puedes cambiar la moneda de una cuenta que ya tiene movimientos en el historial."
            )
    
    return crud_cuenta.update_cuenta(session=session, db_cuenta=cuenta, cuenta_in=datos_actualizados)

@router.delete("/{cuenta_id}")
def eliminar_cuenta(cuenta_id: str, session: Session = Depends(get_session), usuario_actual=Depends(obtener_usuario_actual)):
    cuenta = crud_cuenta.get_cuenta_por_id(session, cuenta_id)
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    if crud_cuenta.cuenta_tiene_transacciones(session, cuenta_id):
        raise HTTPException(
            status_code=400, 
            detail=f"No es posible eliminar '{cuenta.nombre_cuenta}' porque ya tiene transacciones registradas en el historial."
        )
    
    crud_cuenta.delete_cuenta(session, db_cuenta=cuenta)
    return {"mensaje": "Cuenta eliminada correctamente"}