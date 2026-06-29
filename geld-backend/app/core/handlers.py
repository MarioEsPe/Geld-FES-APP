# app/core/handlers.py
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

async def sqlalchemy_integrity_error_handler(request: Request, exc: IntegrityError):
    """
    Intercepta errores de integridad de la base de datos (ej. llaves foráneas no encontradas, 
    registros duplicados) y devuelve un error HTTP 400 controlado.
    """
    # En un entorno de producción, aquí enviaríamos el error (exc) a un sistema de logs.
    
    return JSONResponse(
        status_code=400,
        content={
            "error": "Conflicto de Integridad en la Base de Datos",
            "detail": "Verifica que los IDs proporcionados (cuentas, categorías) existan y sean correctos, o que no estés duplicando información única."
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    """
    Red de seguridad final: Atrapa cualquier error no contemplado para que 
    el servidor nunca exponga la traza de ejecución al usuario final.
    """
    return JSONResponse(
        status_code=500,
        content={
            "error": "Error Interno del Servidor",
            "detail": "Ha ocurrido un problema inesperado. Contacta al administrador."
        }
    )