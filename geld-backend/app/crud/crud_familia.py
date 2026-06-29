# app/crud/crud_familia.py
from sqlmodel import Session, select
from app.models.domain import Familia
from app.schemas.familia import FamiliaCreate

def create_familia(session: Session, familia_in: FamiliaCreate) -> Familia:
    # Convertimos el schema de Pydantic al modelo de SQLModel
    db_familia = Familia.model_validate(familia_in)
    
    # Lo preparamos, lo guardamos y refrescamos para obtener los datos finales
    session.add(db_familia)
    session.commit()
    session.refresh(db_familia)
    return db_familia

def get_familias(session: Session, skip: int = 0, limit: int = 100):
    # Generamos la consulta SQL: SELECT * FROM familias OFFSET skip LIMIT limit
    statement = select(Familia).offset(skip).limit(limit)
    return session.exec(statement).all()