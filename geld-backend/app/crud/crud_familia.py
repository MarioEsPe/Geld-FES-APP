# app/crud/crud_familia.py
from sqlmodel import Session, select
from typing import Optional
from app.models.domain import Familia, Categoria
from app.schemas.familia import FamiliaCreate, FamiliaUpdate
from uuid import UUID

def create_familia(session: Session, familia_in: FamiliaCreate, usuario_id: UUID) -> Familia:
    datos_dict = familia_in.model_dump()
    datos_dict["usuario_id"] = usuario_id
    db_familia = Familia(**datos_dict)
    
    session.add(db_familia)
    session.commit()
    session.refresh(db_familia)
    return db_familia

def get_familias(session: Session, usuario_id: UUID, skip: int = 0, limit: int = 100):
    statement = select(Familia).where(Familia.usuario_id == usuario_id).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_familia_por_id(session: Session, familia_id: str, usuario_id: UUID) -> Optional[Familia]:
    return session.exec(select(Familia).where(Familia.id == familia_id, Familia.usuario_id == usuario_id)).first()

def familia_tiene_categorias(session: Session, familia_id: str, usuario_id: UUID) -> bool:
    categoria_existente = session.exec(
        select(Categoria).where(Categoria.familia_id == familia_id, Categoria.usuario_id == usuario_id)
    ).first()
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