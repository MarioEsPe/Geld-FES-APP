# app/schemas/familia.py
from pydantic import BaseModel, Field, ConfigDict

# 1. Lo que requerimos que el usuario envíe para crear una familia
class FamiliaCreate(BaseModel):
    id: str = Field(..., max_length=50, description="ID único, ej. ALIMENTACION")
    nombre_familia: str = Field(..., max_length=100, description="Nombre de la familia de gastos")

# 2. Lo que le devolvemos al usuario cuando consulta una familia
class FamiliaRead(BaseModel):
    id: str
    nombre_familia: str
    
    # Esta configuración permite que Pydantic lea los objetos de SQLModel/Base de Datos
    model_config = ConfigDict(from_attributes=True)