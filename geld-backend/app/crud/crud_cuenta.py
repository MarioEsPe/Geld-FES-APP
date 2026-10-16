# app/crud/crud_cuenta.py
from sqlmodel import Session, select
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from app.models.domain import Cuenta, Transaccion
from app.schemas.cuenta import CuentaCreate, CuentaUpdate
from decimal import Decimal
from uuid import UUID

def create_cuenta(session: Session, cuenta_in: CuentaCreate, usuario_id: UUID) -> Cuenta:
    # 1. Extraemos todos los datos del esquema (ej. nombre, saldo_inicial, moneda)
    datos_dict = cuenta_in.model_dump()
    
    # 2. Le inyectamos el ID de tu usuario antes de construir el modelo
    datos_dict["usuario_id"] = usuario_id
    
    # 3. Ahora sí, construimos la Cuenta completa (Pydantic validará todo sin chistar)
    db_cuenta = Cuenta(**datos_dict)
    
    # 4. Guardamos en PostgreSQL
    session.add(db_cuenta)
    session.commit()
    session.refresh(db_cuenta)
    return db_cuenta

def get_cuentas(session: Session, usuario_id: UUID, skip: int = 0, limit: int = 100) -> List[Cuenta]:
    # 🔒 Filtro de aislamiento
    statement = select(Cuenta).where(Cuenta.usuario_id == usuario_id).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_cuenta_por_id(session: Session, cuenta_id: str, usuario_id: UUID) -> Optional[Cuenta]:
    # 🔒 Buscamos solo si pertenece al usuario activo
    return session.exec(select(Cuenta).where(Cuenta.id == cuenta_id, Cuenta.usuario_id == usuario_id)).first()

def cuenta_tiene_transacciones(session: Session, cuenta_id: str, usuario_id: UUID) -> bool:
    movimiento_existente = session.exec(
        select(Transaccion).where(
            (Transaccion.usuario_id == usuario_id) &
            ((Transaccion.cuenta_id == cuenta_id) | (Transaccion.cuenta_destino_id == cuenta_id))
        )
    ).first()
    return movimiento_existente is not None

def update_cuenta(session: Session, db_cuenta: Cuenta, cuenta_in: CuentaUpdate) -> Cuenta:
    datos_dict = cuenta_in.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(db_cuenta, key, value)
    session.add(db_cuenta)
    session.commit()
    session.refresh(db_cuenta)
    return db_cuenta

def delete_cuenta(session: Session, db_cuenta: Cuenta) -> None:
    session.delete(db_cuenta)
    session.commit()

def obtener_resumen_saldos(session: Session, usuario_id: UUID) -> List[Dict[str, Any]]:
    # 🔒 Cuentas exclusivas del usuario
    cuentas = session.exec(select(Cuenta).where(Cuenta.usuario_id == usuario_id)).all()
    resultado = []
    
    for c in cuentas:
        monto_calc = Transaccion.monto * Transaccion.tipo_de_cambio if c.moneda == "MXN" else Transaccion.monto
        
        cargos = session.exec(
            select(func.coalesce(func.sum(monto_calc), Decimal("0.00")))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "CARGO", Transaccion.usuario_id == usuario_id)
        ).one()
        
        abonos = session.exec(
            select(func.coalesce(func.sum(monto_calc), Decimal("0.00")))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "ABONO", Transaccion.usuario_id == usuario_id)
        ).one()
        
        transf_out = session.exec(
            select(func.coalesce(func.sum(monto_calc), Decimal("0.00")))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "TRANSFERENCIA", Transaccion.usuario_id == usuario_id)
        ).one()
        
        transf_in = session.exec(
            select(func.coalesce(func.sum(monto_calc), Decimal("0.00")))
            .where(Transaccion.cuenta_destino_id == c.id, Transaccion.tipo == "TRANSFERENCIA", Transaccion.usuario_id == usuario_id)
        ).one()
        
        saldo_actual = c.saldo_inicial + abonos - cargos + transf_in - transf_out
        
        resultado.append({
            "id": c.id,
            "nombre_cuenta": c.nombre_cuenta,
            "moneda": c.moneda,
            "saldo_inicial": c.saldo_inicial,
            "saldo_actual": saldo_actual
        })
        
    return resultado