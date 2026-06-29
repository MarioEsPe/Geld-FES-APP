# app/crud/crud_categoria.py
from sqlmodel import Session, select
from app.models.domain import Categoria
from app.schemas.categoria import CategoriaCreate

def create_categoria(session: Session, categoria_in: CategoriaCreate) -> Categoria:
    db_categoria = Categoria.model_validate(categoria_in)
    session.add(db_categoria)
    session.commit()
    session.refresh(db_categoria)
    return db_categoria

def get_categorias(session: Session, skip: int = 0, limit: int = 100):
    statement = select(Categoria).offset(skip).limit(limit)
    return session.exec(statement).all()