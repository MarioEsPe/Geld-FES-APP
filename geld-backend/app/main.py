# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- Importación nueva para CORS
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.api.router import api_router
from app.core.handlers import sqlalchemy_integrity_error_handler, global_exception_handler

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend transaccional para gestión financiera personal"
)

# --- CONFIGURACIÓN DE CORS (El Puente para el Frontend) ---
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:4321", # Puerto por defecto de Astro
    "http://localhost:3000", # Puerto clásico de React
    "http://localhost:5173", # Puerto de Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       
    allow_credentials=True,      
    allow_methods=["*"],         
    allow_headers=["*"],         
)

# --- REGISTRO DE MANEJADORES DE EXCEPCIONES ---
app.add_exception_handler(IntegrityError, sqlalchemy_integrity_error_handler)
app.add_exception_handler(Exception, global_exception_handler)

# --- CONEXIÓN DE RUTAS ---
app.include_router(api_router)

# Endpoint de prueba (Health Check)
@app.get("/", tags=["Status"])
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }