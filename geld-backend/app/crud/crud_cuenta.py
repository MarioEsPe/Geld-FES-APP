# app/crud/crud_cuenta.py
from sqlmodel import Session, select
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from app.models.domain import Cuenta, Transaccion
from app.schemas.cuenta import CuentaCreate, CuentaUpdate

def create_cuenta(session: Session, cuenta_in: CuentaCreate) -> Cuenta:
    db_cuenta = Cuenta.model_validate(cuenta_in)
    session.add(db_cuenta)
    session.commit()
    session.refresh(db_cuenta)
    return db_cuenta

def get_cuentas(session: Session, skip: int = 0, limit: int = 100) -> List[Cuenta]:
    statement = select(Cuenta).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_cuenta_por_id(session: Session, cuenta_id: str) -> Optional[Cuenta]:
    """Busca una cuenta específica por su ID único."""
    return session.get(Cuenta, cuenta_id)

def cuenta_tiene_transacciones(session: Session, cuenta_id: str) -> bool:
    """Revisa si una cuenta tiene transacciones asociadas (origen o destino)."""
    movimiento_existente = session.exec(
        select(Transaccion).where(
            (Transaccion.cuenta_id == cuenta_id) | 
            (Transaccion.cuenta_destino_id == cuenta_id)
        )
    ).first()
    return movimiento_existente is not None

def update_cuenta(session: Session, db_cuenta: Cuenta, cuenta_in: CuentaUpdate) -> Cuenta:
    """Aplica los cambios validados a un objeto cuenta existente."""
    datos_dict = cuenta_in.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(db_cuenta, key, value)
        
    session.add(db_cuenta)
    session.commit()
    session.refresh(db_cuenta)
    return db_cuenta

def delete_cuenta(session: Session, db_cuenta: Cuenta) -> None:
    """Elimina físicamente el registro de la cuenta de la base de datos."""
    session.delete(db_cuenta)
    session.commit()

def obtener_resumen_saldos(session: Session) -> List[Dict[str, Any]]:
    """Mueve la lógica matemática y de agregación del resumen de saldos al CRUD."""
    cuentas = session.exec(select(Cuenta)).all()
    resultado = []
    
    for c in cuentas:
        cargos = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "CARGO")
        ).first() or 0
        
        abonos = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "ABONO")
        ).first() or 0
        
        transf_out = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_id == c.id, Transaccion.tipo == "TRANSFERENCIA")
        ).first() or 0
        
        transf_in = session.exec(
            select(func.sum(Transaccion.monto))
            .where(Transaccion.cuenta_destino_id == c.id, Transaccion.tipo == "TRANSFERENCIA")
        ).first() or 0
        
        saldo_actual = c.saldo_inicial + abonos - cargos + transf_in - transf_out
        
        resultado.append({
            "id": c.id,
            "nombre_cuenta": c.nombre_cuenta,
            "moneda": c.moneda,
            "saldo_inicial": c.saldo_inicial,
            "saldo_actual": saldo_actual
        })
        
    return resultado