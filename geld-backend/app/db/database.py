# app/db/database.py
from sqlmodel import create_engine, Session
from app.core.config import settings

# create_engine es el motor que maneja el pool de conexiones hacia PostgreSQL
engine = create_engine(
    settings.DATABASE_URL, 
    echo=False # Cambia a True si quieres ver cada consulta SQL impresa en la terminal
)

# Dependencia para inyectar la sesión en nuestras rutas de FastAPI
def get_session():
    with Session(engine) as session:
        yield session