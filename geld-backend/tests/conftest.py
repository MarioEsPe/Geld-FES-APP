# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db.database import get_session
from app.api.deps import obtener_usuario_actual # <-- Importamos el cadenero
from app.models.domain import Usuario

# Usamos SQLite en memoria para que las pruebas vuelen y no toquen tus datos reales
sqlite_name = "sqlite://"
engine = create_engine(
    sqlite_name, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)

@pytest.fixture(name="session")
def session_fixture():
    """Crea las tablas, entrega la sesión para la prueba, y al terminar destruye todo."""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Inyecta nuestra base de datos de prueba en la API real."""
    def get_session_override():
        return session
    
    def get_user_override():
        # Creamos un usuario fantasma para engañar a la API y darle acceso VIP a las pruebas
        return Usuario(email="test@admin.com", hashed_password="xxx", is_active=True)
        
    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[obtener_usuario_actual] = get_user_override
    
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()