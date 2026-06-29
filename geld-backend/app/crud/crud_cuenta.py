# app/crud/crud_cuenta.py
from sqlmodel import Session, select
from app.models.domain import Cuenta
from app.schemas.cuenta import CuentaCreate

def create_cuenta(session: Session, cuenta_in: CuentaCreate) -> Cuenta:
    # SQLModel convierte el schema validado de Pydantic en un registro de base de datos
    db_cuenta = Cuenta.model_validate(cuenta_in)
    session.add(db_cuenta)
    session.commit()
    session.refresh(db_cuenta)
    return db_cuenta

def get_cuentas(session: Session, skip: int = 0, limit: int = 100):
    statement = select(Cuenta).offset(skip).limit(limit)
    return session.exec(statement).all()