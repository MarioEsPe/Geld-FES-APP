# app/crud/crud_categoria.py
from sqlmodel import Session, select
from typing import Optional 
from app.models.domain import Categoria, Transaccion
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate

def create_categoria(session: Session, categoria_in: CategoriaCreate) -> Categoria:
    db_categoria = Categoria.model_validate(categoria_in)
    session.add(db_categoria)
    session.commit()
    session.refresh(db_categoria)
    return db_categoria

def get_categorias(session: Session, skip: int = 0, limit: int = 100):
    statement = select(Categoria).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_categoria_por_id(session: Session, categoria_id: str) -> Optional[Categoria]:
    return session.get(Categoria, categoria_id)

def categoria_tiene_transacciones(session: Session, categoria_id: str) -> bool:
    """Valida si la categoría ya fue usada en alguna transacción histórica."""
    movimiento = session.exec(select(Transaccion).where(Transaccion.categoria_id == categoria_id)).first()
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