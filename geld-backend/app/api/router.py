# app/api/router.py
from fastapi import APIRouter
from app.api.endpoints import familias, cuentas, categorias, transacciones, auth

api_router = APIRouter()

# Aquí iremos conectando todas las demás rutas (cuentas, transacciones, etc.)
api_router.include_router(familias.router, prefix="/familias", tags=["Familias"])
api_router.include_router(cuentas.router, prefix="/cuentas", tags=["Cuentas"])
api_router.include_router(categorias.router, prefix="/categorias", tags=["Categorias"])
api_router.include_router(transacciones.router, prefix="/transacciones", tags=["Transacciones"])
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])