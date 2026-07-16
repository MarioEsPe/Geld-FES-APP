# app/api/endpoints/cuentas.py
from fastapi import APIRouter, Depends, HTTPException  # <-- AGREGADO HTTPException
from sqlmodel import Session, select
from typing import List
from sqlalchemy import func

from app.db.database import get_session
from app.schemas.cuenta import CuentaCreate, CuentaRead, CuentaUpdate
from app.crud import crud_cuenta

from app.api.deps import obtener_usuario_actual
from app.models.domain import Usuario, Cuenta, Transaccion

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

@router.get("/resumen/saldos")
def resumen_saldos(
    session: Session = Depends(get_session),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Calcula el Saldo Actual al Vuelo para cada cuenta."""
    cuentas = session.exec(select(Cuenta)).all()
    resultado = []
    
    for c in cuentas:
        # Sumamos Cargos (Gastos)
        cargos = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "CARGO")
        ).first() or 0
        
        # Sumamos Abonos (Ingresos)
        abonos = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "ABONO")
        ).first() or 0
        
        # Sumamos Transferencias Salientes
        transf_out = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "TRANSFERENCIA")
        ).first() or 0
        
        # Sumamos Transferencias Entrantes
        transf_in = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_destino_id == c.id, Transaccion.tipo == "TRANSFERENCIA")
        ).first() or 0
        
        # La Fórmula Maestra
        saldo_actual = c.saldo_inicial + abonos - cargos + transf_in - transf_out
        
        resultado.append({
            "id": c.id,
            "nombre_cuenta": c.nombre_cuenta,
            "moneda": c.moneda,
            "saldo_inicial": c.saldo_inicial,
            "saldo_actual": saldo_actual
        })
        
    return resultado

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
    Elimina una cuenta, previa validación estricta de que no tenga transacciones.
    """
    cuenta = session.get(Cuenta, cuenta_id)
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # 1. Validación explícita: Revisar si existen transacciones ligadas
    movimiento_existente = session.exec(
        select(Transaccion).where(
            (Transaccion.cuenta_id == cuenta_id) | 
            (Transaccion.cuenta_destino_id == cuenta_id)
        )
    ).first()
    
    if movimiento_existente:
        raise HTTPException(
            status_code=400, 
            detail=f"No es posible eliminar '{cuenta.nombre_cuenta}' porque ya tiene transacciones registradas en el historial."
        )
    
    # 2. Si está limpia, procedemos a borrarla
    session.delete(cuenta)
    session.commit()
    return {"mensaje": "Cuenta eliminada correctamente"}