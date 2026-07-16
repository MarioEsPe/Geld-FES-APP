# app/crud/crud_familia.py
from sqlmodel import Session, select
from typing import Optional
from app.models.domain import Familia, Categoria
from app.schemas.familia import FamiliaCreate, FamiliaUpdate

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

def get_familia_por_id(session: Session, familia_id: str) -> Optional[Familia]:
    return session.get(Familia, familia_id)

def familia_tiene_categorias(session: Session, familia_id: str) -> bool:
    """Valida si la familia tiene subcategorías ligadas."""
    categoria_existente = session.exec(select(Categoria).where(Categoria.familia_id == familia_id)).first()
    return categoria_existente is not None

def update_familia(session: Session, db_familia: Familia, familia_in: FamiliaUpdate) -> Familia:
    datos_dict = familia_in.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(db_familia, key, value)
    session.add(db_familia)
    session.commit()
    session.refresh(db_familia)
    return db_familia

def delete_familia(session: Session, db_familia: Familia) -> None:
    session.delete(db_familia)
    session.commit()