# app/crud/crud_categoria.py
from sqlmodel import Session, select
from typing import Optional 
from app.models.domain import Categoria, Transaccion
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate
from uuid import UUID

def create_categoria(session: Session, categoria_in: CategoriaCreate, usuario_id: UUID) -> Categoria:
    datos_dict = categoria_in.model_dump()
    datos_dict["usuario_id"] = usuario_id
    db_categoria = Categoria(**datos_dict)
    
    session.add(db_categoria)
    session.commit()
    session.refresh(db_categoria)
    return db_categoria

def get_categorias(session: Session, usuario_id: UUID, skip: int = 0, limit: int = 100):
    statement = select(Categoria).where(Categoria.usuario_id == usuario_id).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_categoria_por_id(session: Session, categoria_id: str, usuario_id: UUID) -> Optional[Categoria]:
    return session.exec(select(Categoria).where(Categoria.id == categoria_id, Categoria.usuario_id == usuario_id)).first()

def categoria_tiene_transacciones(session: Session, categoria_id: str, usuario_id: UUID) -> bool:
    movimiento = session.exec(select(Transaccion).where(Transaccion.categoria_id == categoria_id, Transaccion.usuario_id == usuario_id)).first()
    return movimiento is not None

def update_categoria(session: Session, db_categoria: Categoria, categoria_in: CategoriaUpdate) -> Categoria:
    datos_dict = categoria_in.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(db_categoria, key, value)
    session.add(db_categoria)
    session.commit()
    session.refresh(db_categoria)
    return db_categoria

def delete_categoria(session: Session, db_categoria: Categoria) -> None:
    session.delete(db_categoria)
    session.commit()