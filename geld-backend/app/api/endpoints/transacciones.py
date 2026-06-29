# app/api/endpoints/transacciones.py
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from decimal import Decimal
from typing import Dict

from app.db.database import get_session
from app.schemas.transaccion import TransaccionCreate, TransaccionRead, PaginatedTransacciones
from app.crud import crud_transaccion
from app.models.domain import TipoMovimiento

from app.api.deps import obtener_usuario_actual
from app.models.domain import Usuario

router = APIRouter()

@router.post("/", response_model=TransaccionRead, status_code=201)
def registrar_transaccion(
    transaccion: TransaccionCreate, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Registra un movimiento asegurando la integridad de reglas de transferencia.
    *Ruta Protegida: Requiere Token JWT.*
    """
    # Nota: Si el schema falla (ej. falta cuenta destino), FastAPI devuelve error automático antes de llegar aquí.
    return crud_transaccion.create_transaccion(session=session, transaccion_in=transaccion)

@router.get("/cuenta/{cuenta_id}/saldo", response_model=Dict[str, Decimal])
def obtener_saldo_actual(
    cuenta_id: str, 
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Ejecuta el recálculo dinámico del balance vivo de una cuenta específica.
    *Ruta Protegida: Requiere Token JWT.*
    """
    saldo = crud_transaccion.get_saldo_cuenta_al_vuelo(session=session, cuenta_id=cuenta_id)
    if saldo is None:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    return {"saldo_actual": saldo}

@router.get("/", response_model=PaginatedTransacciones)
def listar_transacciones(
    skip: int = 0, 
    limit: int = 50,
    cuenta_id: Optional[str] = None,
    tipo: Optional[TipoMovimiento] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    session: Session = Depends(get_session),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Obtiene el historial de transacciones. 
    Permite filtrar por cuenta, tipo de movimiento y rango de fechas.
    Resultados paginados y ordenados por fecha descendente.
    *Ruta Protegida: Requiere Token JWT.*
    """
    total, registros = crud_transaccion.get_transacciones(
        session=session,
        skip=skip,
        limit=limit,
        cuenta_id=cuenta_id,
        tipo=tipo,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

    return {
        "total_registros": total,
        "skip": skip,
        "limit": limit,
        "data": registros
    }